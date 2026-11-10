"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  Calendar,
  History,
  Users,
  ShieldAlert,
  LogOut,
  Sparkles,
  Moon,
  Menu,
  X,
  ExternalLink,
  FileSpreadsheet,
  Palette,
  Store,
  Settings,
} from "lucide-react";
import { SessionUser } from "@/lib/types";
import { useTemplateConfig } from "@/components/TemplateProvider";
import { BrandLogo } from "@/components/BrandLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SESSION_CACHE_KEY = "starter_session_user_cache";
let memoryCachedUser: SessionUser | null = null;

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { config, hasLiveOverrides } = useTemplateConfig();
  const [user, setUser] = useState<SessionUser | null>(() => memoryCachedUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!memoryCachedUser) {
      try {
        const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SessionUser;
          memoryCachedUser = parsed;
          setUser(parsed);
        }
      } catch {
        // Ignore storage error
      }
    }

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          memoryCachedUser = data.user;
          setUser(data.user);
          try {
            sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data.user));
          } catch {
            // Ignore storage error
          }
        } else if (res.status === 401) {
          memoryCachedUser = null;
          try {
            sessionStorage.removeItem(SESSION_CACHE_KEY);
          } catch {
            // Ignore storage error
          }
          router.push("/login");
        }
      } catch {
        // Keep current page usable if network hiccups
      }
    }
    loadUser();

    const handleProfileUpdated = () => {
      loadUser();
    };
    window.addEventListener("user-profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
    };
  }, [router]);

  const handleLogout = async () => {
    memoryCachedUser = null;
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch {
      // Ignore storage error
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const isOwner = user ? user.role === "owner" : true;
  const permissions = user?.permissions || [];

  const navItems = [
    {
      label: "หน้าร้านออนไลน์ & การจอง",
      href: "/dashboard",
      icon: Store,
      show: true,
    },
    {
      label: "ตั้งค่าร้าน & บริการ",
      href: "/dashboard/settings",
      icon: Settings,
      show: true,
    },
    {
      label: "ภาพรวมแดชบอร์ด",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: "จัดการคิวทั้งหมด",
      href: "/admin/queues",
      icon: ListOrdered,
      show: true,
    },
    {
      label: "เพิ่มคิวใหม่",
      href: "/admin/queues/new",
      icon: PlusCircle,
      show: isOwner || permissions.includes("create_queue"),
    },
    {
      label: "คิวรายวัน / ปฏิทิน",
      href: "/admin/calendar",
      icon: Calendar,
      show: true,
    },
    {
      label: "ประวัติคิวเก่า",
      href: "/admin/history",
      icon: History,
      show: isOwner || permissions.includes("view_history"),
    },
    {
      label: "บันทึกคิวเป็น Excel",
      href: "/admin/export",
      icon: FileSpreadsheet,
      show: isOwner || permissions.includes("view_queues"),
    },
    {
      label: "จัดการแอดมิน",
      href: "/admin/users",
      icon: Users,
      show: isOwner || permissions.includes("manage_users"),
    },
    {
      label: "บันทึก Audit Log",
      href: "/admin/logs",
      icon: ShieldAlert,
      show: isOwner || permissions.includes("view_audit_logs"),
    },
    {
      label: "ตั้งค่าเทมเพลต / ธีมสี",
      href: "/admin/template",
      icon: Palette,
      show: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-pastel-lavender/50 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <BrandLogo
            logoUrl={config.brand.logoUrl}
            iconName={config.brand.icon}
            alt={config.brand.name}
            size="sm"
          />
          <div>
            <h1 className="text-base font-bold text-pastel-deep font-magic tracking-wider">
              {config.brand.name}
            </h1>
            <p className="text-[10px] text-gray-500">{config.brand.badgeText}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-pastel-babypink text-pastel-deep border border-pastel-pink/60"
          aria-label="เมนูหลัก"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-pastel-lavender/40 flex flex-col transition-transform duration-300 md:translate-x-0 md:static ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-pastel-lavender/30 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              logoUrl={config.brand.logoUrl}
              iconName={config.brand.icon}
              alt={config.brand.name}
              size="md"
              className="shrink-0"
              iconClassName="animate-sparkle-slow"
            />
            <div className="min-w-0">
              <h2 className="font-bold text-pastel-deep text-lg font-magic tracking-wide truncate">
                {config.brand.name}
              </h2>
              <span className="text-[11px] font-medium text-pastel-deep bg-pastel-lavender/40 px-2 py-0.5 rounded-full inline-block">
                {config.brand.badgeText}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Badge */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-pastel-babypink/60 border border-pastel-pink/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pastel-purple/30 text-pastel-deep font-bold flex items-center justify-center shrink-0">
              {user?.displayName?.charAt(0) || "T"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-pastel-deep truncate">
                {user?.displayName}
              </p>
              <span className="text-[10px] font-semibold text-pastel-deep bg-white/80 px-2 py-0.2 rounded-full inline-block mt-0.5">
                {user?.role === "owner" ? "👑 เจ้าของร้าน" : `🔮 ${config.labels.staffTitle} / แอดมิน`}
              </span>
            </div>
          </div>
        </div>

        {hasLiveOverrides && (
          <div className="mx-4 mb-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px] text-amber-800">
            <span className="font-semibold">🎨 กำลังพรีวิวเทมเพลต</span>
            <Link href="/admin/template" className="underline font-bold">
              ตั้งค่า
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-pastel-purple/30 via-pastel-lavender/40 to-pastel-pink/30 text-pastel-deep font-bold border border-pastel-lavender/60 shadow-xs"
                      : "text-gray-600 hover:bg-pastel-babypink/50 hover:text-pastel-deep"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-pastel-deep" : "text-gray-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-pastel-lavender/30 space-y-2">
          <Link
            href="/track/demo-tq-20261025-0001"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-pastel-deep bg-pastel-lavender/30 hover:bg-pastel-lavender/50 transition"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              ดูตัวอย่างหน้าลูกค้า
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-16 md:pb-8 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
