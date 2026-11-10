import Link from "next/link";
import { ArrowRight, Check, Crown, Gem, Rocket, Sprout } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLANS } from "@/lib/plans";
import { PastelBlobs, SiteFooter, SiteHeader } from "@/components/saas/SiteChrome";

export const dynamic = "force-dynamic";

function featureList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

const FEATURE_LABELS: Record<string, string> = {
  statistics: "สถิติและภาพรวมร้าน",
  multiple_staff: "ทีมงานหลายคน",
  advanced_reports: "รายงานขั้นสูง",
};

const PLAN_STYLE: Record<string, { icon: typeof Sprout; tagline: string; tint: string; popular?: boolean }> = {
  FREE: { icon: Sprout, tagline: "ลองใช้ก่อน ไม่มีค่าใช้จ่าย", tint: "from-pastel-green to-pastel-blue" },
  STARTER: { icon: Rocket, tagline: "สำหรับร้านที่เพิ่งเริ่ม", tint: "from-pastel-blue to-pastel-lavender" },
  PRO: { icon: Gem, tagline: "คุ้มที่สุดสำหรับร้านประจำ", tint: "from-pastel-lavender to-pastel-pink", popular: true },
  BUSINESS: { icon: Crown, tagline: "สำหรับร้านที่มีทีมงาน", tint: "from-pastel-pink to-pastel-yellow" },
};

type PlanView = {
  code: string;
  name: string;
  monthlyPrice: number;
  serviceLimit: number | null;
  bookingLimit: number | null;
  staffLimit?: number | null;
  features: unknown;
};

const FAQ = [
  { q: "เริ่มใช้งานต้องจ่ายเงินไหม?", a: "ไม่ต้องค่ะ ทุกร้านเริ่มด้วยแพ็กเกจ Free ได้ทันทีโดยไม่ต้องใช้บัตรเครดิต" },
  { q: "จำนวนการจองนับอย่างไร?", a: "นับจากบัตรคิวและนัดหมายที่ไม่ถูกยกเลิกภายในเดือนปฏิทินนั้น ๆ และเริ่มนับใหม่ทุกต้นเดือน" },
  { q: "ลูกค้าต้องสมัครสมาชิกหรือติดตั้งแอปไหม?", a: "ไม่ต้องเลย ลูกค้าเปิดลิงก์หน้าร้านแล้วกรอกชื่อเพื่อรับคิวหรือนัดหมายได้ทันที" },
  { q: "อัปเกรดแพ็กเกจได้อย่างไร?", a: "ระบบชำระเงินออนไลน์กำลังจะเปิดให้บริการ ระหว่างนี้เริ่มใช้แพ็กเกจ Free ได้ก่อน แล้วติดต่อทีมงานเพื่ออัปเกรด" },
];

export default async function PricingPage() {
  let plans: PlanView[] = [];
  try {
    plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: "asc" } });
  } catch {
    plans = [];
  }
  const visiblePlans: PlanView[] = plans.length ? plans : DEFAULT_PLANS.map((p) => ({ ...p }));

  return (
    <div className="relative min-h-screen">
      <SiteHeader active="pricing" />
      <main className="relative isolate overflow-hidden">
        <PastelBlobs />
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
          <div className="mx-auto max-w-2xl text-center animate-pop-in">
            <span className="cute-chip">💖 ราคาเป็นมิตร</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-pastel-deep sm:text-5xl">
              แพ็กเกจที่<span className="text-gradient">เหมาะกับร้านคุณ</span>
            </h1>
            <p className="mt-4 text-pastel-deep/70 sm:text-lg">เริ่มใช้ฟรี แล้วเลือกแพ็กเกจที่ใหญ่ขึ้นเมื่อร้านเติบโต</p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visiblePlans.map((plan) => {
              const style = PLAN_STYLE[plan.code] ?? PLAN_STYLE.STARTER;
              const Icon = style.icon;
              const features = featureList(plan.features).map((f) => FEATURE_LABELS[f] ?? f);
              const isFree = plan.monthlyPrice === 0;
              const items = [
                plan.serviceLimit === null ? "ไม่จำกัดจำนวนบริการ" : `สร้างบริการได้ ${plan.serviceLimit} รายการ`,
                plan.bookingLimit === null ? "ไม่จำกัดการจอง" : `${plan.bookingLimit.toLocaleString("th-TH")} การจอง / เดือน`,
                plan.staffLimit === undefined
                  ? null
                  : plan.staffLimit === null
                    ? "เพิ่มทีมงานได้ไม่จำกัด"
                    : `ผู้ดูแล ${plan.staffLimit} คน`,
                "หน้าร้านออนไลน์ + บัตรคิวอัตโนมัติ",
                ...features,
              ].filter((x): x is string => Boolean(x));

              return (
                <article
                  key={plan.code}
                  className={`relative flex flex-col rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 ${
                    style.popular
                      ? "magical-border bg-white shadow-2xl shadow-pastel-purple/25 ring-4 ring-pastel-lavender/40 lg:-mt-3 lg:mb-3"
                      : "pastel-card hover:shadow-xl hover:shadow-pastel-purple/15"
                  }`}
                >
                  {style.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pastel-purple to-pink-300 px-3.5 py-1 text-xs font-bold text-white shadow-md">
                      ⭐ ยอดนิยม
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${style.tint} text-pastel-deep`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold tracking-widest text-pastel-deep">{plan.name}</p>
                      <p className="text-xs text-pastel-deep/60">{style.tagline}</p>
                    </div>
                  </div>

                  <p className="mt-6 flex items-end gap-1 text-pastel-deep">
                    <span className="text-4xl font-extrabold">{isFree ? "ฟรี" : `฿${plan.monthlyPrice.toLocaleString("th-TH")}`}</span>
                    {!isFree && <span className="pb-1 text-sm text-pastel-deep/60">/ เดือน</span>}
                  </p>

                  <ul className="mt-6 flex-1 space-y-3 border-t border-pastel-lavender/50 pt-5 text-sm text-pastel-deep/85">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pastel-green text-emerald-700">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`mt-7 ${style.popular ? "btn-magical btn-cute" : "btn-soft"} w-full`}
                  >
                    {isFree ? "เริ่มใช้ฟรี" : "เริ่มต้นใช้งาน"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-pastel-deep/60">
            * ทุกร้านเริ่มต้นด้วยแพ็กเกจ Free แล้วอัปเกรดภายหลังได้
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-24">
          <h2 className="text-center text-2xl font-extrabold text-pastel-deep sm:text-3xl">คำถามที่พบบ่อย</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="pastel-card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-pastel-deep">
                  {item.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pastel-lavender/50 text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-pastel-deep/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
