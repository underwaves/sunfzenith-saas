import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorizedShop } from "@/lib/tenancy";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateShopSchema = z.object({
  name: z.string().trim().min(2, "ชื่อร้านต้องมีอย่างน้อย 2 ตัวอักษร").max(100),
  description: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")).nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  hours: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        opensAt: z.string().regex(HHMM, "เวลาเปิดต้องเป็น HH:MM"),
        closesAt: z.string().regex(HHMM, "เวลาปิดต้องเป็น HH:MM"),
        isClosed: z.boolean(),
      })
    )
    .length(7)
    .optional(),
});

const serviceActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    name: z.string().trim().min(1, "กรุณาระบุชื่อบริการ").max(100),
    description: z.string().trim().max(250).optional().nullable(),
    durationMins: z.number().int().min(5).max(480),
    price: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    name: z.string().trim().min(1, "กรุณาระบุชื่อบริการ").max(100),
    description: z.string().trim().max(250).optional().nullable(),
    durationMins: z.number().int().min(5).max(480),
    price: z.number().int().min(0).max(1_000_000),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().uuid(),
  }),
]);

async function requireAuthorizedShop(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  }
  const shop = await getAuthorizedShop(user.id);
  if (!shop) {
    return { ok: false as const, response: NextResponse.json({ error: "ไม่พบร้านที่ได้รับอนุญาต" }, { status: 403 }) };
  }
  return { ok: true as const, user, shop };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuthorizedShop(req);
  if (!auth.ok) return auth.response;

  const fullShop = await prisma.shop.findUnique({
    where: { id: auth.shop.id },
    include: {
      services: { orderBy: { createdAt: "asc" } },
      hours: { orderBy: { weekday: "asc" } },
      subscription: { include: { plan: true } },
    },
  });

  return NextResponse.json({ shop: fullShop });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthorizedShop(req);
  if (!auth.ok) return auth.response;
  if (auth.shop.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่แก้ไขการตั้งค่าได้" }, { status: 403 });
  }

  try {
    const parsed = updateShopSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { name, description, phone, email, logoUrl, hours } = parsed.data;

    if (hours) {
      for (const h of hours) {
        if (!h.isClosed && h.opensAt >= h.closesAt) {
          return NextResponse.json(
            { error: "เวลาเปิดต้องน้อยกว่าเวลาปิดในวันที่เปิดทำการ" },
            { status: 400 }
          );
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id: auth.shop.id },
        data: {
          name,
          description: description || null,
          phone: phone || null,
          email: email || null,
          logoUrl: logoUrl || null,
        },
      });

      if (hours) {
        for (const h of hours) {
          await tx.businessHour.upsert({
            where: { shopId_weekday: { shopId: auth.shop.id, weekday: h.weekday } },
            create: {
              shopId: auth.shop.id,
              weekday: h.weekday,
              opensAt: h.opensAt,
              closesAt: h.closesAt,
              isClosed: h.isClosed,
            },
            update: {
              opensAt: h.opensAt,
              closesAt: h.closesAt,
              isClosed: h.isClosed,
            },
          });
        }
      }
    });

    const updated = await prisma.shop.findUnique({
      where: { id: auth.shop.id },
      include: {
        services: { orderBy: { createdAt: "asc" } },
        hours: { orderBy: { weekday: "asc" } },
        subscription: { include: { plan: true } },
      },
    });

    return NextResponse.json({ success: true, shop: updated });
  } catch (error) {
    console.error("Update shop settings failed", error);
    return NextResponse.json({ error: "บันทึกการตั้งค่าไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthorizedShop(req);
  if (!auth.ok) return auth.response;
  if (auth.shop.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่จัดการบริการได้" }, { status: 403 });
  }

  try {
    const parsed = serviceActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลบริการไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { shopId: auth.shop.id },
      include: { plan: true },
    });
    const serviceLimit = subscription?.plan.serviceLimit ?? null;

    if (parsed.data.action === "create") {
      const activeCount = await prisma.service.count({
        where: { shopId: auth.shop.id, isActive: true },
      });
      if (serviceLimit !== null && activeCount >= serviceLimit) {
        return NextResponse.json(
          {
            error: `แพ็กเกจ ${subscription?.plan.name || "ปัจจุบัน"} เปิดใช้งานบริการได้สูงสุด ${serviceLimit} รายการ (สามารถปิดบริการเดิมก่อน หรืออัปเกรดแพ็กเกจ)`,
          },
          { status: 409 }
        );
      }

      const service = await prisma.service.create({
        data: {
          shopId: auth.shop.id,
          name: parsed.data.name,
          description: parsed.data.description || null,
          durationMins: parsed.data.durationMins,
          price: parsed.data.price,
          isActive: true,
        },
      });
      return NextResponse.json({ success: true, service }, { status: 201 });
    }

    if (parsed.data.action === "update") {
      const existing = await prisma.service.findFirst({
        where: { id: parsed.data.id, shopId: auth.shop.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "ไม่พบบริการนี้" }, { status: 404 });
      }

      if (!existing.isActive && parsed.data.isActive && serviceLimit !== null) {
        const activeCount = await prisma.service.count({
          where: { shopId: auth.shop.id, isActive: true },
        });
        if (activeCount >= serviceLimit) {
          return NextResponse.json(
            {
              error: `แพ็กเกจปัจจุบันเปิดใช้งานบริการได้สูงสุด ${serviceLimit} รายการ`,
            },
            { status: 409 }
          );
        }
      }

      const service = await prisma.service.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description || null,
          durationMins: parsed.data.durationMins,
          price: parsed.data.price,
          isActive: parsed.data.isActive,
        },
      });
      return NextResponse.json({ success: true, service });
    }

    if (parsed.data.action === "delete") {
      const existing = await prisma.service.findFirst({
        where: { id: parsed.data.id, shopId: auth.shop.id },
        include: { _count: { select: { bookings: true } } },
      });
      if (!existing) {
        return NextResponse.json({ error: "ไม่พบบริการนี้" }, { status: 404 });
      }
      if (existing._count.bookings > 0) {
        // Soft-deactivate if already referenced by bookings
        await prisma.service.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
        return NextResponse.json({
          success: true,
          softDeleted: true,
          message: "บริการนี้มีประวัติการจอง ระบบจึงซ่อนจากหน้าร้านแทนการลบถาวร",
        });
      }
      await prisma.service.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "มีบริการชื่อนี้อยู่ในร้านแล้ว" }, { status: 409 });
    }
    console.error("Service action failed", error);
    return NextResponse.json({ error: "จัดการบริการไม่สำเร็จ" }, { status: 500 });
  }
}
