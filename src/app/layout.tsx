import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "كاهييه — نظام نقاط البيع وإدارة المطاعم",
  description: "لوحة تحكّم Back Office لنظام نقاط البيع وإدارة المطاعم المتكامل",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "كاهييه" },
};

export const viewport: Viewport = {
  themeColor: "#0E7C66",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-cairo)]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
