import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SUBSCRIPTION_REQUIRED } from "@/services/product";
import { getMonthStartInTimezone } from "@/lib/date";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({ where: { slug, isActive: true }, select: {
    id: true, name: true, slug: true, description: true, logoUrl: true, phone: true, email: true,
    services: { where: { isActive: true }, select: { id: true, name: true, description: true, durationMins: true, price: true } },
    hours: { orderBy: { weekday: "asc" }, select: { weekday: true, opensAt: true, closesAt: true, isClosed: true } },
  } });
  if (!shop) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });

  // Fetch public queue status & remaining queue count for this shop
  const [adminQueues, bookingQueues] = await Promise.all([
    prisma.queue.findMany({
      where: { shopId: shop.id },
      orderBy: [{ queueDate: "asc" }, { queueOrder: "asc" }, { createdAt: "asc" }],
      take: 60,
      select: {
        id: true,
        queueNumber: true,
        nickname: true,
        status: true,
        queueDate: true,
        queueOrder: true,
        updatedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: { shopId: shop.id, mode: "queue" },
      orderBy: [{ createdAt: "asc" }],
      take: 60,
      select: {
        id: true,
        ticketNumber: true,
        customerName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const normalizedBookings = bookingQueues.map((b, idx) => ({
    id: b.id,
    queueNumber: b.ticketNumber || `Q-${String(idx + 1).padStart(4, "0")}`,
    nickname: b.customerName,
    status: b.status === "confirmed" ? "waiting" : b.status,
    updatedAt: b.updatedAt.toISOString(),
  }));

  const normalizedAdmin = adminQueues.map((q) => ({
    id: q.id,
    queueNumber: q.queueNumber,
    nickname: q.nickname,
    status: q.status,
    updatedAt: q.updatedAt.toISOString(),
  }));

  const allItems = [...normalizedAdmin, ...normalizedBookings];
  const activeItems = allItems.filter((q) => q.status === "in_progress" || q.status === "waiting");

  // Calculate queuesAhead (เหลืออีกกี่คิว) for each queue
  const queuesWithAhead = allItems.map((q) => {
    if (q.status === "in_progress") {
      return { ...q, queuesAhead: 0 };
    }
    if (q.status === "waiting") {
      const idx = activeItems.findIndex((a) => a.id === q.id);
      return { ...q, queuesAhead: idx >= 0 ? idx : 0 };
    }
    return { ...q, queuesAhead: 0 };
  });

  const inProgressQueue = queuesWithAhead.find((q) => q.status === "in_progress") || null;
  const waitingQueues = queuesWithAhead.filter((q) => q.status === "waiting");

  return NextResponse.json(
    {
      shop,
      queueBoard: {
        inProgressQueue,
        nextWaitingQueue: waitingQueues[0] || null,
        totalWaiting: waitingQueues.length,
        totalActive: activeItems.length,
        queues: queuesWithAhead,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

const bookingInput = z.object({
  serviceId: z.string().uuid(), mode: z.enum(["queue", "appointment"]), customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email().max(255).optional().or(z.literal("")), customerPhone: z.string().trim().max(30).optional(),
  startsAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const input = bookingInput.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: "กรุณาตรวจสอบข้อมูลการจอง" }, { status: 400 });
    const { slug } = await params;
    const shop = await prisma.shop.findFirst({ where: { slug, isActive: true }, include: { subscription: { include: { plan: true } } } });
    if (!shop) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
    const service = await prisma.service.findFirst({ where: { id: input.data.serviceId, shopId: shop.id, isActive: true } });
    if (!service) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 404 });
    const monthStart = getMonthStartInTimezone(new Date(), shop.timezone);
    const monthlyBookings = await prisma.booking.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } });
    const limit = shop.subscription?.plan.bookingLimit;
    if (SUBSCRIPTION_REQUIRED && (!shop.subscription || shop.subscription.status !== "active" || (shop.subscription.expiresAt && shop.subscription.expiresAt < new Date()))) return NextResponse.json({ error: "แพ็กเกจร้านหมดอายุ กรุณาติดต่อร้าน" }, { status: 409 });
    if (SUBSCRIPTION_REQUIRED && limit !== null && limit !== undefined && monthlyBookings >= limit) return NextResponse.json({ error: "ร้านนี้ถึงจำนวนการจองสูงสุดของเดือนแล้ว" }, { status: 409 });

    let startsAt: Date; let ticketNumber: string | null = null;
    if (input.data.mode === "queue") {
      startsAt = new Date();
      const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: shop.timezone }).format(startsAt);
      const ticket = await prisma.$transaction(async (tx) => {
        const currentMonthBookings = await tx.booking.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } });
        if (SUBSCRIPTION_REQUIRED && limit !== null && limit !== undefined && currentMonthBookings >= limit) throw new Error("BOOKING_LIMIT");
        const counter = await tx.queueCounter.upsert({ where: { shopId_queueDate: { shopId: shop.id, queueDate: dateKey } }, create: { shopId: shop.id, queueDate: dateKey, lastNumber: 1 }, update: { lastNumber: { increment: 1 } } });
        const code = `Q-${dateKey.replaceAll("-", "")}-${String(counter.lastNumber).padStart(4, "0")}`;
        return tx.booking.create({ data: { shopId: shop.id, serviceId: service.id, customerName: input.data.customerName, customerEmail: input.data.customerEmail || null, customerPhone: input.data.customerPhone || null, startsAt, endsAt: startsAt, mode: "queue", ticketNumber: code } });
      }, { isolationLevel: "Serializable" });
      ticketNumber = ticket.ticketNumber;
    } else {
      if (!input.data.startsAt) return NextResponse.json({ error: "กรุณาเลือกเวลานัดหมาย" }, { status: 400 });
      startsAt = new Date(input.data.startsAt);
      if (startsAt.getTime() < Date.now() || startsAt.getTime() > Date.now() + 90 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "เวลานัดหมายไม่ถูกต้อง" }, { status: 400 });
      const endsAt = new Date(startsAt.getTime() + service.durationMins * 60000);
      const collision = await prisma.booking.findFirst({ where: { shopId: shop.id, status: { in: ["confirmed", "in_progress"] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
      if (collision) return NextResponse.json({ error: "ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น" }, { status: 409 });
      const local = new Intl.DateTimeFormat("en-US", { timeZone: shop.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(startsAt);
      const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(local.find(p => p.type === "weekday")?.value || "Sun");
      const time = `${local.find(p => p.type === "hour")?.value}:${local.find(p => p.type === "minute")?.value}`;
      const endParts = new Intl.DateTimeFormat("en-US", { timeZone: shop.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(endsAt);
      const endTime = `${endParts.find(p => p.type === "hour")?.value}:${endParts.find(p => p.type === "minute")?.value}`;
      const hours = await prisma.businessHour.findUnique({ where: { shopId_weekday: { shopId: shop.id, weekday } } });
      if (!hours || hours.isClosed || time < hours.opensAt || time >= hours.closesAt || endTime > hours.closesAt) return NextResponse.json({ error: "เวลาที่เลือกอยู่นอกเวลาทำการ" }, { status: 400 });
      try {
        await prisma.$transaction(async tx => {
          const currentMonthBookings = await tx.booking.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } });
          if (SUBSCRIPTION_REQUIRED && limit !== null && limit !== undefined && currentMonthBookings >= limit) throw new Error("BOOKING_LIMIT");
          const clash = await tx.booking.findFirst({ where: { shopId: shop.id, status: { in: ["confirmed", "in_progress"] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
          if (clash) throw new Error("BOOKING_COLLISION");
          await tx.booking.create({ data: { shopId: shop.id, serviceId: service.id, customerName: input.data.customerName, customerEmail: input.data.customerEmail || null, customerPhone: input.data.customerPhone || null, startsAt, endsAt, mode: "appointment" } });
        }, { isolationLevel: "Serializable" });
      } catch (error) { if ((error as Error).message === "BOOKING_COLLISION") return NextResponse.json({ error: "ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น" }, { status: 409 }); if ((error as Error).message === "BOOKING_LIMIT") return NextResponse.json({ error: "ร้านนี้ถึงจำนวนการจองสูงสุดของเดือนแล้ว" }, { status: 409 }); throw error; }
    }
    return NextResponse.json({ success: true, booking: { mode: input.data.mode, ticketNumber, startsAt } }, { status: 201 });
  } catch (error) {
    if ((error as Error)?.message === "BOOKING_LIMIT") return NextResponse.json({ error: "ร้านนี้ถึงจำนวนการจองสูงสุดของเดือนแล้ว" }, { status: 409 });
    console.error("Public booking failed", error);
    return NextResponse.json({ error: "จองไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
