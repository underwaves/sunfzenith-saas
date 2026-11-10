"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  Ticket,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

type PublicQueueItem = {
  id: string;
  queueNumber: string;
  nickname: string;
  status: string;
  queuesAhead: number;
  updatedAt: string;
};

type QueueBoard = {
  inProgressQueue: PublicQueueItem | null;
  nextWaitingQueue: PublicQueueItem | null;
  totalWaiting: number;
  totalActive: number;
  queues: PublicQueueItem[];
};

type Shop = {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
};

export default function PublicShopQueueStatusPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const storageKey = `customer_selected_queue_${slug}`;

  const [shop, setShop] = useState<Shop | null>(null);
  const [board, setBoard] = useState<QueueBoard | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSelectedId(saved);
    } catch {
      // ignore storage error
    }
  }, [storageKey]);

  const fetchBoard = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch(
          `/api/shops/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่พบร้าน");
        }
        setShop(data.shop);
        setBoard(
          data.queueBoard || {
            inProgressQueue: null,
            nextWaitingQueue: null,
            totalWaiting: 0,
            totalActive: 0,
            queues: [],
          }
        );
        setLoadError("");
        setLastChecked(new Date().toLocaleTimeString("th-TH"));
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "โหลดสถานะคิวไม่สำเร็จ"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(() => fetchBoard(), 10000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  const selectQueue = (id: string) => {
    const next = selectedId === id ? "" : id;
    setSelectedId(next);
    try {
      if (next) localStorage.setItem(storageKey, next);
      else localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const selectedQueue = useMemo(
    () => board?.queues.find((q) => q.id === selectedId) || null,
    [board, selectedId]
  );

  const visibleQueues = useMemo(() => {
    if (!board) return [];
    const q = search.trim().toLowerCase();
    const list = board.queues.filter((item) =>
      q
        ? item.queueNumber.toLowerCase().includes(q) ||
          item.nickname.toLowerCase().includes(q)
        : item.status === "in_progress" || item.status === "waiting"
    );
    return list;
  }, [board, search]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-5">
        <div className="pastel-card p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pastel-purple/30 border-t-pastel-purple" />
          <p className="text-sm font-semibold text-pastel-deep">
            กำลังโหลดสถานะคิว… ✨
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !shop || !board) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-5">
        <div className="pastel-card p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-extrabold text-pastel-deep">
            {loadError || "ไม่พบข้อมูลร้าน"}
          </h1>
          <button
            type="button"
            onClick={() => fetchBoard(true)}
            className="btn-soft mx-auto text-xs"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  const currentHeroQueue =
    selectedQueue || board.inProgressQueue || board.nextWaitingQueue;

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Shop Branding Header */}
        <header className="text-center space-y-2 animate-pop-in">
          <div className="mx-auto inline-flex">
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                width={68}
                height={68}
                unoptimized
                alt={shop.name}
                className="h-16 w-16 rounded-3xl border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-3xl border-4 border-white bg-gradient-to-br from-pastel-purple to-pastel-pink text-white shadow-lg">
                <Store className="h-8 w-8" />
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-deep">
            {shop.name}
          </h1>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pastel-deep shadow-xs border border-pastel-lavender/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>สถานะคิวเรียลไทม์</span>
          </p>
        </header>

        {/* Main Queue Status & Remaining Queues Card */}
        <section className="pastel-card p-6 sm:p-7 space-y-5 border-pastel-lavender/80 shadow-2xl animate-pop-in">
          {currentHeroQueue ? (
            <>
              <div className="text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-pastel-babypink px-3 py-1 text-xs font-bold text-pastel-deep border border-pastel-pink/60">
                  <Ticket className="h-3.5 w-3.5 text-pastel-purple" />
                  {selectedQueue
                    ? "คิวที่คุณเลือกดู"
                    : currentHeroQueue.status === "in_progress"
                      ? "คิวที่กำลังให้บริการตอนนี้"
                      : "คิวถัดไป"}
                </span>

                <div className="mt-3 py-4 px-5 rounded-3xl bg-gradient-to-r from-pastel-lavender/30 via-pastel-babypink/40 to-pastel-blue/30 border border-pastel-purple/40">
                  <p className="text-xs font-semibold text-pastel-deep/70">
                    คุณ{currentHeroQueue.nickname}
                  </p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black font-mono tracking-tight text-pastel-deep">
                    {currentHeroQueue.queueNumber}
                  </p>
                  <div className="mt-3 flex justify-center">
                    <StatusBadge status={currentHeroQueue.status} size="lg" />
                  </div>
                </div>
              </div>

              {/* เหลืออีกกี่คิว (Queues Remaining Box) */}
              {currentHeroQueue.status === "waiting" && (
                <div className="text-center p-5 rounded-3xl bg-pastel-yellow/50 border border-amber-200 text-amber-950 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                    จำนวนคิวที่ต้องรอ
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-amber-950 py-1">
                    เหลืออีก {currentHeroQueue.queuesAhead} คิว
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    {currentHeroQueue.queuesAhead === 0
                      ? "เตรียมตัวได้เลย! คิวถัดไปคือคิวของคุณ ✨"
                      : `มีคิวก่อนหน้าคุณอยู่ ${currentHeroQueue.queuesAhead} คิว`}
                  </p>
                </div>
              )}

              {currentHeroQueue.status === "in_progress" && (
                <div className="text-center p-5 rounded-3xl bg-pastel-blue/50 border border-sky-200 text-sky-950 space-y-1.5">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <PlayCircle className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="text-2xl font-black text-sky-950">
                    ถึงคิวแล้ว! กำลังให้บริการ ✨
                  </div>
                  <p className="text-xs text-sky-800 font-medium">
                    เหลืออีก 0 คิว · กำลังดำเนินการอยู่ตอนนี้
                  </p>
                </div>
              )}

              {currentHeroQueue.status === "completed" && (
                <div className="text-center p-5 rounded-3xl bg-pastel-green/50 border border-emerald-200 text-emerald-950 space-y-1.5">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-black text-emerald-950">
                    ให้บริการเสร็จสิ้นแล้ว 💖
                  </div>
                </div>
              )}

              {currentHeroQueue.status === "cancelled" && (
                <div className="text-center p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
                  <div className="text-xl font-black text-rose-900">
                    คิวนี้ถูกยกเลิกแล้ว
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-pastel-green/70 text-emerald-700">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-pastel-deep">
                ตอนนี้ไม่มีคิวที่รออยู่
              </h2>
              <div className="mx-auto max-w-xs rounded-2xl bg-pastel-babypink/70 py-3 px-4 border border-pastel-pink/60">
                <p className="text-2xl font-black text-pastel-deep">
                  เหลืออีก 0 คิว
                </p>
                <p className="text-xs text-pastel-deep/70 mt-0.5">
                  พร้อมให้บริการทันที ✨
                </p>
              </div>
            </div>
          )}

          {/* Total Waiting Counter Pill */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="rounded-2xl bg-white/90 border border-pastel-lavender/60 p-3 text-center">
              <span className="block text-[11px] font-semibold text-pastel-deep/65">
                สถานะตอนนี้
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-pastel-deep">
                {board.inProgressQueue
                  ? `กำลังดูแล ${board.inProgressQueue.queueNumber}`
                  : board.totalWaiting > 0
                    ? "รอเรียกคิวถัดไป"
                    : "ว่าง พร้อมให้บริการ"}
              </span>
            </div>
            <div className="rounded-2xl bg-white/90 border border-pastel-lavender/60 p-3 text-center">
              <span className="block text-[11px] font-semibold text-pastel-deep/65">
                คิวที่รอทั้งหมด
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-pastel-deep">
                เหลืออีก {board.totalWaiting} คิว
              </span>
            </div>
          </div>

          {/* Queue List / Check Your Queue */}
          {board.queues.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-pastel-lavender/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pastel-deep">
                  เช็คคิวของคุณ (แตะที่คิวเพื่อดูสถานะ)
                </span>
                {selectedQueue && (
                  <button
                    type="button"
                    onClick={() => selectQueue("")}
                    className="text-[11px] font-semibold text-pastel-purple underline"
                  >
                    แสดงคิวปัจจุบัน
                  </button>
                )}
              </div>

              {board.queues.length > 3 && (
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาเลขคิว หรือ ชื่อของคุณ..."
                    className="cute-input pl-9 py-2 text-xs"
                  />
                </div>
              )}

              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {visibleQueues.map((q) => {
                  const isSelected = q.id === selectedId;
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => selectQueue(q.id)}
                        className={`w-full flex items-center justify-between gap-2 rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-pastel-purple bg-pastel-babypink/80 ring-2 ring-pastel-lavender"
                            : "border-pastel-lavender/50 bg-white/90 hover:border-pastel-purple/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-pastel-deep">
                              {q.queueNumber}
                            </span>
                            <span className="truncate text-xs font-semibold text-pastel-deep/80">
                              คุณ{q.nickname}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] font-bold text-pastel-purple">
                            {q.status === "in_progress"
                              ? "กำลังให้บริการอยู่ตอนนี้ ✨"
                              : q.status === "waiting"
                                ? `เหลืออีก ${q.queuesAhead} คิว`
                                : q.status === "completed"
                                  ? "เสร็จสิ้นแล้ว"
                                  : "ยกเลิกแล้ว"}
                          </p>
                        </div>
                        <StatusBadge status={q.status} size="sm" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Footer Auto-refresh bar */}
          <div className="pt-3 border-t border-pastel-lavender/40 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-pastel-purple" />
              อัปเดตล่าสุด: {lastChecked || "-"}
            </span>
            <button
              type="button"
              onClick={() => fetchBoard(true)}
              disabled={refreshing}
              className="flex items-center gap-1 text-pastel-deep hover:underline font-semibold p-1 rounded-lg transition"
            >
              <RefreshCw
                className={`w-3 h-3 ${refreshing ? "animate-spin text-pastel-deep" : ""}`}
              />
              <span>รีเฟรชสถานะ</span>
            </button>
          </div>
        </section>

        <p className="text-center text-[11px] text-gray-400">
          อัปเดตสถานะคิวอัตโนมัติทุก 10 วินาที ✨
        </p>
      </div>
    </main>
  );
}
