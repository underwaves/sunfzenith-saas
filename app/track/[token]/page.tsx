"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Moon,
  Star,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Heart,
  Wand2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { StatusBadge } from "@/components/StatusBadge";
import { useTemplateConfig } from "@/components/TemplateProvider";
import { BrandLogo } from "@/components/BrandLogo";

export default function CustomerTrackPage() {
  const params = useParams();
  const token = params?.token as string;
  const { config, hasLiveOverrides } = useTemplateConfig();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  const fetchQueueStatus = useCallback(async (isManual = false) => {
    if (!token) return;
    if (isManual) setIsRefreshing(true);

    try {
      const res = await fetch(`/api/track/${token}`);
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "ไม่พบข้อมูลคิว หรือลิงก์ไม่ถูกต้อง");
        setData(null);
      } else {
        setData(json);
        setErrorMsg(null);
        setLastChecked(new Date().toLocaleTimeString("th-TH"));

        // Trigger confetti celebration when completed
        if (json.status === "completed" && !confettiTriggered) {
          setConfettiTriggered(true);
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#D9C7FF", "#B9A0F5", "#FFD9E8", "#FFF1B8", "#D8F5E5"],
            });
          } catch {
            // ignore if canvas not supported
          }
        }
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, confettiTriggered]);

  useEffect(() => {
    fetchQueueStatus();
    // Auto refresh every 10 seconds for real-time customer tracking
    const interval = setInterval(() => {
      fetchQueueStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchQueueStatus]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative celestial background motifs */}
      <div className="absolute top-10 left-10 text-pastel-purple/40 animate-sparkle-slow pointer-events-none">
        <Sparkles className="w-10 h-10" />
      </div>
      <div className="absolute top-20 right-12 text-pastel-pink/50 animate-float-slow pointer-events-none">
        <Moon className="w-12 h-12" />
      </div>
      <div className="absolute bottom-12 left-12 text-pastel-blue/40 animate-pulse pointer-events-none">
        <Star className="w-8 h-8" />
      </div>
      <div className="absolute bottom-16 right-16 text-pastel-yellow/50 animate-sparkle-slow pointer-events-none">
        <Sparkles className="w-9 h-9" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <BrandLogo
            logoUrl={config.brand.logoUrl}
            iconName={config.brand.icon}
            alt={config.brand.fullName}
            size="lg"
            className="transform hover:scale-105 transition duration-300"
            iconClassName="animate-pulse"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-deep font-magic tracking-wider">
            {hasLiveOverrides ? config.brand.fullName : data?.shopName || config.brand.fullName}
          </h1>
          <p className="text-xs text-pastel-deep/80 font-medium flex items-center justify-center gap-1">
            <span>✨</span> {config.labels.customerTracking.subtitle} <span>✨</span>
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="pastel-card p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-pastel-purple/30 border-t-pastel-purple animate-spin" />
            <p className="text-sm font-semibold text-pastel-deep animate-pulse">
              กำลังเชื่อมโยงพลังแห่งดวงดาว... ✨
            </p>
          </div>
        )}

        {/* Error / Revoked State */}
        {!loading && errorMsg && (
          <div className="pastel-card p-8 text-center space-y-4 border-rose-200 bg-rose-50/70">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900 mb-1">
                ไม่พบข้อมูลคิว
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={() => fetchQueueStatus(true)}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-50 transition shadow-xs"
            >
              ลองตรวจสอบอีกครั้ง
            </button>
          </div>
        )}

        {/* Active Queue Tracking Display */}
        {!loading && data && (
          <div className="pastel-card p-6 sm:p-8 space-y-6 border-pastel-lavender/80 shadow-2xl relative">
            {/* Customer Greeting */}
            <div className="text-center pb-4 border-b border-pastel-lavender/40">
              <span className="text-xs text-gray-500">คิวของ</span>
              <h2 className="text-lg sm:text-xl font-bold text-pastel-deep mt-0.5">
                คุณ{data.nickname} ♡
              </h2>
            </div>

            {/* Queue Number & Status Box */}
            <div className="text-center py-4 px-6 rounded-2xl bg-gradient-to-r from-pastel-lavender/30 via-pastel-babypink/40 to-pastel-blue/30 border border-pastel-purple/40">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                เลขคิวของคุณ
              </span>
              <div className="text-3xl sm:text-4xl font-black text-pastel-deep font-mono tracking-tight">
                {data.queueNumber}
              </div>
              <div className="mt-3 flex justify-center">
                <StatusBadge status={data.status} size="lg" />
              </div>
            </div>

            {/* Queues Ahead Display (เหลืออีกกี่คิว) */}
            {data.status === "waiting" && (
              <div className="text-center p-5 rounded-2xl bg-pastel-yellow/50 border border-amber-200 text-amber-950 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  จำนวนคิวที่ต้องรอ
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-950 py-1">
                  เหลืออีก {data.queuesAhead} คิว
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  {data.queuesAhead === 0
                    ? "เตรียมตัวได้เลย! คิวถัดไปคือคิวของคุณ ✨"
                    : `มีคิวก่อนหน้าคุณอยู่ ${data.queuesAhead} คิว`}
                </p>
              </div>
            )}

            {data.status === "in_progress" && (
              <div className="text-center p-5 rounded-2xl bg-pastel-blue/50 border border-blue-200 text-blue-950 space-y-2 animate-pulse-subtle">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 animate-spin" />
                </div>
                <h3 className="text-xl font-black text-blue-900">
                  ถึงคิวของคุณแล้ว! กำลังให้บริการ ✨
                </h3>
                <p className="text-xs text-blue-800 font-medium">
                  เหลืออีก 0 คิว · กำลังดำเนินการอยู่ตอนนี้
                </p>
              </div>
            )}

            {data.status === "completed" && (
              <div className="text-center p-5 rounded-2xl bg-pastel-green/50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">
                  {config.labels.customerTracking.completedTitle}
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {config.labels.customerTracking.completedDescription}
                </p>
              </div>
            )}

            {data.status === "cancelled" && (
              <div className="text-center p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-rose-900">
                  {config.labels.customerTracking.cancelledTitle}
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {config.labels.customerTracking.cancelledDescription}
                </p>
              </div>
            )}

            {/* Footer Update Info */}
            <div className="pt-4 border-t border-pastel-lavender/40 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-pastel-purple" />
                อัปเดตล่าสุด: {lastChecked || "-"}
              </span>

              <button
                onClick={() => fetchQueueStatus(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-pastel-deep hover:underline font-semibold p-1 rounded-lg transition"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-pastel-deep" : ""}`} />
                <span>รีเฟรชสถานะ</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom subtle note */}
        <p className="text-center text-[11px] text-gray-400">
          หน้านี้จะรีเฟรชข้อมูลอัตโนมัติทุก 10 วินาทีโดยที่คุณไม่ต้องกดรีเฟรชเบราว์เซอร์ ✨
        </p>
      </div>
    </div>
  );
}
