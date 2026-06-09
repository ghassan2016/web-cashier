"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Summary = {
  business_date: string;
  total_sales: number;
  total_returns: number;
  total_cancelled: number;
  net_sales: number;
  invoice_count: number;
  open_shifts: number;
  is_closed: boolean;
};
type Closing = {
  id: number;
  business_date: string;
  mode: string;
  total_sales: number;
  total_returns: number;
  branch?: { name: string } | null;
};

const money = (n: number) => `${Number(n ?? 0).toFixed(2)} ر.س`;
const today = () => new Date().toISOString().slice(0, 10);

export default function DayClosingsPage() {
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Closing[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, h] = await Promise.all([
        api<{ data: Summary }>(`/day-closings/summary?date=${date}`),
        api<{ data: Closing[] }>("/day-closings?per_page=30"),
      ]);
      setSummary(s.data);
      setHistory(h.data ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function closeDay() {
    setBusy(true); setError(null); setMsg(null);
    try {
      await api("/day-closings", { method: "POST", body: { business_date: date, mode: "manual" } });
      setMsg("تم إقفال اليوم");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإقفال");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-800">إقفال اليوم</h1>
        <label className="text-sm text-slate-600">التاريخ
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ms-2 rounded-lg border px-2 py-1" />
        </label>
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</p>}

      {summary && (
        <div className="mb-6 rounded-xl border bg-white p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="إجمالي المبيعات" v={summary.total_sales} accent />
            <Stat label="المرتجعات" v={summary.total_returns} />
            <Stat label="صافي المبيعات" v={summary.net_sales} />
            <Stat label="عدد الفواتير" v={summary.invoice_count} raw />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              ورديات مفتوحة: {summary.open_shifts}
              {summary.open_shifts > 0 && <span className="text-amber-600"> — يُفضّل إغلاقها قبل الإقفال</span>}
            </span>
            {summary.is_closed ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">اليوم مُقفل ✓</span>
            ) : (
              <button onClick={closeDay} disabled={busy} className="rounded-lg bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-60">
                {busy ? "جارٍ…" : "إقفال اليوم"}
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="mb-2 font-bold text-slate-700">سجلّ الإقفالات</h2>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">الفرع</th>
              <th className="px-4 py-3 font-medium">المبيعات</th>
              <th className="px-4 py-3 font-medium">المرتجعات</th>
              <th className="px-4 py-3 font-medium">الوضع</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا يوجد سجلّ</td></tr>
            ) : history.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium text-[#0E7C66]">{c.business_date}</td>
                <td className="px-4 py-3 text-slate-600">{c.branch?.name ?? "—"}</td>
                <td className="px-4 py-3">{money(c.total_sales)}</td>
                <td className="px-4 py-3">{money(c.total_returns)}</td>
                <td className="px-4 py-3 text-slate-500">{c.mode === "auto" ? "تلقائي" : "يدوي"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, v, accent, raw }: { label: string; v: number; accent?: boolean; raw?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-bold ${accent ? "text-[#0E7C66]" : "text-slate-800"}`}>{raw ? v : money(v)}</div>
    </div>
  );
}
