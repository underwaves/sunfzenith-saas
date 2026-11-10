import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorizedShop } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Crown,
  ExternalLink,
  FileSpreadsheet,
  ListOrdered,
  Palette,
  PlusCircle,
  Settings,
  Store,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { SiteLogo } from "@/components/saas/SiteChrome";
import { ShareLinkCard } from "@/components/saas/ShareLinkCard";
import { BookingsBoard, BookingItem } from "@/components/saas/BookingsBoard";

export const dynamic = "force-dynamic";

const SHORTCUTS = [
  {
    icon: Settings,
    label: "ตั้งค่าร้าน & บริการ",
    desc: "ชื่อร้าน ราคา และเวลาทำการ",
    href: "/dashboard/settings",
    tint: "from-pastel-pink to-pastel-lavender",
  },
  {
    icon: ListOrdered,
    label: "จัดการคิว & ระบบหลังบ้าน",
    desc: "จัดการคิว เพิ่มคิว ปฏิทิน สถิติ และธีมสีในที่เดียว",
    href: "/admin/queues",
    tint: "from-pastel-lavender to-pastel-blue",
  },
];

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date()));
  if (hour < 12) return "อรุณสวัสดิ์";
  if (hour < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const shop = await getAuthorizedShop(user.id);

  if (!shop) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="pastel-card max-w-md p-8 text-center">
          <p className="text-5xl">🏪</p>
          <h1 className="mt-4 text-xl font-bold text-pastel-deep">บัญชีนี้ยังไม่มีร้านที่ได้รับอนุญาต</h1>
          <p className="mt-2 text-sm text-pastel-deep/70">กรุณาติดต่อเจ้าของร้านเพื่อเพิ่มคุณเป็นทีมงาน หรือสมัครบัญชีใหม่เพื่อสร้างร้านของคุณเอง</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/register" className="btn-magical btn-cute">สร้างร้านใหม่</Link>
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [waitingBookings, waitingAdminQueues, monthlyBookings, monthlyAdminQueues, subscription, serviceCount, recentBookings] = await Promise.all([
    prisma.booking.count({ where: { shopId: shop.id, mode: "queue", status: "confirmed" } }),
    prisma.queue.count({ where: { shopId: shop.id, status: { in: ["waiting", "in_progress"] } } }),
    prisma.booking.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } }),
    prisma.queue.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } }),
    prisma.subscription.findUnique({ where: { shopId: shop.id }, include: { plan: true } }),
    prisma.service.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.booking.findMany({
      where: { shopId: shop.id },
      orderBy: [{ createdAt: "desc" }],
      take: 30,
      include: { service: { select: { name: true, durationMins: true, price: true } } },
    }),
  ]);
  const waiting = waitingBookings + waitingAdminQueues;
  const bookings = monthlyBookings + monthlyAdminQueues;

  const serializedBookings: BookingItem[] = recentBookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    mode: b.mode,
    status: b.status,
    ticketNumber: b.ticketNumber,
    startsAt: b.startsAt.toISOString(),
    createdAt: b.createdAt.toISOString(),
    service: b.service,
  }));

  const limit = subscription?.plan.bookingLimit ?? null;
  const usagePct = limit ? Math.min(100, Math.round((bookings / limit) * 100)) : 0;
  const usageColor = usagePct >= 90 ? "from-rose-300 to-rose-400" : usagePct >= 70 ? "from-amber-200 to-amber-400" : "from-pastel-purple to-pink-300";
  const statusLabel: Record<string, string> = { active: "ใช้งานอยู่", expired: "หมดอายุ", cancelled: "ยกเลิกแล้ว", pending: "รอดำเนินการ" };
  const firstName = user.displayName?.split(" ")[0] || "คุณ";

  const checklist = [
    { done: true, label: "สร้างร้านเรียบร้อย", href: null },
    { done: serviceCount > 0, label: "ตั้งค่าบริการและราคาของร้าน", href: "/dashboard/settings" },
    { done: bookings > 0, label: "รับการจองแรกของเดือนนี้", href: `/shop/${shop.slug}` },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="min-h-screen">
      <header className="glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <SiteLogo compact />
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-pastel-lavender/60 bg-white/80 py-1 pl-1 pr-3 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-pastel-purple to-pastel-pink text-xs font-bold text-white">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="max-w-[10rem] truncate text-sm font-medium text-pastel-deep">{user.displayName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {/* Greeting */}
        <section className="flex flex-wrap items-end justify-between gap-5 animate-pop-in">
          <div>
            <p className="text-sm font-medium text-pastel-deep/60">{greeting()} คุณ{firstName} 👋</p>
            <h1 className="mt-1 flex flex-wrap items-center gap-3 text-3xl font-extrabold text-pastel-deep sm:text-4xl">
              {shop.name}
              <span className="inline-flex items-center gap-1 rounded-full bg-pastel-green px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> เปิดรับจอง
              </span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/settings" className="btn-soft">
              <Settings className="h-4 w-4" /> ตั้งค่าร้าน & บริการ
            </Link>
            <Link href={`/shop/${shop.slug}`} target="_blank" className="btn-soft">
              <Store className="h-4 w-4" /> หน้าร้าน <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/admin/queues" className="btn-magical btn-cute">
              <ListOrdered className="h-4 w-4" /> จัดการคิว
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="pastel-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-pastel-deep/70">คิวที่รอดำเนินการ</p>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pastel-yellow text-amber-700"><Ticket className="h-5 w-5" /></span>
            </div>
            <p className="mt-3 text-4xl font-extrabold text-pastel-deep">
              {waiting.toLocaleString("th-TH")}<span className="ml-2 text-sm font-medium text-pastel-deep/50">คิว</span>
            </p>
            <Link href="/admin/queues" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pastel-purple hover:underline">
              ไปที่หน้าคิว <ArrowRight className="h-3 w-3" />
            </Link>
          </article>

          <article className="pastel-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-pastel-deep/70">การจองเดือนนี้</p>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pastel-blue text-sky-700"><TrendingUp className="h-5 w-5" /></span>
            </div>
            <p className="mt-3 text-4xl font-extrabold text-pastel-deep">
              {bookings.toLocaleString("th-TH")}
              <span className="ml-2 text-sm font-medium text-pastel-deep/50">{limit ? `/ ${limit.toLocaleString("th-TH")} รายการ` : "รายการ"}</span>
            </p>
            {limit ? (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-pastel-lavender/30">
                  <div className={`h-full rounded-full bg-gradient-to-r ${usageColor} transition-all`} style={{ width: `${Math.max(usagePct, 3)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-pastel-deep/60">ใช้ไปแล้ว {usagePct}% ของโควตาแพ็กเกจ</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-pastel-deep/60">ไม่จำกัดจำนวนการจอง ✨</p>
            )}
          </article>

          <article className="pastel-card relative overflow-hidden p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pastel-pink/50 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <p className="text-sm font-medium text-pastel-deep/70">แพ็กเกจปัจจุบัน</p>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pastel-lavender text-pastel-deep"><Crown className="h-5 w-5" /></span>
            </div>
            <p className="relative mt-3 flex items-center gap-2 text-3xl font-extrabold tracking-wide text-pastel-deep">
              {subscription?.plan.name || "ไม่มี"}
              {subscription && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-normal ${subscription.status === "active" ? "bg-pastel-green text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                  {statusLabel[subscription.status] ?? subscription.status}
                </span>
              )}
            </p>
            <Link href="/pricing" className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pastel-purple hover:underline">
              ดูแพ็กเกจทั้งหมด <ArrowRight className="h-3 w-3" />
            </Link>
          </article>
        </section>

        {/* Share link */}
        <section className="mt-6 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-pastel-lavender via-pastel-babypink to-pastel-pink p-6 shadow-lg shadow-pastel-purple/15 sm:p-7">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-xl">🔗</span>
            <div>
              <h2 className="font-bold text-pastel-deep">ลิงก์เช็คสถานะคิวสำหรับลูกค้า</h2>
              <p className="text-sm text-pastel-deep/70">แชร์ให้ลูกค้าผ่าน LINE, Facebook หรือแปะเป็น QR ให้ลูกค้าเช็คสถานะคิวและดูว่าเหลืออีกกี่คิวได้แบบเรียลไทม์</p>
            </div>
          </div>
          <ShareLinkCard slug={shop.slug} baseUrl={process.env.NEXT_PUBLIC_APP_URL} />
        </section>

        {/* Online Bookings Board (shown only if there are bookings in Booking table) */}
        {serializedBookings.length > 0 && (
          <section className="mt-8">
            <BookingsBoard initialBookings={serializedBookings} shopSlug={shop.slug} />
          </section>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Shortcuts */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-pastel-deep">ทางลัด</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SHORTCUTS.map(({ icon: Icon, label, desc, href, tint }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-4 rounded-3xl border border-pastel-lavender/50 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-pastel-purple/50 hover:shadow-lg hover:shadow-pastel-purple/10"
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tint} text-pastel-deep transition group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-pastel-deep">{label}</span>
                    <span className="mt-0.5 block text-xs text-pastel-deep/65">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Checklist */}
          <aside className="pastel-card h-fit p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-pastel-deep">เริ่มต้นใช้งาน</h2>
              <span className="text-xs font-semibold text-pastel-purple">{doneCount}/{checklist.length}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-pastel-lavender/30">
              <div className="h-full rounded-full bg-gradient-to-r from-pastel-purple to-pink-300" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((item) => {
                const content = (
                  <>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${item.done ? "bg-pastel-green text-emerald-700" : "border-2 border-dashed border-pastel-lavender"}`}>
                      {item.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className={item.done ? "text-pastel-deep/60 line-through decoration-pastel-purple/40" : "font-medium text-pastel-deep"}>{item.label}</span>
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.href && !item.done ? (
                      <Link href={item.href} className="flex items-center gap-2.5 rounded-xl p-1.5 text-sm transition hover:bg-pastel-babypink/60">{content}</Link>
                    ) : (
                      <div className="flex items-center gap-2.5 p-1.5 text-sm">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {doneCount === checklist.length && <p className="mt-3 rounded-xl bg-pastel-green/60 p-2.5 text-center text-xs font-semibold text-emerald-800">เยี่ยมมาก! ร้านพร้อมใช้งานเต็มที่แล้ว 🎉</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
