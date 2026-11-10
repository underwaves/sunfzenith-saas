import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { slugifyShopName } from "@/lib/tenancy";
import { seedDefaultPlans } from "@/lib/plans";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(10).max(128),
  shopName: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(48).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const { name, shopName, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.profile.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "อีเมลนี้ลงทะเบียนแล้ว" }, { status: 409 });

    let slug = parsed.data.slug || slugifyShopName(shopName);
    if (!slug) return NextResponse.json({ error: "กรุณาระบุชื่อ URL ร้านเป็นภาษาอังกฤษหรือตัวเลข" }, { status: 400 });
    if (await prisma.shop.findUnique({ where: { slug }, select: { id: true } })) {
      if (parsed.data.slug) return NextResponse.json({ error: "URL ร้านนี้ถูกใช้แล้ว" }, { status: 409 });
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      if (await prisma.shop.findUnique({ where: { slug }, select: { id: true } })) return NextResponse.json({ error: "ชื่อร้านนี้ถูกใช้แล้ว กรุณาเลือก URL ร้าน" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      await seedDefaultPlans(tx);
      const profile = await tx.profile.create({ data: { email, displayName: name, passwordHash, role: "owner" } });
      const shop = await tx.shop.create({ data: {
        ownerId: profile.id, name: shopName, slug,
        hours: { create: Array.from({ length: 7 }, (_, weekday) => ({ weekday, opensAt: "09:00", closesAt: "17:00", isClosed: false })) },
      } });
      await tx.shopMember.create({ data: { shopId: shop.id, userId: profile.id, role: "SHOP_OWNER" } });
      const plan = await tx.plan.findUniqueOrThrow({ where: { code: "FREE" } });
      await tx.subscription.create({ data: { shopId: shop.id, planId: plan.id } });
      await tx.service.create({ data: { shopId: shop.id, name: "บริการทั่วไป", durationMins: 30, price: 0 } });
      return { profile, shop };
    });
    await setSessionCookie(result.profile.id);
    return NextResponse.json({ success: true, user: { id: result.profile.id, email, displayName: name }, shop: { name: result.shop.name, slug: result.shop.slug } }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return NextResponse.json({ error: "อีเมลหรือ URL ร้านนี้ถูกใช้แล้ว" }, { status: 409 });
    console.error("Registration failed", error);
    return NextResponse.json({ error: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
