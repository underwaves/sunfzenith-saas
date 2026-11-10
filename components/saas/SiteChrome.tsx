import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

/** Cute product wordmark used across the public SaaS pages. */
export function SiteLogo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="SUNFZENITH Queue หน้าแรก">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pastel-purple via-pastel-lavender to-pastel-pink text-white shadow-md shadow-pastel-purple/30 transition group-hover:rotate-6">
        <Sparkles className="h-[18px] w-[18px]" />
      </span>
      <span className={`text-[17px] font-extrabold tracking-tight text-pastel-deep ${compact ? "hidden min-[420px]:inline" : ""}`}>
        SUNFZENITH <span className="font-semibold text-pastel-purple">Queue</span>
      </span>
    </Link>
  );
}

/** Sticky glass navigation bar for marketing pages. */
export function SiteHeader({ active }: { active?: "home" | "pricing" }) {
  const linkClass = (isActive: boolean) =>
    `hidden rounded-full px-3.5 py-2 text-sm font-medium transition sm:inline-flex ${
      isActive ? "bg-pastel-lavender/40 text-pastel-deep" : "text-pastel-deep/70 hover:bg-white hover:text-pastel-deep"
    }`;
  return (
    <header className="glass-nav">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <SiteLogo compact />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/#features" className={linkClass(false)}>ฟีเจอร์</Link>
          <Link href="/pricing" className={linkClass(active === "pricing")}>ราคา</Link>
          <Link href="/login" className="rounded-full px-3.5 py-2 text-sm font-medium text-pastel-deep/80 transition hover:bg-white hover:text-pastel-deep">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-magical inline-flex items-center gap-1.5 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>เริ่มใช้ฟรี</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-pastel-lavender/40 bg-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-pastel-deep/70 sm:flex-row">
        <SiteLogo />
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="hover:text-pastel-deep">ราคา</Link>
          <Link href="/register" className="hover:text-pastel-deep">สมัครใช้งาน</Link>
          <Link href="/login" className="hover:text-pastel-deep">เข้าสู่ระบบ</Link>
        </div>
        <p className="inline-flex items-center gap-1.5">
          ทำด้วย <Heart className="h-3.5 w-3.5 fill-pastel-pink text-pastel-pink" /> สำหรับร้านบริการ · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

/** Soft pastel blobs used as page background decoration. */
export function PastelBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="cute-blob -left-24 top-10 h-72 w-72 bg-pastel-lavender/60" />
      <div className="cute-blob right-[-6rem] top-40 h-80 w-80 bg-pastel-pink/70" />
      <div className="cute-blob bottom-0 left-1/3 h-72 w-72 bg-pastel-blue/60" />
    </div>
  );
}
