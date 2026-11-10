import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createTestDatabase } from "./test-helper";
import { POST as register } from "../app/api/auth/register/route";
import { GET as publicShop, POST as publicBooking } from "../app/api/shops/[slug]/route";
import { GET as getShopSettings, PATCH as patchShopSettings, POST as postShopService } from "../app/api/shop/settings/route";
import { PATCH as patchShopBooking } from "../app/api/shop/bookings/[id]/route";
import { createSessionToken } from "../lib/auth";

let dbContext: Awaited<ReturnType<typeof createTestDatabase>>;

before(async () => {
  dbContext = await createTestDatabase("saas");
  (global as any).prisma = dbContext.prisma;
});

after(async () => {
  await dbContext.cleanup();
  delete (global as any).prisma;
});

test("registration atomically provisions a unique shop, owner membership, Free subscription, and starter service", async () => {
  const req = new NextRequest("http://localhost:3000/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Ari", email: "ari@example.com", password: "A-strong-password-123", shopName: "Ari Studio", slug: "ari-studio" }) });
  const res = await register(req);
  assert.equal(res.status, 201);
  const payload = await res.json();
  const shop = await dbContext.prisma.shop.findUnique({ where: { slug: "ari-studio" }, include: { members: true, subscription: { include: { plan: true } }, services: true } });
  assert.equal(shop?.ownerId, payload.user.id);
  assert.equal(shop?.members[0]?.role, "SHOP_OWNER");
  assert.equal(shop?.subscription?.plan.code, "FREE");
  assert.equal(shop?.services.length, 1);

  const duplicate = await register(new NextRequest("http://localhost:3000/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Ari", email: "ARI@example.com", password: "A-strong-password-123", shopName: "Another Shop", slug: "another-shop" }) }));
  assert.equal(duplicate.status, 409);
});

test("public shop API exposes public catalog only and rejects services belonging to another tenant", async () => {
  const profile = await dbContext.prisma.profile.create({ data: { email: "other-owner@example.com", displayName: "Other", passwordHash: "not-returned", role: "owner" } });
  const shop = await dbContext.prisma.shop.findFirstOrThrow({ where: { ownerId: profile.id } });
  const plan = await dbContext.prisma.plan.upsert({ where: { code: "FREE" }, create: { code: "FREE", name: "FREE", monthlyPrice: 0, serviceLimit: 1, bookingLimit: 20, staffLimit: 1 }, update: {} });
  await dbContext.prisma.subscription.create({ data: { shopId: shop.id, planId: plan.id } });
  const service = await dbContext.prisma.service.create({ data: { shopId: shop.id, name: "Consultation" } });

  const ownPublic = await publicShop(new NextRequest("http://localhost:3000/api/shops/ari-studio"), { params: Promise.resolve({ slug: "ari-studio" }) });
  assert.equal(ownPublic.status, 200);
  const body = await ownPublic.json();
  assert.equal(body.shop.name, "Ari Studio");
  assert.equal("ownerId" in body.shop, false);
  assert.equal("members" in body.shop, false);

  const crossTenant = await publicBooking(new NextRequest("http://localhost:3000/api/shops/ari-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, mode: "queue", customerName: "Guest" }) }), { params: Promise.resolve({ slug: "ari-studio" }) });
  assert.equal(crossTenant.status, 404);
});

test("concurrent queue bookings receive distinct sequential tickets", async () => {
  const owner = await dbContext.prisma.profile.create({ data: { email: "queue-owner@example.com", displayName: "Queue Owner", passwordHash: "x", role: "owner" } });
  const shop = await dbContext.prisma.shop.findFirstOrThrow({ where: { ownerId: owner.id } });
  const plan = await dbContext.prisma.plan.upsert({ where: { code: "FREE" }, create: { code: "FREE", name: "FREE", monthlyPrice: 0, serviceLimit: 1, bookingLimit: 20, staffLimit: 1 }, update: {} });
  await dbContext.prisma.subscription.create({ data: { shopId: shop.id, planId: plan.id } });
  const service = await dbContext.prisma.service.create({ data: { shopId: shop.id, name: "Reading" } });
  const create = (customerName: string) => publicBooking(new NextRequest(`http://localhost:3000/api/shops/${shop.slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, mode: "queue", customerName }) }), { params: Promise.resolve({ slug: shop.slug }) });
  const results = await Promise.all([create("One"), create("Two")]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 201]);
  const tickets = await Promise.all(results.map(async r => (await r.json()).booking.ticketNumber as string));
  assert.equal(new Set(tickets).size, 2);
  assert.equal(tickets[1]?.slice(-4) === tickets[0]?.slice(-4), false);
});

test("appointment booking rejects an already reserved overlapping slot", async () => {
  const owner = await dbContext.prisma.profile.create({ data: { email: "appointment-owner@example.com", displayName: "Appointment Owner", passwordHash: "x", role: "owner" } });
  const shop = await dbContext.prisma.shop.findFirstOrThrow({ where: { ownerId: owner.id } });
  const plan = await dbContext.prisma.plan.upsert({ where: { code: "FREE" }, create: { code: "FREE", name: "FREE", monthlyPrice: 0, serviceLimit: 1, bookingLimit: 20, staffLimit: 1 }, update: {} });
  await dbContext.prisma.subscription.create({ data: { shopId: shop.id, planId: plan.id } });
  const service = await dbContext.prisma.service.create({ data: { shopId: shop.id, name: "Appointment" } });
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const startsAt = new Date(`${tomorrow}T10:00:00+07:00`);
  const weekdayName = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "short" }).format(startsAt);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  await dbContext.prisma.businessHour.create({ data: { shopId: shop.id, weekday, opensAt: "09:00", closesAt: "17:00" } });
  const request = () => publicBooking(new NextRequest(`http://localhost:3000/api/shops/${shop.slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, mode: "appointment", customerName: "Guest", startsAt: startsAt.toISOString() }) }), { params: Promise.resolve({ slug: shop.slug }) });
  assert.equal((await request()).status, 201);
  assert.equal((await request()).status, 409);
});

test("shop settings API updates shop profile, enforces plan service limits, and updates tenant booking status", async () => {
  const ari = await dbContext.prisma.profile.findUniqueOrThrow({ where: { email: "ari@example.com" } });
  const token = await createSessionToken(ari.id);
  const authHeaders = {
    authorization: `Bearer ${token}`,
    cookie: `tarot_admin_session=${token}`,
    "content-type": "application/json",
  };

  // GET shop settings
  const getRes = await getShopSettings(new NextRequest("http://localhost:3000/api/shop/settings", { headers: authHeaders }));
  assert.equal(getRes.status, 200);
  const { shop } = await getRes.json();
  assert.equal(shop.slug, "ari-studio");

  // PATCH shop profile
  const patchRes = await patchShopSettings(
    new NextRequest("http://localhost:3000/api/shop/settings", {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Ari Cute Studio",
        description: "อบอุ่น น่ารัก พร้อมดูแล",
        phone: "081-234-5678",
        email: "contact@ari.example.com",
      }),
    })
  );
  assert.equal(patchRes.status, 200);
  const patched = await patchRes.json();
  assert.equal(patched.shop.name, "Ari Cute Studio");

  // FREE plan has serviceLimit = 1 and 1 active starter service already exists -> creating 2nd active service returns 409
  const blockedService = await postShopService(
    new NextRequest("http://localhost:3000/api/shop/settings", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ action: "create", name: "Extra Service", durationMins: 45, price: 500 }),
    })
  );
  assert.equal(blockedService.status, 409);

  // Create a booking and transition its status via /api/shop/bookings/[id]
  const bookRes = await publicBooking(
    new NextRequest("http://localhost:3000/api/shops/ari-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: shop.services[0].id, mode: "queue", customerName: "Nong Mint" }),
    }),
    { params: Promise.resolve({ slug: "ari-studio" }) }
  );
  assert.equal(bookRes.status, 201);
  const createdBooking = await dbContext.prisma.booking.findFirstOrThrow({
    where: { shopId: shop.id, customerName: "Nong Mint" },
  });

  const statusRes = await patchShopBooking(
    new NextRequest(`http://localhost:3000/api/shop/bookings/${createdBooking.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "in_progress" }),
    }),
    { params: Promise.resolve({ id: createdBooking.id }) }
  );
  assert.equal(statusRes.status, 200);
  const statusJson = await statusRes.json();
  assert.equal(statusJson.booking.status, "in_progress");
});

test("shop staff cannot change owner-only shop settings", async () => {
  const shop = await dbContext.prisma.shop.findUniqueOrThrow({ where: { slug: "ari-studio" } });
  const staff = await dbContext.prisma.profile.create({
    data: { email: "staff@ari.example.com", displayName: "Ari Staff", passwordHash: "x", role: "admin" },
  });
  const token = await createSessionToken(staff.id);
  const response = await patchShopSettings(new NextRequest("http://localhost:3000/api/shop/settings", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ name: "Unauthorized rename" }),
  }));

  assert.equal(response.status, 403);
  assert.equal((await dbContext.prisma.shop.findUniqueOrThrow({ where: { id: shop.id } })).name, "Ari Cute Studio");
});
