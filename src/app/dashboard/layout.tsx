"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, logout } from "@/lib/api";
import { initWebPush } from "@/lib/push";
import { setCurrency } from "@/lib/currency";
import { setCompanyName, useCompanyName } from "@/lib/company";

type NavItem = { href: string; label: string; icon: string };
type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    title: "عام",
    items: [{ href: "/dashboard", label: "نظرة عامة", icon: "📊" }],
  },
  {
    title: "الأصناف والمخزون",
    items: [
      { href: "/dashboard/items", label: "الأصناف", icon: "🍔" },
      { href: "/dashboard/modifiers", label: "المُعدِّلات والوجبات", icon: "🧩" },
      { href: "/dashboard/categories", label: "التصنيفات", icon: "🗂️" },
      { href: "/dashboard/menus", label: "قوائم المنيو", icon: "📋" },
      { href: "/dashboard/inventory", label: "المخزون", icon: "📦" },
      { href: "/dashboard/stock-counts", label: "الجرد الفعلي", icon: "📋" },
      { href: "/dashboard/opening-balances", label: "أرصدة أول المدة", icon: "🧱" },
      { href: "/dashboard/goods-requests", label: "طلبات البضاعة", icon: "🔁" },
      { href: "/dashboard/cost-adjustments", label: "تعديل التكلفة", icon: "⚖️" },
      { href: "/dashboard/manufacturing", label: "التصنيع", icon: "🏭" },
      { href: "/dashboard/warehouses", label: "المخازن", icon: "🏬" },
    ],
  },
  {
    title: "المشتريات والموردون",
    items: [
      { href: "/dashboard/purchases", label: "المشتريات", icon: "🚚" },
      { href: "/dashboard/purchase-returns", label: "مرتجع المشتريات", icon: "↩️" },
      { href: "/dashboard/suppliers", label: "الموردون", icon: "🏭" },
      { href: "/dashboard/supplier-payments", label: "سداد الموردين", icon: "💸" },
    ],
  },
  {
    title: "المبيعات والعملاء",
    items: [
      { href: "/dashboard/sales", label: "المبيعات والمرتجعات", icon: "🧾" },
      { href: "/dashboard/customers", label: "العملاء", icon: "👤" },
      { href: "/dashboard/customer-payments", label: "سندات القبض", icon: "🧾" },
      { href: "/dashboard/online-orders", label: "الطلبات أونلاين", icon: "🛍️" },
      { href: "/dashboard/dispatch", label: "إدارة التوصيل", icon: "🛵" },
      { href: "/dashboard/drivers", label: "السائقون", icon: "🧑‍✈️" },
      { href: "/dashboard/tables", label: "الطاولات", icon: "🍽️" },
      { href: "/dashboard/reservations", label: "الحجوزات", icon: "📅" },
    ],
  },
  {
    title: "التسعير والعروض",
    items: [
      { href: "/dashboard/discounts", label: "الخصومات", icon: "🏷️" },
      { href: "/dashboard/coupons", label: "الكوبونات", icon: "🎟️" },
      { href: "/dashboard/offers", label: "العروض", icon: "🎁" },
      { href: "/dashboard/taxes", label: "الضرائب", icon: "🧮" },
      { href: "/dashboard/payment-methods", label: "طرق الدفع", icon: "💳" },
      { href: "/dashboard/sales-reps", label: "مندوبو المبيعات", icon: "🧑‍💼" },
      { href: "/dashboard/cities", label: "المدن", icon: "🏙️" },
    ],
  },
  {
    title: "التقارير والمحاسبة",
    items: [
      { href: "/dashboard/reports", label: "التقارير", icon: "📈" },
      { href: "/dashboard/financials", label: "القوائم المالية", icon: "🧾" },
      { href: "/dashboard/accounts", label: "شجرة الحسابات", icon: "🌳" },
      { href: "/dashboard/journal", label: "القيود", icon: "📒" },
    ],
  },
  {
    title: "العمليات اليومية",
    items: [
      { href: "/dashboard/kitchen", label: "شاشة المطبخ", icon: "👨‍🍳" },
      { href: "/dashboard/shifts", label: "الورديات", icon: "🧾" },
      { href: "/dashboard/day-closings", label: "إقفال اليوم", icon: "🔒" },
      { href: "/dashboard/cash-drawers", label: "أدراج النقد", icon: "🗄️" },
    ],
  },
  {
    title: "الموارد البشرية",
    items: [
      { href: "/dashboard/employees", label: "الموظفون", icon: "👥" },
      { href: "/dashboard/payroll", label: "الرواتب", icon: "💵" },
    ],
  },
  {
    title: "النظام",
    items: [
      { href: "/dashboard/users", label: "المستخدمون", icon: "👤" },
      { href: "/dashboard/branches", label: "الفروع", icon: "🏢" },
      { href: "/dashboard/import", label: "استيراد البيانات", icon: "📥" },
      { href: "/dashboard/integrations", label: "التكاملات", icon: "🔌" },
      { href: "/dashboard/modules", label: "الوحدات", icon: "🧩" },
      { href: "/dashboard/settings", label: "الإعدادات", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const name = useCompanyName();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    // Load the web-wide company name + currency from settings. `/company-profile`
    // returns both (company_name and currency) and is readable by any staff user.
    api<{ data: { name?: string; currency?: string } }>("/company-profile")
      .then((res) => {
        setCompanyName(res.data?.name);
        setCurrency(res.data?.currency);
      })
      .catch(() => {});
    // Register this browser for push notifications (no-op without VAPID key).
    initWebPush();
  }, [router]);

  // Reflect the company name in the browser tab title (project-wide).
  useEffect(() => {
    document.title = name;
  }, [name]);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-slate-500">جارٍ التحميل...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-surface/95 backdrop-blur">
        {/* Branded header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[var(--primary-light)] to-[var(--primary)] text-lg text-white shadow-md shadow-emerald-600/30">
            🛒
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-slate-800">{name}</div>
            <div className="text-[11px] text-slate-400">لوحة التحكّم</div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
          {NAV.map((section) => (
            <div key={section.title}>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((n) => {
                  const active =
                    pathname === n.href ||
                    (n.href !== "/dashboard" && pathname.startsWith(`${n.href}/`));
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                        active
                          ? "bg-gradient-to-l from-[color-mix(in_srgb,var(--primary)_14%,transparent)] to-transparent font-semibold text-[var(--primary-dark)]"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 right-0 w-1 rounded-full bg-[var(--primary)]" />
                      )}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[15px] transition ${
                          active ? "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]" : "bg-slate-100 group-hover:bg-white"
                        }`}
                      >
                        {n.icon}
                      </span>
                      <span className="truncate">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            <span aria-hidden>↩</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
