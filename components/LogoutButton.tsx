"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          router.push("/login");
          router.refresh();
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-pastel-deep/70 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      <span>{busy ? "กำลังออก…" : "ออกจากระบบ"}</span>
    </button>
  );
}
