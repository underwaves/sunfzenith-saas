"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  Crown,
  ExternalLink,
  Image as ImageIcon,
  Mail,
  Phone,
  Plus,
  Save,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { SiteLogo } from "@/components/saas/SiteChrome";
import { LogoutButton } from "@/components/LogoutButton";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  durationMins: number;
  price: number;
  isActive: boolean;
}

interface HourRow {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  services: ServiceRow[];
  hours: HourRow[];
  subscription: {
    status: string;
    plan: {
      code: string;
      name: string;
      serviceLimit: number | null;
      bookingLimit: number | null;
    };
  } | null;
}

const WEEKDAYS = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

function ensureSevenDays(hours: HourRow[]): HourRow[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = hours.find((h) => h.weekday === weekday);
    return (
      found || {
        weekday,
        opensAt: "09:00",
        closesAt: "17:00",
        isClosed: false,
      }
    );
  });
}

export default function ShopSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);

  // Shop profile state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState<HourRow[]>([]);

  // New service form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  const [newPrice, setNewPrice] = useState(350);
  const [addingService, setAddingService] = useState(false);
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/shop/settings")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.shop) {
          showToast(data.error || "โหลดข้อมูลร้านไม่สำเร็จ", "error");
          return;
        }
        const s: ShopData = data.shop;
        setShop(s);
        setName(s.name || "");
        setDescription(s.description || "");
        setPhone(s.phone || "");
        setEmail(s.email || "");
        setLogoUrl(s.logoUrl || "");
        setHours(ensureSevenDays(s.hours || []));
      })
      .catch(() => showToast("เชื่อมต่อไม่สำเร็จ", "error"))
      .finally(() => setLoading(false));
  }, [router, showToast]);

  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    setSavingShop(true);
    try {
      const res = await fetch("/api/shop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          phone,
          email,
          logoUrl,
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "บันทึกไม่สำเร็จ", "error");
        return;
      }
      setShop(data.shop);
      showToast("บันทึกข้อมูลร้านและเวลาทำการเรียบร้อยแล้ว ✨", "success");
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setSavingShop(false);
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingService(true);
    try {
      const res = await fetch("/api/shop/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newName.trim(),
          description: newDesc.trim() || null,
          durationMins: Number(newDuration) || 30,
          price: Number(newPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "เพิ่มบริการไม่สำเร็จ", "error");
        return;
      }
      setShop((prev) =>
        prev ? { ...prev, services: [...prev.services, data.service] } : prev
      );
      setNewName("");
      setNewDesc("");
      setNewDuration(30);
      setNewPrice(350);
      showToast(`เพิ่มบริการ "${data.service.name}" เรียบร้อย 🎀`, "success");
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ", "error");
    } finally {
      setAddingService(false);
    }
  }

  async function handleToggleService(service: ServiceRow) {
    setBusyServiceId(service.id);
    try {
      const res = await fetch("/api/shop/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: service.id,
          name: service.name,
          description: service.description,
          durationMins: service.durationMins,
          price: service.price,
          isActive: !service.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "อัปเดตบริการไม่สำเร็จ", "error");
        return;
      }
      setShop((prev) =>
        prev
          ? {
              ...prev,
              services: prev.services.map((s) =>
                s.id === service.id ? data.service : s
              ),
            }
          : prev
      );
      showToast(
        data.service.isActive
          ? `เปิดแสดงบริการ "${service.name}" บนหน้าร้านแล้ว ✨`
          : `ซ่อนบริการ "${service.name}" จากหน้าร้านแล้ว`,
        "info"
      );
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ", "error");
    } finally {
      setBusyServiceId(null);
    }
  }

  async function handleDeleteService(service: ServiceRow) {
    setBusyServiceId(service.id);
    try {
      const res = await fetch("/api/shop/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: service.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "ลบบริการไม่สำเร็จ", "error");
        return;
      }
      if (data.softDeleted) {
        setShop((prev) =>
          prev
            ? {
                ...prev,
                services: prev.services.map((s) =>
                  s.id === service.id ? { ...s, isActive: false } : s
                ),
              }
            : prev
        );
        showToast(data.message, "info");
      } else {
        setShop((prev) =>
          prev
            ? {
                ...prev,
                services: prev.services.filter((s) => s.id !== service.id),
              }
            : prev
        );
        showToast(`ลบบริการ "${service.name}" เรียบร้อยแล้ว`, "success");
      }
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ", "error");
    } finally {
      setBusyServiceId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="h-16 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-80 animate-pulse rounded-3xl bg-white/70" />
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="pastel-card max-w-md p-8 text-center">
          <p className="text-4xl">🏪</p>
          <h1 className="mt-3 text-xl font-bold text-pastel-deep">ไม่พบข้อมูลร้าน</h1>
          <Link href="/dashboard" className="btn-magical btn-cute mt-5">
            กลับไปหน้าแดชบอร์ด
          </Link>
        </div>
      </main>
    );
  }

  const activeServicesCount = shop.services.filter((s) => s.isActive).length;
  const serviceLimit = shop.subscription?.plan.serviceLimit ?? null;

  return (
    <div className="min-h-screen pb-16">
      <header className="glass-nav">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <SiteLogo compact />
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-soft py-2 px-3.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> แดชบอร์ด
            </Link>
            <Link
              href={`/shop/${shop.slug}`}
              target="_blank"
              className="btn-magical btn-cute py-2 px-3.5 text-xs"
            >
              ดูหน้าร้าน <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="cute-chip">
              <Sparkles className="h-3.5 w-3.5 text-pastel-purple" /> ตั้งค่าร้านและบริการ
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-pastel-deep">
              ปรับแต่งหน้าร้าน {shop.name} 🎀
            </h1>
            <p className="mt-1 text-sm text-pastel-deep/70">
              ข้อมูลทุกอย่างที่ตั้งค่าที่นี่จะแสดงบนหน้าจองสาธารณะ{" "}
              <span className="font-mono font-semibold text-pastel-purple">
                /shop/{shop.slug}
              </span>{" "}
              ทันที
            </p>
          </div>
        </div>

        {/* Section 1: Services Management */}
        <section className="pastel-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pastel-lavender/40 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-pastel-deep">
                <span>💇‍♀️ บริการของร้าน</span>
              </h2>
              <p className="mt-0.5 text-xs text-pastel-deep/65">
                กำหนดรายการบริการ ระยะเวลา และราคาที่ลูกค้าสามารถเลือกจองได้
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-pastel-babypink/80 px-3.5 py-2 text-xs font-semibold text-pastel-deep border border-pastel-pink/60">
              <Crown className="h-4 w-4 text-pastel-purple" />
              <span>
                เปิดใช้งาน {activeServicesCount}
                {serviceLimit !== null ? ` / ${serviceLimit}` : ""} บริการ (แพ็กเกจ{" "}
                {shop.subscription?.plan.name || "FREE"})
              </span>
              {serviceLimit !== null && activeServicesCount >= serviceLimit && (
                <Link
                  href="/pricing"
                  className="ml-1 underline text-pastel-purple font-bold"
                >
                  อัปเกรด
                </Link>
              )}
            </div>
          </div>

          {/* Existing Services List */}
          <ul className="mt-5 space-y-3">
            {shop.services.map((s) => (
              <li
                key={s.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center ${
                  s.isActive
                    ? "border-pastel-lavender/70 bg-white/90"
                    : "border-gray-200 bg-gray-50/70 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pastel-deep">{s.name}</span>
                    <span className="rounded-full bg-pastel-lavender/40 px-2.5 py-0.5 text-xs font-bold text-pastel-deep">
                      {s.price > 0
                        ? `฿${s.price.toLocaleString("th-TH")}`
                        : "สอบถามราคา"}
                    </span>
                    <span className="text-xs text-pastel-deep/60">
                      · {s.durationMins} นาที
                    </span>
                    {!s.isActive && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        ซ่อนอยู่
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-1 text-xs text-pastel-deep/65">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={busyServiceId === s.id}
                    onClick={() => handleToggleService(s)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      s.isActive
                        ? "border border-pastel-lavender bg-white text-pastel-deep hover:bg-pastel-babypink/60"
                        : "bg-pastel-green text-emerald-900"
                    }`}
                  >
                    {s.isActive ? "ซ่อนชั่วคราว" : "เปิดแสดง"}
                  </button>
                  <button
                    type="button"
                    disabled={busyServiceId === s.id}
                    onClick={() => handleDeleteService(s)}
                    className="rounded-xl bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                    title="ลบบริการ"
                    aria-label={`ลบบริการ ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Add Service Form */}
          <form
            onSubmit={handleCreateService}
            className="mt-6 rounded-3xl border border-pastel-pink/60 bg-pastel-babypink/40 p-5"
          >
            <h3 className="text-sm font-bold text-pastel-deep flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-pastel-purple" />
              เพิ่มบริการใหม่
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold text-pastel-deep">
                  ชื่อบริการ *
                </span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="เช่น ตัดผมพร้อมเซ็ตทรง"
                  className="cute-input mt-1 py-2.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-pastel-deep">
                  รายละเอียดสั้น ๆ
                </span>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  maxLength={200}
                  placeholder="เช่น รวมสระและไดร์"
                  className="cute-input mt-1 py-2.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-pastel-deep">
                  ระยะเวลา (นาที)
                </span>
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  required
                  className="cute-input mt-1 py-2.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-pastel-deep">
                  ราคา (บาท, 0 = สอบถามราคา)
                </span>
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  required
                  className="cute-input mt-1 py-2.5"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={addingService}
                className="btn-magical btn-cute py-2.5 px-5 text-xs"
              >
                <Plus className="h-4 w-4" />
                {addingService ? "กำลังเพิ่มบริการ…" : "เพิ่มบริการ"}
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Shop Profile & Business Hours */}
        <form onSubmit={handleSaveShop} className="space-y-8">
          <section className="pastel-card p-6 sm:p-8 space-y-5">
            <div className="border-b border-pastel-lavender/40 pb-4">
              <h2 className="text-xl font-extrabold text-pastel-deep">
                🏪 ข้อมูลหน้าร้าน
              </h2>
              <p className="mt-0.5 text-xs text-pastel-deep/65">
                ชื่อร้าน คำอธิบาย และช่องทางติดต่อที่แสดงบนหัวหน้าจองคิว
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="cute-label">ชื่อร้าน *</span>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    className="cute-input pl-10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="cute-label">
                  ลิงก์โลโก้ร้าน (URL รูปภาพ){" "}
                  <span className="text-xs font-normal text-pastel-deep/50">
                    ไม่บังคับ
                  </span>
                </span>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="cute-input pl-10"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="cute-label">
                คำอธิบายร้านสั้น ๆ{" "}
                <span className="text-xs font-normal text-pastel-deep/50">
                  ไม่บังคับ
                </span>
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="เช่น สตูดิโอทำเล็บและต่อขนตา บรรยากาศอบอุ่นเป็นกันเอง"
                className="cute-input"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="cute-label">
                  เบอร์โทรศัพท์ติดต่อร้าน{" "}
                  <span className="text-xs font-normal text-pastel-deep/50">
                    ไม่บังคับ
                  </span>
                </span>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={30}
                    placeholder="08x-xxx-xxxx"
                    className="cute-input pl-10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="cute-label">
                  อีเมลติดต่อร้าน{" "}
                  <span className="text-xs font-normal text-pastel-deep/50">
                    ไม่บังคับ
                  </span>
                </span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    placeholder="contact@yourshop.com"
                    className="cute-input pl-10"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Business Hours */}
          <section className="pastel-card p-6 sm:p-8">
            <div className="border-b border-pastel-lavender/40 pb-4">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-pastel-deep">
                <Clock3 className="h-5 w-5 text-pastel-purple" />
                <span>เวลาเปิด–ปิดทำการ</span>
              </h2>
              <p className="mt-0.5 text-xs text-pastel-deep/65">
                ใช้ตรวจสอบช่วงเวลาเมื่อลูกค้ากดนัดหมายล่วงหน้าผ่านหน้าร้าน
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              {hours.map((h, idx) => (
                <div
                  key={h.weekday}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    h.isClosed
                      ? "border-gray-200 bg-gray-50/70 text-gray-400"
                      : "border-pastel-lavender/60 bg-white/90 text-pastel-deep"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <input
                      type="checkbox"
                      id={`day-open-${h.weekday}`}
                      checked={!h.isClosed}
                      onChange={(e) => {
                        const open = e.target.checked;
                        setHours((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, isClosed: !open } : row
                          )
                        );
                      }}
                      className="h-4 w-4 rounded accent-pastel-purple"
                    />
                    <label
                      htmlFor={`day-open-${h.weekday}`}
                      className="font-semibold text-sm cursor-pointer"
                    >
                      {WEEKDAYS[h.weekday]}
                    </label>
                  </div>

                  {h.isClosed ? (
                    <span className="text-xs font-semibold text-rose-500 px-3 py-1.5 rounded-xl bg-rose-50">
                      ปิดทำการ
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={h.opensAt}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, opensAt: e.target.value } : row
                            )
                          )
                        }
                        className="rounded-xl border border-pastel-lavender bg-white px-3 py-1.5 text-sm font-medium text-pastel-deep"
                      />
                      <span className="text-pastel-deep/60">ถึง</span>
                      <input
                        type="time"
                        value={h.closesAt}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, closesAt: e.target.value }
                                : row
                            )
                          )
                        }
                        className="rounded-xl border border-pastel-lavender bg-white px-3 py-1.5 text-sm font-medium text-pastel-deep"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={savingShop}
                className="btn-magical btn-cute px-6 py-3.5 text-base"
              >
                {savingShop ? (
                  "กำลังบันทึก…"
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกข้อมูลร้านและเวลาทำการ
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
