import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorizedShop } from "@/lib/tenancy";

const schema = z.object({
  status: z.enum(["confirmed", "in_progress", "completed", "cancelled"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const shop = await getAuthorizedShop(user.id);
  if (!shop) return NextResponse.json({ error: "ไม่พบร้านที่ได้รับอนุญาต" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจองนี้" }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: parsed.data.status },
    include: { service: { select: { name: true, durationMins: true, price: true } } },
  });

  return NextResponse.json({ success: true, booking: updated });
}
