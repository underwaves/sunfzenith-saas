"use client";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/** Shows the public booking URL for a shop with copy/open actions. */
export function ShareLinkCard({ slug, baseUrl }: { slug: string; baseUrl?: string }) {
  const path = `/shop/${slug}`;
  const [origin, setOrigin] = useState(baseUrl?.replace(/\/$/, "") || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!origin) setOrigin(window.location.origin);
  }, [origin]);

  const url = `${origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 truncate rounded-2xl border border-white/80 bg-white/80 px-4 py-3 font-mono text-sm text-pastel-deep shadow-inner" title={url}>
        {url || path}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className="btn-soft flex-1 sm:flex-none" aria-live="polite">
          {copied ? <><Check className="h-4 w-4 text-emerald-600" /> คัดลอกแล้ว</> : <><Copy className="h-4 w-4" /> คัดลอก</>}
        </button>
        <a href={path} target="_blank" rel="noreferrer" className="btn-magical btn-cute flex-1 sm:flex-none">
          เปิดดู <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
