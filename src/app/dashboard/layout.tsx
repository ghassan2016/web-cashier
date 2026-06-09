"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, logout } from "@/lib/api";
import { initWebPush } from "@/lib/push";

const NAV = [
  { href: "/dashboard", label: "نظرة عامة", icon: "📊" },
  { href: "/dashboard/items", label: "الأصناف", icon: "🍔" },
  { href: "/dashboard/modifiers", label: "المُعدِّلات والوجبات", icon: "🧩" },
  { href: "/dashboard/categories", label: "التصنيفات", icon: "🗂️" },
  { href: "/dashboard/inventory", label: "المخزون", icon: "📦" },
  { href: "/dashboard/stock-counts", label: "الجرد الفعلي", icon: "📋" },
  { href: "/dashboard/opening-balances", label: "أرصدة أول المدة", icon: "🧱" },
  { href: "/dashboard/goods-requests", label: "طلبات البضاعة", icon: "🔁" },
  { href: "/dashboard/cost-adjustments", label: "تعديل التكلفة", icon: "⚖️" },
  { href: "/dashboard/purchases", label: "المشتريات", icon: "🚚" },
  { href: "/dashboard/purchase-returns", label: "مرتجع المشتريات", icon: "↩️" },
  { href: "/dashboard/manufacturing", label: "التصنيع", icon: "🏭" },
  { href: "/dashboard/sales", label: "المبيعات والمرتجعات", icon: "🧾" },
  { href: "/dashboard/customers", label: "العملاء", icon: "👤" },
  { href: "/dashboard/customer-payments", label: "سندات القبض", icon: "🧾" },
  { href: "/dashboard/suppliers", label: "الموردون", icon: "🏭" },
  { href: "/dashboard/supplier-payments", label: "سداد الموردين", icon: "💸" },
  { href: "/dashboard/warehouses", label: "المخازن", icon: "🏬" },
  { href: "/dashboard/menus", label: "قوائم المنيو", icon: "📋" },
  { href: "/dashboard/discounts", label: "الخصومات", icon: "🏷️" },
  { href: "/dashboard/sales-reps", label: "مندوبو المبيعات", icon: "🧑‍💼" },
  { href: "/dashboard/cities", label: "المدن", icon: "🏙️" },
  { href: "/dashboard/reports", label: "التقارير", icon: "📈" },
  { href: "/dashboard/accounts", label: "شجرة الحسابات", icon: "🌳" },
  { href: "/dashboard/journal", label: "القيود", icon: "📒" },
  { href: "/dashboard/financials", label: "القوائم المالية", icon: "🧾" },
  { href: "/dashboard/kitchen", label: "شاشة المطبخ", icon: "👨‍🍳" },
  { href: "/dashboard/online-orders", label: "الطلبات أونلاين", icon: "🛍️" },
  { href: "/dashboard/dispatch", label: "إدارة التوصيل", icon: "🛵" },
  { href: "/dashboard/drivers", label: "السائقون", icon: "🧑‍✈️" },
  { href: "/dashboard/tables", label: "الطاولات", icon: "🍽️" },
  { href: "/dashboard/reservations", label: "الحجوزات", icon: "📅" },
  { href: "/dashboard/shifts", label: "الورديات", icon: "🧾" },
  { href: "/dashboard/day-closings", label: "إقفال اليوم", icon: "🔒" },
  { href: "/dashboard/cash-drawers", label: "أدراج النقد", icon: "🗄️" },
  { href: "/dashboard/coupons", label: "الكوبونات", icon: "🎟️" },
  { href: "/dashboard/offers", label: "العروض", icon: "🏷️" },
  { href: "/dashboard/taxes", label: "الضرائب", icon: "🧮" },
  { href: "/dashboard/payment-methods", label: "طرق الدفع", icon: "💳" },
  { href: "/dashboard/employees", label: "الموظفون", icon: "👥" },
  { href: "/dashboard/payroll", label: "الرواتب", icon: "💵" },
  { href: "/dashboard/import", label: "استيراد البيانات", icon: "📥" },
  { href: "/dashboard/users", label: "المستخدمون", icon: "👤" },
  { href: "/dashboard/branches", label: "الفروع", icon: "🏢" },
  { href: "/dashboard/integrations", label: "التكاملات", icon: "🔌" },
  { href: "/dashboard/modules", label: "الوحدات", icon: "🧩" },
  { href: "/dashboard/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("كاهييه");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    // Show the configured restaurant name in the sidebar.
    api<{ data: { name: string } }>("/company-profile")
      .then((res) => { if (res.data?.name) setName(res.data.name); })
      .catch(() => {});
    // Register this browser for push notifications (no-op without VAPID key).
    initWebPush();
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-slate-500">جارٍ التحميل...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-full w-60 shrink-0 flex-col border-l bg-white">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <span className="text-2xl">🛒</span>
          <span className="font-bold text-slate-800">{name}</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[#0E7C66] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="m-3 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
        >
          تسجيل الخروج
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
