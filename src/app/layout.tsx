// ============================================
// ملف: src/app/layout.tsx
// ============================================
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novex Pharma - نظام إدارة الصيدليات",
  description:
    "نظام متكامل لإدارة الصيدليات والمستودع والطلبات والإيصالات - Novex Pharma",
  keywords: ["صيدلية", "أدوية", "مستودع", "إدارة", "Novex Pharma"],
  authors: [{ name: "Novex Pharma" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Novex Pharma",
  },
  openGraph: {
    title: "Novex Pharma - نظام إدارة الصيدليات",
    description: "نظام متكامل لإدارة الصيدليات",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}