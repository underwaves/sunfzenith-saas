import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { TemplateProvider } from "@/components/TemplateProvider";
import { TEMPLATE_CONFIG } from "@/config/template.config";

export const metadata: Metadata = {
  title: `${TEMPLATE_CONFIG.brand.fullName} - ${TEMPLATE_CONFIG.brand.subtitle}`,
  description: TEMPLATE_CONFIG.brand.subtitle,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFD9E8",
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var root = document.documentElement;
    var savedTheme = localStorage.getItem("template_preview_theme");
    if (savedTheme) {
      root.setAttribute("data-theme", savedTheme);
    }
    if (savedTheme === "custom") {
      var rawColors = localStorage.getItem("template_preview_custom_colors");
      if (rawColors) {
        var c = JSON.parse(rawColors);
        function rgb(h) {
          if (!h) return null;
          var s = String(h).trim().replace(/^#/, "");
          if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
          if (s.length !== 6) return null;
          return parseInt(s.slice(0,2),16) + " " + parseInt(s.slice(2,4),16) + " " + parseInt(s.slice(4,6),16);
        }
        var map = {
          "--pastel-lavender": rgb(c.lavender),
          "--pastel-purple": rgb(c.purple),
          "--pastel-pink": rgb(c.pink),
          "--pastel-babypink": rgb(c.babypink),
          "--pastel-milky": rgb(c.milky),
          "--pastel-deep": rgb(c.deep),
          "--pastel-blue": rgb(c.blue),
          "--pastel-yellow": rgb(c.yellow),
          "--pastel-green": rgb(c.green),
          "--bg-base": c.bgBase,
          "--text-base": c.deep,
          "--btn-text": c.deep
        };
        for (var k in map) {
          if (map[k]) root.style.setProperty(k, map[k]);
        }
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-theme={TEMPLATE_CONFIG.theme.preset} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased selection:bg-pastel-lavender selection:text-pastel-deep">
        <TemplateProvider>
          <ToastProvider>{children}</ToastProvider>
        </TemplateProvider>
      </body>
    </html>
  );
}
