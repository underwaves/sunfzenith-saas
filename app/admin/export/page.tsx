"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  Filter,
  FileText,
  Table,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { useTemplateConfig } from "@/components/TemplateProvider";

interface ExportQueueRow {
  queueNumber: string;
  queueDate: string;
  queueOrder: number;
  nickname: string;
  packageName: string;
  questionCount: number;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  details: string | null;
  internalNote: string | null;
  trackingUrl: string;
  creatorName: string;
  assigneeName: string;
  createdAtFormatted: string;
  completedAtFormatted: string;
  cancelledAtFormatted: string;
}

interface ExportStats {
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalQuestions: number;
}

export default function ExportQueuesPage() {
  const { showToast } = useToast();
  const { config } = useTemplateConfig();

  const [queues, setQueues] = useState<ExportQueueRow[]>([]);
  const [stats, setStats] = useState<ExportStats>({
    total: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const buildQueryParams = useCallback(
    (format: "json" | "xlsx" | "csv", overrideAll = false) => {
      const params = new URLSearchParams();
      params.set("format", format);

      if (!overrideAll) {
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }
      }
      return params.toString();
    },
    [statusFilter, startDate, endDate, searchTerm]
  );

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      const query = buildQueryParams("json");
      const res = await fetch(`/api/queues/export?${query}`);
      if (res.ok) {
        const data = await res.json();
        setQueues(data.queues || []);
        setStats(
          data.stats || {
            total: 0,
            waiting: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            totalQuestions: 0,
          }
        );
      } else {
        const err = await res.json();
        showToast(err.error || "ไม่สามารถโหลดข้อมูลตัวอย่างได้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลคิว", "error");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, showToast]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleDownload = async (format: "xlsx" | "csv", exportAll = false) => {
    try {
      const key = `${format}-${exportAll ? "all" : "filtered"}`;
      setDownloadingFormat(key);
      const query = buildQueryParams(format, exportAll);
      const res = await fetch(`/api/queues/export?${query}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "ไม่สามารถดาวน์โหลดไฟล์ได้", "error");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
      }).format(new Date());

      a.href = url;
      a.download = `${config.brand.exportFilePrefix}-${exportAll ? "all" : "filtered"}-${today}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        `ดาวน์โหลดไฟล์ Excel (.${format.toUpperCase()}) สำเร็จ ✨`,
        "success"
      );
    } catch {
      showToast("เกิดข้อผิดพลาดขณะดาวน์โหลดไฟล์", "error");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const setQuickDateToday = () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(new Date());
    setStartDate(today);
    setEndDate(today);
  };

  const setQuickDateThisMonth = () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(new Date());
    const [year, month] = today.split("-");
    const firstDay = `${year}-${month}-01`;
    const lastDayNum = new Date(Number(year), Number(month), 0).getDate();
    const lastDay = `${year}-${month}-${String(lastDayNum).padStart(2, "0")}`;
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const hasActiveFilters =
    statusFilter !== "all" || Boolean(startDate) || Boolean(endDate) || Boolean(searchTerm.trim());

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-pastel-deep/80 text-xs font-bold uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4 text-pastel-purple" />
              <span>ระบบสำรองและส่งออกข้อมูล (Excel Backup & Export)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-deep font-magic">
              บันทึกคิวทั้งหมดลงเป็น Excel 📊
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ดาวน์โหลดข้อมูลคิวลูกค้าทั้งหมดเก็บไว้ในเครื่องเป็นไฟล์ Excel (.xlsx) หรือ CSV รองรับภาษาไทย 100%
            </p>
          </div>

          {/* One-Click Full Backup Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleDownload("xlsx", true)}
              disabled={downloadingFormat !== null}
              className="btn-magical px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md disabled:opacity-60"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {downloadingFormat === "xlsx-all"
                  ? "กำลังสร้างไฟล์ Excel..."
                  : "บันทึกคิวทั้งหมดเป็น Excel (.xlsx)"}
              </span>
            </button>

            <button
              onClick={() => handleDownload("csv", true)}
              disabled={downloadingFormat !== null}
              className="px-4 py-3 rounded-xl text-sm font-semibold bg-white hover:bg-pastel-babypink text-pastel-deep border border-pastel-lavender shadow-xs flex items-center gap-2 transition disabled:opacity-60"
            >
              <FileText className="w-4 h-4 text-pastel-deep" />
              <span>
                {downloadingFormat === "csv-all"
                  ? "กำลังสร้าง CSV..."
                  : "ดาวน์โหลด CSV (.csv)"}
              </span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="pastel-card p-4 border-pastel-lavender/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-lavender/50 text-pastel-deep flex items-center justify-center shrink-0">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">จำนวนคิวที่จะบันทึก</p>
              <p className="text-xl font-extrabold text-pastel-deep">
                {stats.total} <span className="text-xs font-normal">คิว</span>
              </p>
            </div>
          </div>

          <div className="pastel-card p-4 border-amber-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">รอคิว</p>
              <p className="text-xl font-extrabold text-amber-700">
                {stats.waiting} <span className="text-xs font-normal">คิว</span>
              </p>
            </div>
          </div>

          <div className="pastel-card p-4 border-blue-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">กำลังดำเนินการ</p>
              <p className="text-xl font-extrabold text-blue-700">
                {stats.inProgress} <span className="text-xs font-normal">คิว</span>
              </p>
            </div>
          </div>

          <div className="pastel-card p-4 border-emerald-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">เสร็จสิ้นแล้ว</p>
              <p className="text-xl font-extrabold text-emerald-700">
                {stats.completed} <span className="text-xs font-normal">คิว</span>
              </p>
            </div>
          </div>

          <div className="pastel-card p-4 border-rose-200/60 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ยกเลิก / {config.labels.unitName}รวม</p>
              <p className="text-sm font-extrabold text-rose-700">
                {stats.cancelled} คิว{" "}
                <span className="text-gray-400 font-normal">|</span>{" "}
                <span className="text-pastel-deep">{stats.totalQuestions} {config.labels.unitName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Custom Export Panel */}
        <div className="pastel-card p-5 border-pastel-lavender/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pastel-lavender/30 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-pastel-deep" />
              <h2 className="text-sm font-bold text-pastel-deep">
                ตัวกรองข้อมูลก่อนบันทึกเป็น Excel (เลือกกรองตามวันที่หรือสถานะได้)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={setQuickDateToday}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-pastel-lavender/30 hover:bg-pastel-lavender/60 text-pastel-deep transition"
              >
                เฉพาะวันนี้
              </button>
              <button
                type="button"
                onClick={setQuickDateThisMonth}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-pastel-lavender/30 hover:bg-pastel-lavender/60 text-pastel-deep transition"
              >
                เฉพาะเดือนนี้
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                >
                  ล้างตัวกรอง (ดูทั้งหมด)
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                ค้นหาชื่อลูกค้า / เลขคิว / แพ็กเกจ
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="พิมพ์คำค้นหา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                สถานะคิว
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm font-semibold text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
              >
                <option value="all">ทุกสถานะ (ทั้งหมด)</option>
                <option value="pending">คิวที่ยังค้าง (รอคิว + กำลังดูดวง)</option>
                <option value="waiting">รอคิวเท่านั้น</option>
                <option value="in_progress">กำลังดำเนินการเท่านั้น</option>
                <option value="completed">เสร็จสิ้นแล้วเท่านั้น</option>
                <option value="cancelled">ยกเลิกเท่านั้น</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                ตั้งแต่วันที่รับคิว
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                ถึงวันที่รับคิว
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>
            </div>
          </div>

          {/* Filtered Download Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-pastel-lavender/30">
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pastel-purple shrink-0" />
              <span>
                ไฟล์ Excel (.xlsx) จะประกอบด้วย <strong>2 ชีตอัตโนมัติ</strong> คือ{" "}
                <span className="font-bold text-pastel-deep">&quot;รายการคิวทั้งหมด&quot;</span> และ{" "}
                <span className="font-bold text-pastel-deep">&quot;สรุปภาพรวม&quot;</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchPreview}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>รีเฟรชข้อมูล</span>
              </button>

              <button
                onClick={() => handleDownload("xlsx", false)}
                disabled={downloadingFormat !== null || queues.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  ดาวน์โหลดตามตัวกรอง ({queues.length} คิว) .XLSX
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Data Preview Table */}
        <div className="pastel-card border-pastel-lavender/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-pastel-lavender/40 flex items-center justify-between bg-pastel-babypink/40">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-pastel-deep flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-pastel-deep" />
                <span>ตัวอย่างรายการคิวที่จะถูกบันทึกลง Excel ({queues.length} รายการ)</span>
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-pastel-purple/30 border-t-pastel-purple animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">กำลังเตรียมข้อมูลตารางคิว...</p>
            </div>
          ) : queues.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-base font-bold text-pastel-deep">
                ไม่พบรายการคิวตามเงื่อนไขที่เลือก
              </p>
              <p className="text-xs text-gray-500">
                ลองปรับตัวกรองสถานะ หรือกดปุ่มล้างตัวกรองเพื่อดูคิวทั้งหมด
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-pastel-lavender/30 text-pastel-deep border-b border-pastel-lavender/50">
                    <th className="py-3 px-3 font-bold text-center w-12">#</th>
                    <th className="py-3 px-3 font-bold whitespace-nowrap">หมายเลขคิว</th>
                    <th className="py-3 px-3 font-bold whitespace-nowrap">วันที่คิว</th>
                    <th className="py-3 px-3 font-bold whitespace-nowrap">ชื่อเล่นลูกค้า</th>
                    <th className="py-3 px-3 font-bold whitespace-nowrap">{config.labels.serviceLabel}</th>
                    <th className="py-3 px-3 font-bold text-center whitespace-nowrap">{config.labels.unitName}</th>
                    <th className="py-3 px-3 font-bold text-center whitespace-nowrap">สถานะ</th>
                    <th className="py-3 px-3 font-bold min-w-[200px]">รายละเอียด</th>
                    <th className="py-3 px-3 font-bold min-w-[160px]">บันทึกแอดมิน</th>
                    <th className="py-3 px-3 font-bold whitespace-nowrap">เวลาสร้างคิว</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-lavender/30">
                  {queues.map((q, index) => (
                    <tr
                      key={q.queueNumber}
                      className="hover:bg-pastel-babypink/30 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-semibold text-gray-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-pastel-deep whitespace-nowrap">
                        {q.queueNumber}
                      </td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {q.queueDate} (คิวที่ #{q.queueOrder})
                      </td>
                      <td className="py-3 px-3 font-bold text-pastel-deep whitespace-nowrap">
                        {q.nickname}
                      </td>
                      <td className="py-3 px-3 text-gray-700 whitespace-nowrap">
                        {q.packageName}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-pastel-deep">
                        {q.questionCount}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate" title={q.details || ""}>
                        {q.details || "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate" title={q.internalNote || ""}>
                        {q.internalNote || "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap text-xs">
                        {q.createdAtFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
