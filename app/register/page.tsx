"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, Sparkles, Store, User } from "lucide-react";
import { SiteLogo } from "@/components/saas/SiteChrome";

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const autoSlug = useMemo(() => slugify(shopName), [shopName]);
  const effectiveSlug = slugTouched ? slug : autoSlug;
  const slugInvalid = slugTouched && slug.length > 0 && (!SLUG_PATTERN.test(slug) || slug.length < 3);

  const strength = password.length === 0 ? 0 : password.length < 10 ? 1 : /[^A-Za-z0-9]/.test(password) || password.length >= 14 ? 3 : 2;
  const strengthLabel = ["", "สั้นเกินไป", "ใช้ได้", "แข็งแรงมาก"][strength];
  const strengthColor = ["bg-gray-200", "bg-rose-300", "bg-amber-300", "bg-emerald-400"][strength];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password,
      shopName: shopName.trim(),
    };
    if (payload.name.length < 2) return setError("กรุณากรอกชื่อผู้ดูแลอย่างน้อย 2 ตัวอักษร");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return setError("กรุณากรอกอีเมลให้ถูกต้อง");
    if (payload.shopName.length < 2) return setError("กรุณากรอกชื่อร้านอย่างน้อย 2 ตัวอักษร");
    if (password.length < 10) return setError("รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร");
    if (slugInvalid) return setError("URL ร้านใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง (-) อย่างน้อย 3 ตัวอักษร");
    // Only send a slug when it's valid; otherwise let the server derive one.
    if (effectiveSlug && effectiveSlug.length >= 3 && SLUG_PATTERN.test(effectiveSlug)) payload.slug = effectiveSlug;

    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "ลงทะเบียนไม่สำเร็จ"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="cute-blob -left-20 top-0 h-80 w-80 bg-pastel-lavender/60" />
        <div className="cute-blob -right-16 bottom-0 h-96 w-96 bg-pastel-pink/70" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-2xl shadow-pastel-purple/20 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        {/* Side panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-pastel-lavender via-pastel-babypink to-pastel-pink p-10 lg:flex">
          <Sparkles className="absolute right-10 top-24 h-10 w-10 animate-sparkle-slow text-white/80" />
          <SiteLogo />
          <div>
            <p className="text-5xl">🌷</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-snug text-pastel-deep">เปิดร้านออนไลน์<br />ในไม่ถึง 1 นาที</h2>
            <ul className="mt-6 space-y-3 text-sm text-pastel-deep/85">
              {["ได้หน้าจองของร้านพร้อมลิงก์แชร์ทันที", "ลูกค้ารับบัตรคิวและนัดหมายเองได้", "เริ่มฟรี ไม่ต้องใช้บัตรเครดิต"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/80 text-emerald-600"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-pastel-deep/60">ข้อมูลของคุณถูกแยกเป็นสัดส่วนต่อร้าน และเข้ารหัสรหัสผ่านอย่างปลอดภัย 🔒</p>
        </aside>

        {/* Form */}
        <section className="p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-pastel-deep/70 hover:text-pastel-deep">
              <ArrowLeft className="h-4 w-4" /> หน้าแรก
            </Link>
            <span className="cute-chip lg:hidden">✨ ฟรี</span>
          </div>
          <div className="mt-6">
            <h1 className="text-2xl font-extrabold text-pastel-deep sm:text-3xl">เริ่มต้นร้านของคุณ 🎀</h1>
            <p className="mt-1.5 text-sm text-pastel-deep/65">สร้างบัญชี SUNFZENITH Queue ฟรี แล้วเริ่มรับคิวได้เลย</p>
          </div>

          {error && (
            <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 animate-shake">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />{error}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <fieldset className="space-y-4">
              <legend className="mb-1 text-xs font-bold uppercase tracking-widest text-pastel-purple">ข้อมูลผู้ดูแล</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="cute-label">ชื่อของคุณ</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="เช่น คุณมิ้นท์" className="cute-input pl-10" />
                  </div>
                </label>
                <label className="block">
                  <span className="cute-label">อีเมล</span>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="email" type="email" autoComplete="email" required placeholder="you@shop.com" className="cute-input pl-10" />
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="cute-label">
                  รหัสผ่าน
                  {strength > 0 && <span className="text-xs font-medium text-pastel-deep/60">{strengthLabel}</span>}
                </span>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={10}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 10 ตัวอักษร"
                    className="cute-input pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-pastel-deep"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`h-1.5 rounded-full transition ${strength >= n ? strengthColor : "bg-gray-200"}`} />
                  ))}
                </div>
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-1 text-xs font-bold uppercase tracking-widest text-pastel-purple">ข้อมูลร้าน</legend>
              <label className="block">
                <span className="cute-label">ชื่อร้าน</span>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    name="shopName"
                    required
                    minLength={2}
                    maxLength={100}
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="เช่น Blossom Hair Studio"
                    className="cute-input pl-10"
                  />
                </div>
              </label>
              <label className="block">
                <span className="cute-label">
                  URL หน้าร้าน <span className="text-xs font-medium text-pastel-deep/50">ไม่บังคับ</span>
                </span>
                <div className={`flex items-stretch overflow-hidden rounded-2xl border bg-white/80 shadow-sm transition focus-within:ring-4 ${slugInvalid ? "border-rose-300 focus-within:ring-rose-100" : "border-pastel-lavender/70 focus-within:border-pastel-purple focus-within:ring-pastel-lavender/50"}`}>
                  <span className="flex items-center bg-pastel-babypink/70 px-3 text-sm text-pastel-deep/60">/shop/</span>
                  <input
                    name="slug"
                    value={effectiveSlug}
                    onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                    maxLength={48}
                    placeholder="my-shop"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-pastel-deep outline-none placeholder:text-gray-400"
                  />
                </div>
                <span className={`mt-1.5 block text-xs ${slugInvalid ? "text-rose-600" : "text-pastel-deep/55"}`}>
                  {slugInvalid ? "ใช้ได้เฉพาะ a-z, 0-9 และ - อย่างน้อย 3 ตัวอักษร" : "ถ้าชื่อร้านเป็นภาษาไทย แนะนำให้ตั้ง URL ภาษาอังกฤษเอง"}
                </span>
              </label>
            </fieldset>

            <button disabled={busy} className="btn-magical btn-cute w-full py-3.5 text-base">
              {busy ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-pastel-deep border-t-transparent" /> กำลังสร้างร้าน…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> สร้างร้านของฉัน</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-pastel-deep/65">
            มีบัญชีแล้ว? <Link className="font-semibold text-pastel-deep underline decoration-pastel-purple decoration-2 underline-offset-4" href="/login">เข้าสู่ระบบ</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
