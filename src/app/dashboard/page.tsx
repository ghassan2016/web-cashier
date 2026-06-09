"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, me, type AuthUser } from "@/lib/api";

type SalesReport = {
  total_sales: number;
  net_sales: number;
  tax_total: number;
  invoice_count: number;
  average_ticket: number;
  by_day: { date: string; total: number; count: number }[];
  top_items: { name: string; qty: number; total: number }[];
};

const money = (n: number) => `${Number(n ?? 0).toFixed(2)} ر.س`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function OverviewPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [today, setToday] = useState<SalesReport | null>(null);
  const [week, setWeek] = useState<SalesReport | null>(null);

  useEffect(() => {
    (async () => {
      setUser(await me().catch(() => null));
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);

      api<{ data: SalesReport }>(`/reports/sales?from=${iso(now)}&to=${iso(now)}`)
        .then((r) => setToday(r.data)).catch(() => {});
      api<{ data: SalesReport }>(`/reports/sales?from=${iso(weekAgo)}&to=${iso(now)}`)
        .then((r) => setWeek(r.data)).catch(() => {});
    })();
  }, []);

  const maxDay = Math.max(...(week?.by_day.map((d) => d.total) ?? [1]), 1);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-lg font-bold text-slate-800">نظرة عامة</h1>
        <p className="text-sm text-slate-500">
          مرحبًا {user?.name ?? "..."} — الأدوار: {user?.roles.join("، ")}
        </p>
      </header>

      {/* Today KPIs */}
      <h2 className="mb-2 text-sm font-semibold text-slate-600">اليوم</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="إجمالي المبيعات" value={money(today?.total_sales ?? 0)} accent />
        <Card label="صافي المبيعات" value={money(today?.net_sales ?? 0)} />
        <Card label="عدد الفواتير" value={today?.invoice_count ?? 0} />
        <Card label="متوسط الفاتورة" value={money(today?.average_ticket ?? 0)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 7-day chart */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-bold text-slate-700">مبيعات آخر 7 أيام</h2>
          {week && week.by_day.length > 0 ? (
            <div className="space-y-2">
              {week.by_day.map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-500">{d.date.slice(5)}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                    <div className="h-full rounded bg-[#0E7C66]" style={{ width: `${(d.total / maxDay) * 100}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-left font-medium text-slate-700">{Number(d.total).toFixed(0)}</span>
                </div>
              ))}
              <div className="mt-3 border-t pt-2 text-sm font-bold text-slate-700">
                إجمالي الأسبوع: <span className="text-[#0E7C66]">{money(week.total_sales)}</span>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">لا توجد مبيعات</p>
          )}
        </div>

        {/* Top items this week */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-bold text-slate-700">أكثر الأصناف مبيعًا (الأسبوع)</h2>
          {week && week.top_items.length > 0 ? (
            <div className="space-y-2 text-sm">
              {week.top_items.slice(0, 8).map((it, i) => (
                <div key={i} className="flex justify-between border-b py-1.5 last:border-0">
                  <span className="text-slate-700">{i + 1}. {it.name}</span>
                  <span className="text-slate-500">{it.qty} · <b className="text-slate-700">{Number(it.total).toFixed(0)}</b></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/dashboard/items", label: "إدارة الأصناف", icon: "🍔" },
          { href: "/dashboard/online-orders", label: "الطلبات أونلاين", icon: "🛍️" },
          { href: "/dashboard/shifts", label: "الورديات", icon: "🧾" },
          { href: "/dashboard/financials", label: "القوائم المالية", icon: "📊" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="rounded-xl border bg-white p-4 hover:border-[#0E7C66] hover:shadow-sm">
            <span className="text-2xl">{q.icon}</span>
            <p className="mt-2 font-medium text-slate-700">{q.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-[#0E7C66]" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
