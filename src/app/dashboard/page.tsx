"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, me, type AuthUser } from "@/lib/api";
import { money } from "@/lib/currency";

type SalesReport = {
  total_sales: number;
  net_sales: number;
  tax_total: number;
  invoice_count: number;
  average_ticket: number;
  by_day: { date: string; total: number; count: number }[];
  top_items: { name: string; qty: number; total: number }[];
};

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
        <h1 className="text-2xl font-bold text-slate-800">نظرة عامة</h1>
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
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-700">مبيعات آخر 7 أيام</h2>
          {week && week.by_day.length > 0 ? (
            <div className="space-y-2.5">
              {week.by_day.map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-500">{d.date.slice(5)}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[var(--primary-light)] to-[var(--primary)] transition-[width] duration-500"
                      style={{ width: `${(d.total / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-left font-medium tabular-nums text-slate-700">{Number(d.total).toFixed(0)}</span>
                </div>
              ))}
              <div className="mt-3 border-t border-border pt-3 text-sm font-bold text-slate-700">
                إجمالي الأسبوع: <span className="text-[var(--primary)]">{money(week.total_sales)}</span>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">لا توجد مبيعات</p>
          )}
        </div>

        {/* Top items this week */}
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-700">أكثر الأصناف مبيعًا (الأسبوع)</h2>
          {week && week.top_items.length > 0 ? (
            <div className="space-y-1 text-sm">
              {week.top_items.slice(0, 8).map((it, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-xs font-bold text-[var(--primary-dark)]">{i + 1}</span>
                    {it.name}
                  </span>
                  <span className="text-slate-500">{it.qty} · <b className="tabular-nums text-slate-700">{Number(it.total).toFixed(0)}</b></span>
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
          <Link
            key={q.href}
            href={q.href}
            className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-xl transition group-hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]">
              {q.icon}
            </span>
            <p className="font-medium text-slate-700">{q.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className={`card p-4 transition hover:shadow-md ${
        accent ? "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-emerald-600/20" : ""
      }`}
    >
      <p className={`text-sm ${accent ? "text-white/80" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-white" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
