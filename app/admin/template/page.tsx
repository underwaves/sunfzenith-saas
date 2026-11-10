"use client";

import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  Check,
  Store,
  Package,
  Plus,
  Trash2,
  Eye,
  Code2,
  ExternalLink,
  Sliders,
  Shuffle,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { AdminLayout } from "@/components/AdminLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { useTemplateConfig } from "@/components/TemplateProvider";
import { useToast } from "@/components/Toast";
import {
  THEME_PRESETS,
  BUSINESS_PRESETS,
  ThemePresetId,
  ThemeColors,
  BrandIconName,
  BusinessPreset,
} from "@/config/template.config";

const AVAILABLE_ICONS: { name: BrandIconName; label: string }[] = [
  { name: "Sparkles", label: "ประกายดาว (Sparkles)" },
  { name: "Moon", label: "พระจันทร์ (Moon)" },
  { name: "Star", label: "ดวงดาว (Star)" },
  { name: "Heart", label: "หัวใจ (Heart)" },
  { name: "Crown", label: "มงกุฎ (Crown)" },
  { name: "Store", label: "หน้าร้าน (Store)" },
  { name: "Coffee", label: "คาเฟ่ (Coffee)" },
  { name: "Scissors", label: "ซาลอน/บิวตี้ (Scissors)" },
  { name: "Stethoscope", label: "คลินิก (Stethoscope)" },
];

export default function TemplateSettingsPage() {
  const {
    config,
    activeTheme,
    customColors,
    setPreviewTheme,
    updateCustomColors,
    updatePreviewConfig,
    resetPreviewConfig,
    hasLiveOverrides,
  } = useTemplateConfig();
  const { showToast } = useToast();

  const [newPackageInput, setNewPackageInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("กรุณาเลือกไฟล์รูปภาพเท่านั้น (.png, .jpg, .webp, .svg)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Resize image to max 256x256 so it stores cleanly in localStorage & config
        const maxDim = 256;
        let width = img.width || maxDim;
        let height = img.height || maxDim;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/png", 0.92);
          setLogoLoadError(false);
          updatePreviewConfig({
            brand: { ...config.brand, logoUrl: dataUrl },
          });
          showToast("อัปโหลดรูปโลโก้สำเร็จเรียบร้อย ✨", "success");
        }
      };
      img.onerror = () => {
        showToast("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้ กรุณาลองไฟล์อื่น", "error");
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyBusinessPreset = (preset: BusinessPreset) => {
    const isTarot = preset.id === "tarot";
    const isTest = preset.id === "test";
    updatePreviewConfig({
      brand: {
        ...config.brand,
        name: preset.shopName,
        fullName: preset.fullName,
        subtitle: preset.subtitle,
        badgeText: preset.badgeText,
        icon: preset.icon,
        queuePrefix: preset.queuePrefix,
      },
      theme: {
        preset: preset.themePreset,
      },
      labels: {
        ...config.labels,
        serviceLabel: preset.serviceLabel,
        unitCountLabel: preset.unitCountLabel,
        unitName: preset.unitName,
        staffTitle: preset.staffTitle,
        customerTracking: {
          ...config.labels.customerTracking,
          subtitle: preset.subtitle,
          waitingBannerTitle: isTarot
            ? "ดวงดาวกำลังเรียงตัวเพื่อคิวของคุณ ✨"
            : isTest
            ? "ระบบกำลังจำลองลำดับคิวของคุณ 🧪"
            : "กำลังเตรียมพร้อมให้บริการคิวของคุณ ✨",
          waitingFooterNote: isTarot
            ? "กรุณารอรับบริการตามลำดับคิว ทางร้านจะแจ้งผลการเปิดไพ่ให้ทราบผ่านช่องทางเดิมที่คุณติดต่อไว้ค่ะ 💜"
            : isTest
            ? "หน้านี้สำหรับทดสอบการแสดงผลสถานะคิวแบบเรียลไทม์ สามารถทดลองเปลี่ยนสถานะได้จากหน้าแอดมิน"
            : "กรุณารอรับบริการตามลำดับคิว เจ้าหน้าที่จะแจ้งเตือนเมื่อถึงคิวของคุณค่ะ ✨",
          inProgressDescription: `${preset.staffTitle}กำลังดำเนินการคิวของคุณอย่างตั้งใจ กรุณารอสักครู่นะคะ ✨`,
          completedTitle: isTarot
            ? "การเปิดไพ่ของคุณเสร็จเรียบร้อยแล้วค่ะ 💜"
            : isTest
            ? "คิวทดสอบนี้ดำเนินการเสร็จสิ้นแล้ว ✅"
            : "ดำเนินการให้บริการเสร็จเรียบร้อยแล้วค่ะ ✨",
          completedDescription: isTarot
            ? "ขอบคุณที่ไว้วางใจให้ร้านของเราเป็นผู้สื่อสารข้อความจากดวงดาวนะคะ ขอให้พบเจอแต่ความสุขและสิ่งดี ๆ ค่ะ ✨"
            : isTest
            ? "การทดสอบสถานะเสร็จสมบูรณ์ ขอบคุณที่ร่วมทดสอบระบบจัดการคิว"
            : "ขอบคุณที่ใช้บริการนะคะ หากต้องการสอบถามเพิ่มเติมสามารถติดต่อได้ตลอดเวลาค่ะ ✨",
        },
      },
      packages: [...preset.packages],
    });
    showToast(`เปลี่ยนเทมเพลตเป็น "${preset.label}" เรียบร้อย ✨`, "success");
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPackageInput.trim();
    if (!trimmed) return;
    if (config.packages.includes(trimmed)) {
      showToast("มีชื่อแพ็กเกจนี้อยู่ในรายการแล้ว", "info");
      return;
    }
    updatePreviewConfig({
      packages: [...config.packages, trimmed],
    });
    setNewPackageInput("");
  };

  const handleRemovePackage = (pkgToRemove: string) => {
    updatePreviewConfig({
      packages: config.packages.filter((p) => p !== pkgToRemove),
    });
  };

  const generateConfigFileContent = () => {
    return `// วางทับในไฟล์ config/template.config.ts (ส่วน TEMPLATE_CONFIG)
export const TEMPLATE_CONFIG: TemplateConfig = ${JSON.stringify(
      {
        brand: config.brand,
        theme:
          activeTheme === "custom"
            ? { preset: activeTheme, customColors }
            : { preset: activeTheme },
        labels: config.labels,
        packages: config.packages,
      },
      null,
      2
    )};`;
  };

  const handleRandomizeCustomColors = () => {
    const randomPastelHex = (minLight = 200, maxLight = 248) => {
      const r = Math.floor(minLight + Math.random() * (maxLight - minLight));
      const g = Math.floor(minLight + Math.random() * (maxLight - minLight));
      const b = Math.floor(minLight + Math.random() * (maxLight - minLight));
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    };
    const randomAccentHex = () => {
      const r = Math.floor(110 + Math.random() * 125);
      const g = Math.floor(110 + Math.random() * 125);
      const b = Math.floor(110 + Math.random() * 125);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    };
    const randomDeepHex = () => {
      const r = Math.floor(30 + Math.random() * 55);
      const g = Math.floor(30 + Math.random() * 55);
      const b = Math.floor(35 + Math.random() * 65);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    };

    updateCustomColors({
      purple: randomAccentHex(),
      lavender: randomPastelHex(195, 240),
      pink: randomPastelHex(205, 245),
      babypink: randomPastelHex(240, 252),
      bgBase: "#FCFDFE",
      deep: randomDeepHex(),
    });
    showToast("สุ่มชุดสีพาสเทลใหม่เรียบร้อยแล้ว ✨", "success");
  };

  const CUSTOM_COLOR_FIELDS: {
    key: keyof ThemeColors;
    label: string;
    hint: string;
  }[] = [
    {
      key: "purple",
      label: "สีหลัก / ปุ่มเด่น (Primary Accent)",
      hint: "ใช้กับปุ่มกดหลัก กรอบที่เลือก และไฮไลท์สำคัญ",
    },
    {
      key: "lavender",
      label: "สีรอง / กรอบการ์ด (Secondary Soft)",
      hint: "ใช้กับขอบการ์ด ป้ายแท็ก และแถบสกอร์บาร์",
    },
    {
      key: "pink",
      label: "สีไฮไลท์ไล่เฉด (Gradient Highlight)",
      hint: "ใช้ไล่เฉดสีปุ่มและแสงออร่าพื้นหลัง",
    },
    {
      key: "babypink",
      label: "สีพื้นหลังการ์ดอ่อน (Soft Card Tint)",
      hint: "ใช้กับกล่องข้อความย่อยและพื้นหลังส่วนเน้น",
    },
    {
      key: "bgBase",
      label: "สีพื้นหลังเว็บไซต์ (Page Background)",
      hint: "สีพื้นหลังหลักของหน้าเว็บทั้งหมด",
    },
    {
      key: "deep",
      label: "สีตัวอักษรหลัก / หัวข้อ (Deep Text)",
      hint: "สีข้อความหัวข้อและตัวหนังสือบนปุ่มหลัก",
    },
  ];

  const handleCopyConfigCode = () => {
    navigator.clipboard.writeText(generateConfigFileContent());
    setCopiedCode(true);
    showToast("คัดลอกโค้ดการตั้งค่าเทมเพลตเรียบร้อยแล้วค่ะ ✨", "success");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([generateConfigFileContent()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.config.snippet.ts";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("ดาวน์โหลดไฟล์ตั้งค่าเทมเพลตสำเร็จ ✨", "success");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="pastel-card p-6 sm:p-8 bg-gradient-to-r from-pastel-purple/25 via-pastel-lavender/20 to-pastel-pink/25 border-pastel-lavender/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <BrandLogo
                logoUrl={config.brand.logoUrl}
                iconName={config.brand.icon}
                alt={config.brand.name}
                size="lg"
                className="shrink-0"
                onImageLoadStatus={(loaded) => setLogoLoadError(!loaded)}
              />
              <div>
                <div className="flex items-center gap-2 text-pastel-deep text-xs font-bold uppercase tracking-wider mb-1">
                  <Palette className="w-4 h-4" />
                  <span>Starter Template Studio • ปรับแต่งแม่แบบเว็บไซต์</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-pastel-deep font-magic">
                  ตั้งค่าเทมเพลตและโทนสีร้าน 🎨
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  ทดลองเปลี่ยนประเภทธุรกิจ โทนสี ชื่อร้าน โลโก้ และแพ็กเกจแบบสด (Live Preview) หรือแก้ไขถาวรได้ที่ไฟล์{" "}
                  <code className="px-1.5 py-0.5 rounded bg-white/80 font-mono text-xs text-pastel-deep border border-pastel-lavender">
                    config/template.config.ts
                  </code>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/track/demo-tq-20261025-0001"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-pastel-deep border border-pastel-lavender text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Eye className="w-4 h-4" />
                <span>ดูหน้าติดตามคิวลูกค้า</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {hasLiveOverrides && (
                <button
                  type="button"
                  onClick={() => {
                    resetPreviewConfig();
                    showToast("คืนค่าเริ่มต้นของเทมเพลตเรียบร้อยค่ะ", "info");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: 1-Click Business Template Presets */}
        <div className="pastel-card p-6 border-pastel-lavender/60 space-y-4">
          <div className="flex items-center justify-between border-b border-pastel-lavender/30 pb-3">
            <div>
              <h2 className="text-base font-bold text-pastel-deep flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>1. เลือกเทมเพลตสำเร็จรูปตามประเภทธุรกิจ (1-Click Preset)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                คลิกเพื่อเปลี่ยนโทนสี ชื่อตัวอย่าง คำเรียกหน่วยนับ และรายการแพ็กเกจให้เข้ากับธุรกิจทันที
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {BUSINESS_PRESETS.map((preset) => {
              const isCurrent =
                config.brand.name === preset.shopName &&
                activeTheme === preset.themePreset;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyBusinessPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? "bg-pastel-babypink border-pastel-purple ring-2 ring-pastel-purple/40 shadow-sm"
                      : "bg-white/80 hover:bg-white border-gray-200 hover:border-pastel-lavender"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-pastel-deep mb-1">
                      {preset.label}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">
                      {preset.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                    <span className="font-mono font-bold text-pastel-deep bg-pastel-lavender/30 px-2 py-0.5 rounded-md">
                      รหัสคิว: {preset.queuePrefix}-XXXX
                    </span>
                    <span className="text-gray-500">
                      {preset.packages.length} บริการ
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Color Theme Presets */}
        <div className="pastel-card p-6 border-pastel-lavender/60 space-y-4">
          <div className="border-b border-pastel-lavender/30 pb-3">
            <h2 className="text-base font-bold text-pastel-deep flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>2. เลือกโทนสีของเว็บไซต์ (Color Theme Presets)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              เปลี่ยนโทนสีพาสเทลได้ทันที ระบบจะปรับสีพื้นหลัง ปุ่ม กรอบการ์ด และป้ายสถานะให้อัตโนมัติ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((themeKey) => {
              const preset = THEME_PRESETS[themeKey];
              const isSelected = activeTheme === themeKey;
              const swatchColors =
                themeKey === "custom" ? customColors : preset.colors;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPreviewTheme(preset.id);
                    showToast(`เปลี่ยนโทนสีเป็น ${preset.name} แล้ว ✨`, "success");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-white border-pastel-deep ring-2 ring-pastel-purple shadow-md"
                      : "bg-white/75 hover:bg-white border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-extrabold text-gray-800">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-1.5 pt-2">
                    <span
                      className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: swatchColors.purple }}
                      title="Primary Accent"
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: swatchColors.lavender }}
                      title="Secondary Soft"
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: swatchColors.pink }}
                      title="Highlight Pink/Warm"
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: swatchColors.deep }}
                      title="Deep Text"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Color Studio (Free-form color customization) */}
          <div className="mt-4 pt-4 border-t border-pastel-lavender/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-pastel-deep flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>ปรับแต่งชุดสีเองอย่างอิสระ (Custom Color Studio)</span>
                  {activeTheme === "custom" && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-pastel-purple/25 text-pastel-deep font-bold">
                      กำลังใช้งานโทนสีที่คุณแต่งเอง
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  จิ้มเลือกสีจากถาดสีหรือพิมพ์รหัสสี Hex (#RRGGBB) ได้ตามต้องการ ระบบจะสลับเป็นโหมด{" "}
                  <strong>Custom Palette</strong> และเปลี่ยนสีเว็บแบบเรียลไทม์ทันที
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTheme !== "custom" && (
                  <button
                    type="button"
                    onClick={() => {
                      const baseColors = THEME_PRESETS[activeTheme]?.colors || THEME_PRESETS["pastel-magic"].colors;
                      updateCustomColors({ ...baseColors });
                      showToast("ดึงสีจากโทนปัจจุบันมาปรับแต่งต่อแล้ว ✨", "info");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-pastel-babypink border border-pastel-lavender text-xs font-bold text-pastel-deep transition"
                  >
                    ดึงสีโทนปัจจุบันมาแต่งต่อ
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRandomizeCustomColors}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-pastel-babypink border border-pastel-lavender text-xs font-bold text-pastel-deep flex items-center gap-1.5 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>สุ่มชุดสีพาสเทล</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CUSTOM_COLOR_FIELDS.map((field) => {
                const currentHex = customColors[field.key] || "#FFFFFF";
                return (
                  <div
                    key={field.key}
                    className="p-3.5 rounded-2xl bg-white/85 border border-gray-200 hover:border-pastel-lavender transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-pastel-deep truncate">
                        {field.label}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">
                        {field.hint}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={currentHex}
                          maxLength={7}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCustomColors({ [field.key]: val });
                          }}
                          className="w-24 px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-mono text-xs font-bold text-pastel-deep uppercase focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                        />
                      </div>
                    </div>

                    <label className="relative cursor-pointer shrink-0 group" title="คลิกเพื่อเลือกสี">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(currentHex) ? currentHex : "#B9A0F5"}
                        onChange={(e) =>
                          updateCustomColors({ [field.key]: e.target.value.toUpperCase() })
                        }
                        className="sr-only"
                      />
                      <div
                        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md ring-1 ring-black/10 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: currentHex }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Brand & Terminology Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Identity */}
          <div className="pastel-card p-6 border-pastel-lavender/60 space-y-4">
            <div className="border-b border-pastel-lavender/30 pb-3">
              <h2 className="text-base font-bold text-pastel-deep flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>3. ข้อมูลร้าน โลโก้ และรหัสคิว (Brand Identity)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  ชื่อร้านแบบสั้น (Sidebar / Login)
                </label>
                <input
                  type="text"
                  value={config.brand.name}
                  onChange={(e) =>
                    updatePreviewConfig({
                      brand: { ...config.brand, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  ชื่อร้านแบบเต็ม (หน้าลูกค้า / Dashboard)
                </label>
                <input
                  type="text"
                  value={config.brand.fullName}
                  onChange={(e) =>
                    updatePreviewConfig({
                      brand: { ...config.brand, fullName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  คำโปรยใต้ชื่อร้าน (Subtitle)
                </label>
                <input
                  type="text"
                  value={config.brand.subtitle}
                  onChange={(e) =>
                    updatePreviewConfig({
                      brand: { ...config.brand, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  รหัสนำหน้าเลขคิว (Queue Prefix)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={config.brand.queuePrefix}
                  onChange={(e) =>
                    updatePreviewConfig({
                      brand: {
                        ...config.brand,
                        queuePrefix: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm font-mono font-bold text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  ไอคอนประจำร้าน (เมื่อไม่ใช้รูปโลโก้)
                </label>
                <select
                  value={config.brand.icon}
                  onChange={(e) =>
                    updatePreviewConfig({
                      brand: {
                        ...config.brand,
                        icon: e.target.value as BrandIconName,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-pastel-deep">
                    รูปโลโก้ร้าน (อัปโหลดจากเครื่อง หรือวางลิงก์รูปภาพ)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-pastel-lavender/40 hover:bg-pastel-lavender text-pastel-deep text-xs font-bold flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดรูปจากเครื่อง</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="sr-only"
                      />
                    </label>
                    {config.brand.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoLoadError(false);
                          updatePreviewConfig({
                            brand: { ...config.brand, logoUrl: "" },
                          });
                          showToast("ลบรูปโลโก้และกลับไปใช้ไอคอนแล้ว", "info");
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition"
                        title="ลบรูปโลโก้"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ลบรูป</span>
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="วางลิงก์รูปภาพโดยตรง (https://... .png/.jpg หรือลิงก์ Google Drive) หรือกดปุ่มอัปโหลดด้านบน"
                  value={
                    config.brand.logoUrl.startsWith("data:image/")
                      ? "[อัปโหลดรูปจากเครื่องแล้ว — กด 'ลบรูป' หากต้องการเปลี่ยนเป็นลิงก์]"
                      : config.brand.logoUrl
                  }
                  readOnly={config.brand.logoUrl.startsWith("data:image/")}
                  onChange={(e) => {
                    setLogoLoadError(false);
                    updatePreviewConfig({
                      brand: { ...config.brand, logoUrl: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />

                {logoLoadError && config.brand.logoUrl.trim() !== "" && (
                  <p className="text-[11px] text-rose-600 font-medium bg-rose-50/80 border border-rose-200 rounded-xl px-3 py-2">
                    ⚠️ ไม่สามารถโหลดรูปจากลิงก์นี้ได้ (อาจไม่ใช่ลิงก์ไฟล์รูปภาพโดยตรง หรือเว็บต้นทางบล็อกการแสดงผล) ระบบจึงแสดงไอคอนแทนชั่วคราว — แนะนำให้กดปุ่ม{" "}
                    <strong>&quot;อัปโหลดรูปจากเครื่อง&quot;</strong> ด้านบนแทนได้เลยครับ
                  </p>
                )}
              </div>
            </div>

            {/* Terminology */}
            <div className="pt-3 border-t border-pastel-lavender/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  หัวข้อเลือกบริการ
                </label>
                <input
                  type="text"
                  value={config.labels.serviceLabel}
                  onChange={(e) =>
                    updatePreviewConfig({
                      labels: { ...config.labels, serviceLabel: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-xs text-pastel-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  หัวข้อจำนวนนับ
                </label>
                <input
                  type="text"
                  value={config.labels.unitCountLabel}
                  onChange={(e) =>
                    updatePreviewConfig({
                      labels: {
                        ...config.labels,
                        unitCountLabel: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-xs text-pastel-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pastel-deep mb-1">
                  คำเรียกผู้ให้บริการ
                </label>
                <input
                  type="text"
                  value={config.labels.staffTitle}
                  onChange={(e) =>
                    updatePreviewConfig({
                      labels: { ...config.labels, staffTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white/80 text-xs text-pastel-deep"
                />
              </div>
            </div>
          </div>

          {/* Service Packages Editor */}
          <div className="pastel-card p-6 border-pastel-lavender/60 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-pastel-lavender/30 pb-3">
                <h2 className="text-base font-bold text-pastel-deep flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>
                    4. รายการแพ็กเกจ / บริการด่วน ({config.packages.length} รายการ)
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  ปุ่มตัวเลือกด่วนที่จะแสดงในหน้า &quot;เพิ่มคิวใหม่&quot; และหน้า &quot;แก้ไขคิว&quot;
                </p>
              </div>

              <form onSubmit={handleAddPackage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อแพ็กเกจหรือบริการใหม่..."
                  value={newPackageInput}
                  onChange={(e) => setNewPackageInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm text-pastel-deep focus:outline-none focus:ring-2 focus:ring-pastel-purple"
                />
                <button
                  type="submit"
                  className="btn-magical px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มบริการ</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto p-1">
                {config.packages.map((pkg) => (
                  <span
                    key={pkg}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-pastel-lavender/30 text-pastel-deep border border-pastel-lavender/60 font-medium"
                  >
                    <span>✦ {pkg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(pkg)}
                      className="text-gray-400 hover:text-rose-600 transition"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-pastel-babypink/60 border border-pastel-pink/50 text-xs text-pastel-deep">
              💡 <strong>Tip:</strong> เมื่อปรับแต่งจนถูกใจแล้ว กดคัดลอกโค้ดด้านล่างไปวางในไฟล์{" "}
              <code className="font-mono font-bold">config/template.config.ts</code>{" "}
              เพื่อให้การตั้งค่ามีผลถาวรกับทุกคนที่เข้าเว็บ
            </div>
          </div>
        </div>

        {/* Section 5: Generated Code Export */}
        <div className="pastel-card p-6 border-pastel-lavender/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pastel-lavender/30 pb-3">
            <div>
              <h2 className="text-base font-bold text-pastel-deep flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>
                  5. โค้ดตั้งค่าสำหรับบันทึกถาวรลงไฟล์ (config/template.config.ts)
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                คัดลอกโค้ดด้านล่างไปวางทับส่วน <code>TEMPLATE_CONFIG</code> ในไฟล์{" "}
                <code>config/template.config.ts</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyConfigCode}
                className="btn-magical px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกโค้ดตั้งค่า</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-4 py-2 rounded-xl bg-white hover:bg-pastel-babypink border border-pastel-lavender text-xs font-semibold text-pastel-deep flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
            {generateConfigFileContent()}
          </pre>
        </div>
      </div>
    </AdminLayout>
  );
}
