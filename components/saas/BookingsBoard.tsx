"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  Phone,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Ticket,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/Toast";

export interface BookingItem {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  mode: string;
  status: string;
  ticketNumber: string | null;
  startsAt: string;
  createdAt: string;
  service: {
    name: string;
    durationMins: number;
    price: number;
  };
}

const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  confirmed: {
    label: "รอรับบริการ",
    badge: "bg-pastel-yellow/80 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "กำลังให้บริการ",
    badge: "bg-pastel-blue/90 text-sky-800 border-sky-200",
    dot: "bg-sky-500 animate-pulse",
  },
  completed: {
    label: "เสร็จสิ้น",
    badge: "bg-pastel-green/90 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "ยกเลิก",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-400",
  },
};

export function BookingsBoard({
  initialBookings,
  shopSlug,
}: {
  initialBookings: BookingItem[];
  shopSlug: string;
}) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "active") {
      return bookings.filter(
        (b) => b.status === "confirmed" || b.status === "in_progress"
      );
    }
    if (tab === "completed") {
      return bookings.filter(
        (b) => b.status === "completed" || b.status === "cancelled"
      );
    }
    return bookings;
  }, [bookings, tab]);

  const activeCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "confirmed" || b.status === "in_progress"
      ).length,
    [bookings]
  );

  async function updateStatus(
    id: string,
    status: "confirmed" | "in_progress" | "completed" | "cancelled"
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/shop/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "อัปเดตสถานะไม่สำเร็จ", "error");
        return;
      }
      setBookings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: data.booking.status } : item
        )
      );
      const statusText = STATUS_META[status]?.label || status;
      showToast(`อัปเดตสถานะเป็น "${statusText}" เรียบร้อย ✨`, "success");
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="pastel-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-pastel-deep">
            <Sparkles className="h-5 w-5 text-pastel-purple" />
            <span>รายการจองจากหน้าร้านออนไลน์</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-pastel-pink px-2.5 py-0.5 text-xs font-bold text-pastel-deep">
                {activeCount} รอดำเนินการ
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-pastel-deep/65">
            บัตรคิวและนัดหมายที่ลูกค้าจองผ่านหน้า{" "}
            <Link
              href={`/shop/${shopSlug}`}
              target="_blank"
              className="font-semibold text-pastel-purple underline"
            >
              /shop/{shopSlug}
            </Link>
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-pastel-lavender/30 p-1 text-xs font-semibold">
          {(
            [
              ["active", `กำลังดูแล (${activeCount})`],
              ["completed", "เสร็จสิ้น/ยกเลิก"],
              ["all", `ทั้งหมด (${bookings.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl px-3 py-1.5 transition ${
                tab === key
                  ? "bg-white text-pastel-deep shadow-xs"
                  : "text-pastel-deep/65 hover:text-pastel-deep"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-pastel-lavender bg-white/60 p-8 text-center">
          <p className="text-4xl">🌸</p>
          <p className="mt-2 font-bold text-pastel-deep">
            {tab === "active"
              ? "ยังไม่มีคิวหรือนัดหมายที่รอดำเนินการ"
              : "ยังไม่มีรายการในหมวดนี้"}
          </p>
          <p className="mt-1 text-xs text-pastel-deep/65">
            ลองเปิดหน้าร้านสาธารณะแล้วทดลองกดจองคิวดูได้เลยค่ะ
          </p>
          <Link
            href={`/shop/${shopSlug}`}
            target="_blank"
            className="btn-soft mt-4 inline-flex py-2 text-xs"
          >
            เปิดหน้าร้านเพื่อทดลองจอง <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((b) => {
            const meta = STATUS_META[b.status] || STATUS_META.confirmed;
            const isQueue = b.mode === "queue";
            const isBusy = busyId === b.id;

            return (
              <li
                key={b.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-pastel-lavender/60 bg-white/85 p-4 shadow-xs transition hover:border-pastel-purple/60 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-extrabold text-pastel-deep ${
                      isQueue
                        ? "bg-gradient-to-br from-pastel-lavender to-pastel-pink"
                        : "bg-gradient-to-br from-pastel-blue to-pastel-lavender"
                    }`}
                  >
                    {isQueue ? (
                      <Ticket className="h-5 w-5" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-pastel-deep">
                        {b.customerName}
                      </span>
                      {b.ticketNumber && (
                        <span className="rounded-lg bg-pastel-babypink px-2 py-0.5 font-mono text-xs font-bold text-pastel-deep border border-pastel-pink/60">
                          {b.ticketNumber}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pastel-deep/75">
                      <span className="font-semibold text-pastel-deep">
                        {b.service.name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5 text-pastel-purple" />
                        {isQueue
                          ? `รับคิวเมื่อ ${new Date(b.createdAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : `นัด ${new Date(b.startsAt).toLocaleString("th-TH", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}`}
                      </span>
                      {b.customerPhone && (
                        <a
                          href={`tel:${b.customerPhone}`}
                          className="inline-flex items-center gap-1 text-pastel-purple hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {b.customerPhone}
                        </a>
                      )}
                      {b.customerEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {b.customerEmail}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                  {b.status === "confirmed" && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b.id, "in_progress")}
                        className="inline-flex items-center gap-1 rounded-xl bg-pastel-blue px-3 py-2 text-xs font-bold text-sky-900 transition hover:brightness-95 disabled:opacity-50"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        เรียกคิว / เริ่ม
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b.id, "completed")}
                        className="inline-flex items-center gap-1 rounded-xl bg-pastel-green px-3 py-2 text-xs font-bold text-emerald-900 transition hover:brightness-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        เสร็จสิ้น
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        ยกเลิก
                      </button>
                    </>
                  )}

                  {b.status === "in_progress" && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b.id, "completed")}
                        className="inline-flex items-center gap-1 rounded-xl bg-pastel-green px-3.5 py-2 text-xs font-bold text-emerald-900 transition hover:brightness-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        บริการเสร็จสิ้น
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        ยกเลิก
                      </button>
                    </>
                  )}

                  {(b.status === "completed" || b.status === "cancelled") && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateStatus(b.id, "confirmed")}
                      className="inline-flex items-center gap-1 rounded-xl border border-pastel-lavender bg-white px-3 py-1.5 text-xs font-semibold text-pastel-deep transition hover:bg-pastel-babypink/60 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      คืนสถานะรอคิว
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
