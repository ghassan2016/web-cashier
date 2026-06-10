"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/currency";

type SalesReport = {
  total_sales: number;
  net_sales: number;
  tax_total: number;
  discount_total: number;
  returns: number;
  invoice_count: number;
  average_ticket: number;
  by_payment: Record<string, number>;
  by_category: { name: string; total: number }[];
  by_day: { date: string; total: number; count: number }[];
  top_items: { name: string; qty: number; total: number }[];
};

const today = () => new Date().toISOString().slice(0, 10);

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  card: "شبكة",
  wallet: "محفظة",
  online: "أونلاين",
  credit: "آجل",
};

export default function ReportsPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ data: SalesReport }>(`/reports/sales?from=${from}&to=${to}`);
      setData(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر تحميل التقرير");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <h1 className="text-lg font-bold text-slate-800">تقرير المبيعات</h1>
        <div className="ms-auto flex items-end gap-2">
          <label className="text-sm text-slate-600">
            من
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ms-2 rounded-lg border px-2 py-1 text-sm" />
          </label>
          <label className="text-sm text-slate-600">
            إلى
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ms-2 rounded-lg border px-2 py-1 text-sm" />
          </label>
          <button onClick={load} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">عرض</button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-400">جارٍ التحميل…</p>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="إجمالي المبيعات" value={money(data.total_sales)} />
            <Stat label="عدد الفواتير" value={data.invoice_count} />
            <Stat label="متوسّط الفاتورة" value={money(data.average_ticket)} />
            <Stat label="الضريبة" value={money(data.tax_total)} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="حسب طريقة الدفع">
              {Object.entries(data.by_payment).length === 0 ? (
                <Empty />
              ) : (
                Object.entries(data.by_payment).map(([k, v]) => (
                  <Row key={k} a={PAYMENT_LABELS[k] ?? k} b={money(v)} />
                ))
              )}
            </Panel>

            <Panel title="حسب الفئة">
              {data.by_category.length === 0 ? <Empty /> : data.by_category.map((c) => (
                <Row key={c.name} a={c.name} b={money(c.total)} />
              ))}
            </Panel>
          </div>

          <Panel title="أعلى الأصناف مبيعًا">
            {data.top_items.length === 0 ? <Empty /> : data.top_items.map((t) => (
              <Row key={t.name} a={`${t.name} (×${t.qty})`} b={money(t.total)} />
            ))}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 font-bold text-slate-700">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 text-sm last:border-0">
      <span className="text-slate-600">{a}</span>
      <span className="font-medium text-slate-800">{b}</span>
    </div>
  );
}

function Empty() {
  return <p className="py-2 text-sm text-slate-400">لا توجد بيانات</p>;
}
