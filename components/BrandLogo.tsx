"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Moon,
  Star,
  Heart,
  Crown,
  Store,
  Coffee,
  Scissors,
  Stethoscope,
} from "lucide-react";
import { BrandIconName } from "@/config/template.config";

const ICON_MAP: Record<BrandIconName, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Moon,
  Star,
  Heart,
  Crown,
  Store,
  Coffee,
  Scissors,
  Stethoscope,
};

/**
 * Normalizes common image URLs (such as Google Drive share links, Dropbox links,
 * or domain paths missing https://) into direct renderable image URLs.
 */
export function normalizeLogoUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // Strip surrounding quotes if user copied path with quotes
  trimmed = trimmed.replace(/^["']+|["']+$/g, "").trim();

  // Keep data: URLs, blob: URLs, and root-relative paths (/logo.png) as-is
  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Convert Google Drive share links:
  // e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveFileMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveFileMatch[1]}`;
  }
  const gdriveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*?id=([a-zA-Z0-9_-]+)/);
  if (gdriveIdMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveIdMatch[1]}`;
  }

  // Convert Dropbox share links (?dl=0 -> ?raw=1)
  if (trimmed.includes("dropbox.com/") && trimmed.includes("?dl=0")) {
    return trimmed.replace("?dl=0", "?raw=1");
  }

  // If user typed a domain without protocol (e.g. "i.imgur.com/abc.png")
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(trimmed)
  ) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

interface BrandLogoProps {
  logoUrl?: string;
  iconName?: BrandIconName;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
  onImageLoadStatus?: (loaded: boolean) => void;
}

export function BrandLogo({
  logoUrl,
  iconName = "Sparkles",
  alt = "Shop Logo",
  size = "md",
  className = "",
  iconClassName = "",
  onImageLoadStatus,
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = normalizeLogoUrl(logoUrl);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  const containerSizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-16 h-16 rounded-3xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const IconComponent = ICON_MAP[iconName] || Sparkles;

  if (resolvedUrl !== "" && !imgError) {
    return (
      <div
        className={`inline-flex items-center justify-center overflow-hidden bg-white shadow-md border border-pastel-lavender/50 ${containerSizes[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={() => onImageLoadStatus?.(true)}
          onError={() => {
            setImgError(true);
            onImageLoadStatus?.(false);
          }}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-tr from-pastel-purple via-pastel-lavender to-pastel-pink text-white shadow-md ${containerSizes[size]} ${className}`}
    >
      <IconComponent className={`${iconSizes[size]} ${iconClassName}`} />
    </div>
  );
}
