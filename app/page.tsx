import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarHeart,
  Check,
  Clock3,
  FileSpreadsheet,
  Link2,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { PastelBlobs, SiteFooter, SiteHeader } from "@/components/saas/SiteChrome";

const FEATURES = [
  { icon: Store, title: "หน้าร้านออนไลน์", body: "ได้ลิงก์หน้าจองของร้านทันที แชร์ผ่าน LINE, IG หรือ QR ได้เลย", tint: "from-pastel-lavender/80 to-pastel-pink/70" },
  { icon: Ticket, title: "บัตรคิวอัตโนมัติ", body: "ออกเลขคิวเรียงลำดับให้ทุกวัน ไม่ซ้ำ ไม่สับสน", tint: "from-pastel-pink/80 to-pastel-yellow/80" },
  { icon: CalendarHeart, title: "รับนัดหมายล่วงหน้า", body: "ตรวจเวลาทำการและช่วงเวลาที่ชนกันให้อัตโนมัติ", tint: "from-pastel-blue/90 to-pastel-lavender/70" },
  { icon: BellRing, title: "ลูกค้าติดตามสถานะคิว", body: "ส่งลิงก์ให้ลูกค้าดูว่าใกล้ถึงคิวหรือยัง ลดการโทรถาม", tint: "from-pastel-green/90 to-pastel-blue/80" },
  { icon: Users, title: "ทีมงานหลายคน", body: "เพิ่มแอดมินและกำหนดสิทธิ์ได้ พร้อมบันทึกทุกการเปลี่ยนแปลง", tint: "from-pastel-yellow/90 to-pastel-pink/70" },
  { icon: FileSpreadsheet, title: "ส่งออก Excel", body: "ดึงรายงานคิวไปทำบัญชีหรือวิเคราะห์ต่อได้ในคลิกเดียว", tint: "from-pastel-lavender/80 to-pastel-green/80" },
];

const STEPS = [
  { emoji: "🌸", title: "สร้างร้านฟรี", body: "กรอกชื่อร้านและอีเมล ใช้เวลาไม่ถึง 1 นาที" },
  { emoji: "🔗", title: "แชร์ลิงก์หน้าร้าน", body: "ลูกค้ากดรับคิวหรือนัดหมายเองได้ตลอดเวลา" },
  { emoji: "🎉", title: "จัดการคิวสบาย ๆ", body: "เรียกคิว เลื่อนคิว ปิดงาน ได้จากมือถือเครื่องเดียว" },
];

const MOCK_SERVICES = [
  { name: "ตัดผมและจัดทรง", meta: "30 นาที", price: "฿350", active: true },
  { name: "ทำสีผม", meta: "90 นาที", price: "฿1,200", active: false },
  { name: "สปาผม", meta: "45 นาที", price: "฿500", active: false },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader active="home" />

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative isolate overflow-hidden">
          <PastelBlobs />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:pb-28 md:pt-20">
            <div className="animate-pop-in">
              <span className="cute-chip">
                <Sparkles className="h-3.5 w-3.5 text-pastel-purple" /> ระบบคิวและนัดหมายสำหรับร้านบริการ
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.2] tracking-tight text-pastel-deep sm:text-5xl md:text-[3.5rem]">
                จัดคิวและนัดหมาย
                <br />
                <span className="text-gradient">ง่าย น่ารัก ในที่เดียว</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-pastel-deep/75 sm:text-lg">
                เปิดหน้าจองออนไลน์ของร้านคุณ ให้ลูกค้ารับบัตรคิวหรือนัดหมายเองได้ ส่วนคุณจัดการทุกอย่างจากแดชบอร์ดเดียว
                เหมาะกับร้านทำผม ร้านเล็บ คลินิก คาเฟ่ และร้านบริการทุกแบบ
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-magical btn-cute px-6 py-3.5 text-base">
                  สร้างร้านฟรี <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/pricing" className="btn-soft px-6 py-3.5 text-base">
                  ดูแพ็กเกจ
                </Link>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-pastel-deep/70">
                {["เริ่มฟรี ไม่ต้องใช้บัตรเครดิต", "พร้อมใช้ใน 1 นาที", "ใช้ได้ทุกอุปกรณ์"].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-pastel-green text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock booking card */}
            <div className="relative mx-auto w-full max-w-md animate-pop-in [animation-delay:120ms]">
              <div className="absolute -left-4 -top-5 z-10 hidden animate-float-slow items-center gap-2 rounded-2xl border border-white bg-white/95 px-3.5 py-2.5 text-sm font-semibold text-pastel-deep shadow-lg shadow-pastel-purple/20 sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-pastel-yellow text-base">🎫</span>
                <div className="leading-tight">
                  <p className="text-[11px] font-medium text-gray-500">คิวถัดไป</p>
                  <p>Q-0012</p>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-3 z-10 hidden items-center gap-2 rounded-2xl border border-white bg-white/95 px-3.5 py-2.5 text-sm font-semibold text-pastel-deep shadow-lg shadow-pastel-purple/20 [animation-delay:1.2s] sm:flex sm:animate-float-slow">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-pastel-green text-base">🎉</span>
                จองสำเร็จแล้ว!
              </div>

              <div className="pastel-card overflow-hidden p-0 shadow-2xl shadow-pastel-purple/20">
                <div className="bg-gradient-to-br from-pastel-lavender via-pastel-babypink to-pastel-pink px-6 pb-6 pt-5">
                  <div className="flex items-center justify-between text-xs font-medium text-pastel-deep/60">
                    <span>หน้าร้าน · ตัวอย่าง</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> เปิดอยู่
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">💇‍♀️</span>
                    <div>
                      <p className="text-lg font-bold text-pastel-deep">Blossom Hair Studio</p>
                      <p className="text-xs text-pastel-deep/60">ร้านทำผมอบอุ่นใจกลางเมือง</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 p-5">
                  {MOCK_SERVICES.map((s) => (
                    <div
                      key={s.name}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 transition ${
                        s.active ? "border-pastel-purple bg-pastel-babypink/70 ring-4 ring-pastel-lavender/40" : "border-pastel-lavender/50 bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-pastel-deep">{s.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <Clock3 className="h-3 w-3" /> {s.meta}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-pastel-deep">{s.price}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl bg-pastel-deep py-2.5 text-center text-xs font-semibold text-white">🎫 รับบัตรคิว</div>
                    <div className="rounded-xl border border-pastel-lavender bg-white py-2.5 text-center text-xs font-semibold text-pastel-deep">📅 นัดหมาย</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-pastel-blue/40 p-3 text-xs text-pastel-deep/80">
                    <ShieldCheck className="h-4 w-4 shrink-0" /> ข้อมูลลูกค้าแสดงให้เฉพาะร้านเท่านั้น
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <span className="cute-chip">✨ ครบในที่เดียว</span>
              <h2 className="mt-4 text-3xl font-extrabold text-pastel-deep sm:text-4xl">ทุกอย่างที่ร้านบริการต้องมี</h2>
              <p className="mt-3 text-pastel-deep/70">ออกแบบให้ใช้ง่ายตั้งแต่วันแรก ไม่ต้องติดตั้งแอป ไม่ต้องอบรมทีมงาน</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body, tint }) => (
                <article
                  key={title}
                  className="pastel-card group p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pastel-purple/15"
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tint} text-pastel-deep transition group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-pastel-deep">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-pastel-deep/70">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="pastel-card magical-border relative overflow-hidden p-8 sm:p-12">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-pastel-deep">เริ่มใช้งานได้ใน 3 ขั้นตอน</h2>
                <p className="mt-2 text-pastel-deep/70">ง่ายจนแทบไม่ต้องอ่านคู่มือ</p>
              </div>
              <ol className="mt-10 grid gap-6 md:grid-cols-3">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="relative rounded-3xl bg-white/80 p-6 text-center shadow-sm">
                    <span className="absolute left-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-pastel-lavender text-xs font-bold text-pastel-deep">
                      {i + 1}
                    </span>
                    <span className="mx-auto grid h-16 w-16 animate-float-slow place-items-center rounded-full bg-gradient-to-br from-pastel-babypink to-pastel-lavender/70 text-3xl">
                      {step.emoji}
                    </span>
                    <h3 className="mt-4 font-bold text-pastel-deep">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-pastel-deep/70">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------- Highlights ---------------- */}
        <section className="pb-20">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-3">
            {[
              { icon: Smartphone, title: "มือถือมาก่อน", body: "ทุกหน้าออกแบบให้ใช้บนมือถือได้ลื่นไหล" },
              { icon: Palette, title: "ปรับธีมได้ตามแบรนด์", body: "เลือกธีมพาสเทลหรือใส่สีและโลโก้ของร้านเอง" },
              { icon: Link2, title: "แชร์ง่าย", body: "ลิงก์เดียว ใช้ได้ทั้ง LINE, Facebook, IG และ QR" },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4 rounded-3xl border border-pastel-lavender/50 bg-white/60 p-5">
                <span className="icon-bubble"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-bold text-pastel-deep">{title}</h3>
                  <p className="mt-1 text-sm text-pastel-deep/70">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="px-5 pb-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-pastel-purple via-pastel-lavender to-pastel-pink p-10 text-center shadow-2xl shadow-pastel-purple/30 sm:p-14">
            <Sparkles className="absolute left-8 top-8 h-8 w-8 animate-sparkle-slow text-white/70" />
            <CalendarDays className="absolute bottom-8 right-10 h-10 w-10 animate-float-slow text-white/60" />
            <h2 className="text-3xl font-extrabold text-pastel-deep sm:text-4xl">พร้อมให้ลูกค้าจองคิวเองแล้วหรือยัง?</h2>
            <p className="mx-auto mt-3 max-w-xl text-pastel-deep/80">เริ่มด้วยแพ็กเกจ Free ได้ทันที แล้วค่อยอัปเกรดเมื่อร้านเติบโต</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-pastel-deep px-7 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                สร้างร้านของฉัน <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center rounded-2xl bg-white/80 px-7 py-3.5 font-semibold text-pastel-deep transition hover:bg-white">
                มีบัญชีแล้ว
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
