"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  TEMPLATE_CONFIG,
  TemplateConfig,
  ThemePresetId,
  ThemeColors,
  THEME_PRESETS,
} from "@/config/template.config";

const STORAGE_KEY_THEME = "template_preview_theme";
const STORAGE_KEY_OVERRIDES = "template_preview_overrides";
const STORAGE_KEY_CUSTOM_COLORS = "template_preview_custom_colors";

const CSS_VAR_NAMES = [
  "--pastel-lavender",
  "--pastel-purple",
  "--pastel-pink",
  "--pastel-babypink",
  "--pastel-milky",
  "--pastel-deep",
  "--pastel-blue",
  "--pastel-yellow",
  "--pastel-green",
  "--bg-base",
  "--text-base",
  "--btn-text",
];

function hexToRgbTriplet(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return null;
}

function applyThemeToDOM(theme: ThemePresetId, customColors?: ThemeColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  const palette: ThemeColors =
    theme === "custom" && customColors
      ? customColors
      : (THEME_PRESETS[theme] || THEME_PRESETS["pastel-magic"]).colors;

  const map: Record<string, string | undefined> = {
    "--pastel-lavender": hexToRgbTriplet(palette.lavender) || undefined,
    "--pastel-purple": hexToRgbTriplet(palette.purple) || undefined,
    "--pastel-pink": hexToRgbTriplet(palette.pink) || undefined,
    "--pastel-babypink": hexToRgbTriplet(palette.babypink) || undefined,
    "--pastel-milky": hexToRgbTriplet(palette.milky) || undefined,
    "--pastel-deep": hexToRgbTriplet(palette.deep) || undefined,
    "--pastel-blue": hexToRgbTriplet(palette.blue) || undefined,
    "--pastel-yellow": hexToRgbTriplet(palette.yellow) || undefined,
    "--pastel-green": hexToRgbTriplet(palette.green) || undefined,
    "--bg-base": palette.bgBase,
    "--text-base": palette.deep,
    "--btn-text": palette.deep,
  };
  for (const [varName, val] of Object.entries(map)) {
    if (val) {
      root.style.setProperty(varName, val);
    }
  }
}

interface TemplateContextValue {
  config: TemplateConfig;
  activeTheme: ThemePresetId;
  customColors: ThemeColors;
  setPreviewTheme: (theme: ThemePresetId) => void;
  updateCustomColors: (partial: Partial<ThemeColors>) => void;
  updatePreviewConfig: (partial: Partial<TemplateConfig>) => void;
  resetPreviewConfig: () => void;
  hasLiveOverrides: boolean;
}

const DEFAULT_CUSTOM_COLORS: ThemeColors = {
  ...THEME_PRESETS.custom.colors,
  ...(TEMPLATE_CONFIG.theme.customColors || {}),
};

const TemplateContext = createContext<TemplateContextValue>({
  config: TEMPLATE_CONFIG,
  activeTheme: TEMPLATE_CONFIG.theme.preset,
  customColors: DEFAULT_CUSTOM_COLORS,
  setPreviewTheme: () => {},
  updateCustomColors: () => {},
  updatePreviewConfig: () => {},
  resetPreviewConfig: () => {},
  hasLiveOverrides: false,
});

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [config, setConfig] = useState<TemplateConfig>(TEMPLATE_CONFIG);
  const [activeTheme, setActiveTheme] = useState<ThemePresetId>(
    TEMPLATE_CONFIG.theme.preset
  );
  const [customColors, setCustomColors] = useState<ThemeColors>(DEFAULT_CUSTOM_COLORS);
  const [hasLiveOverrides, setHasLiveOverrides] = useState(false);

  // Load saved live preview overrides from localStorage on client mount
  useEffect(() => {
    try {
      let resolvedCustomColors = DEFAULT_CUSTOM_COLORS;
      const savedCustomColors = localStorage.getItem(STORAGE_KEY_CUSTOM_COLORS);
      if (savedCustomColors) {
        resolvedCustomColors = {
          ...DEFAULT_CUSTOM_COLORS,
          ...JSON.parse(savedCustomColors),
        };
        setCustomColors(resolvedCustomColors);
        setHasLiveOverrides(true);
      }

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemePresetId | null;
      const effectiveTheme =
        savedTheme && THEME_PRESETS[savedTheme]
          ? savedTheme
          : TEMPLATE_CONFIG.theme.preset;

      if (savedTheme && THEME_PRESETS[savedTheme]) {
        setActiveTheme(savedTheme);
        setHasLiveOverrides(true);
      }

      applyThemeToDOM(effectiveTheme, resolvedCustomColors);

      const savedOverrides = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (savedOverrides) {
        const parsed = JSON.parse(savedOverrides);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          brand: { ...prev.brand, ...(parsed.brand || {}) },
          theme: {
            ...prev.theme,
            ...(parsed.theme || {}),
            customColors: resolvedCustomColors,
          },
          labels: {
            ...prev.labels,
            ...(parsed.labels || {}),
            customerTracking: {
              ...prev.labels.customerTracking,
              ...(parsed.labels?.customerTracking || {}),
            },
          },
          packages: Array.isArray(parsed.packages) ? parsed.packages : prev.packages,
        }));
        setHasLiveOverrides(true);
      }
    } catch {
      applyThemeToDOM(TEMPLATE_CONFIG.theme.preset, DEFAULT_CUSTOM_COLORS);
    }
  }, []);

  // Re-enforce DOM theme and CSS variables on every route navigation
  useEffect(() => {
    applyThemeToDOM(activeTheme, customColors);
  }, [pathname, activeTheme, customColors]);

  const setPreviewTheme = (theme: ThemePresetId) => {
    setActiveTheme(theme);
    applyThemeToDOM(theme, customColors);
    setConfig((prev) => {
      const next: TemplateConfig = {
        ...prev,
        theme: {
          ...prev.theme,
          preset: theme,
          ...(theme === "custom" ? { customColors } : {}),
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(next));
        setHasLiveOverrides(true);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const updateCustomColors = (partial: Partial<ThemeColors>) => {
    setCustomColors((prevColors) => {
      const nextColors: ThemeColors = { ...prevColors, ...partial };
      setActiveTheme("custom");
      applyThemeToDOM("custom", nextColors);

      setConfig((prevConfig) => {
        const nextConfig: TemplateConfig = {
          ...prevConfig,
          theme: {
            ...prevConfig.theme,
            preset: "custom",
            customColors: nextColors,
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY_THEME, "custom");
          localStorage.setItem(STORAGE_KEY_CUSTOM_COLORS, JSON.stringify(nextColors));
          localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(nextConfig));
          setHasLiveOverrides(true);
        } catch {
          // ignore storage errors
        }
        return nextConfig;
      });

      return nextColors;
    });
  };

  const updatePreviewConfig = (partial: Partial<TemplateConfig>) => {
    setConfig((prev) => {
      const nextTheme = partial.theme?.preset || prev.theme.preset;
      const next: TemplateConfig = {
        ...prev,
        ...partial,
        brand: { ...prev.brand, ...(partial.brand || {}) },
        theme: { ...prev.theme, ...(partial.theme || {}) },
        labels: {
          ...prev.labels,
          ...(partial.labels || {}),
          customerTracking: {
            ...prev.labels.customerTracking,
            ...(partial.labels?.customerTracking || {}),
          },
        },
        packages: partial.packages ? [...partial.packages] : prev.packages,
      };
      try {
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(next));
        if (partial.theme?.preset) {
          localStorage.setItem(STORAGE_KEY_THEME, partial.theme.preset);
          setActiveTheme(partial.theme.preset);
          applyThemeToDOM(nextTheme, customColors);
        }
        setHasLiveOverrides(true);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const resetPreviewConfig = () => {
    setConfig(TEMPLATE_CONFIG);
    setActiveTheme(TEMPLATE_CONFIG.theme.preset);
    setCustomColors(DEFAULT_CUSTOM_COLORS);
    applyThemeToDOM(TEMPLATE_CONFIG.theme.preset, DEFAULT_CUSTOM_COLORS);
    setHasLiveOverrides(false);
    try {
      localStorage.removeItem(STORAGE_KEY_THEME);
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_COLORS);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <TemplateContext.Provider
      value={{
        config,
        activeTheme,
        customColors,
        setPreviewTheme,
        updateCustomColors,
        updatePreviewConfig,
        resetPreviewConfig,
        hasLiveOverrides,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplateConfig() {
  return useContext(TemplateContext);
}
