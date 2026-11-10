import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", service: "sunfzenith-queue-saas", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", service: "sunfzenith-queue-saas" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
