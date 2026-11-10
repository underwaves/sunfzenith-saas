import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireShop } from "@/lib/tenancy";
import { logAudit } from "@/lib/audit";
import { getBangkokToday } from "@/lib/date";
import { isValidCalendarDate } from "@/lib/validation";
import {
  ExportQueueRow,
  formatBangkokDateTime,
  generateQueuesCsvString,
  generateQueuesExcelBuffer,
} from "@/lib/excel";

const VALID_STATUSES = [
  "all",
  "pending",
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth("view_queues", req);
    const shop = await requireShop(user.id);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const format = (searchParams.get("format") || "xlsx").toLowerCase();

    if (!VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { error: `ค่าสถานะ '${status}' ไม่ถูกต้อง` },
        { status: 400 }
      );
    }

    if (startDate && !isValidCalendarDate(startDate)) {
      return NextResponse.json(
        { error: "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (endDate && !isValidCalendarDate(endDate)) {
      return NextResponse.json(
        { error: "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const where: any = { shopId: shop.id };

    if (search) {
      where.OR = [
        { queueNumber: { contains: search } },
        { nickname: { contains: search } },
        { packageName: { contains: search } },
        { details: { contains: search } },
      ];
    }

    if (status !== "all") {
      if (status === "pending") {
        where.status = { in: ["waiting", "in_progress"] };
      } else {
        where.status = status;
      }
    }

    if (startDate && endDate) {
      where.queueDate = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.queueDate = { gte: startDate };
    } else if (endDate) {
      where.queueDate = { lte: endDate };
    }

    const queues = await prisma.queue.findMany({
      where,
      orderBy: [
        { queueDate: "asc" },
        { queueOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        creator: {
          select: { id: true, displayName: true, email: true },
        },
        assignee: {
          select: { id: true, displayName: true, email: true },
        },
        tokens: {
          where: { revokedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(req.url).origin;
    const now = new Date();

    const rows: ExportQueueRow[] = queues.map((q) => {
      const activeToken = q.tokens.find(
        (t) => !t.revokedAt && (!t.expiresAt || t.expiresAt > now)
      );
      const rawToken = activeToken?.token;
      const trackingUrl = rawToken ? `${origin}/track/${rawToken}` : "-";

      return {
        queueNumber: q.queueNumber,
        queueDate: q.queueDate,
        queueOrder: q.queueOrder,
        nickname: q.nickname,
        packageName: q.packageName,
        questionCount: q.questionCount,
        status: q.status,
        details: q.details,
        internalNote: q.internalNote,
        trackingUrl,
        creatorName: q.creator?.displayName || "-",
        assigneeName: q.assignee?.displayName || "-",
        createdAtFormatted: formatBangkokDateTime(q.createdAt),
        completedAtFormatted: formatBangkokDateTime(q.completedAt),
        cancelledAtFormatted: formatBangkokDateTime(q.cancelledAt),
      };
    });

    const stats = {
      total: rows.length,
      waiting: rows.filter((r) => r.status === "waiting").length,
      inProgress: rows.filter((r) => r.status === "in_progress").length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
      totalQuestions: rows.reduce((sum, r) => sum + (r.questionCount || 0), 0),
    };

    if (format === "json") {
      return NextResponse.json({
        queues: rows,
        stats,
      });
    }

    const todayStr = getBangkokToday();

    await logAudit({
      actorId: user.id,
      actorName: user.displayName,
      action: "EXPORT_QUEUES",
      entityType: "queue",
      entityId: "export",
      newValues: {
        format,
        status,
        startDate: startDate || "all",
        endDate: endDate || "all",
        exportedCount: rows.length,
      },
      details: `ส่งออกข้อมูลคิวทั้งหมด ${rows.length} รายการ เป็นไฟล์ .${format.toUpperCase()}`,
    });

    if (format === "csv") {
      const csvContent = generateQueuesCsvString(rows);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="augg-tarot-queues-${todayStr}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const xlsxBuffer = generateQueuesExcelBuffer(rows);
    return new NextResponse(Buffer.from(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="augg-tarot-queues-${todayStr}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการส่งออกข้อมูลคิว" },
        { status: 403 }
      );
    }
    console.error("Export queues error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งออกข้อมูลคิว" },
      { status: 500 }
    );
  }
}
