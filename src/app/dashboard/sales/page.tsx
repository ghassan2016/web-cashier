"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Line = { id: number; item_name: string; qty: number; line_total: number };
type Sale = {
  id: number;
  number: string;
  status: string;
  order_type: string;
  delivery_fee: number;
  grand_total: number;
  invoiced_at: string | null;
  lines?: Line[];
};

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "مكتملة", cls: "bg-emerald-100 text-emerald-700" },
  returned: { label: "مُرتجعة", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغاة", cls: "bg-slate-100 text-slate-600" },
};
const money = (n: number) => Number(n).toFixed(2);

export default function SalesPage() {
  const [list, setList] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [ret, setRet] = useState<{ sale: Sale; qty: Record<number, string> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: Sale[] }>("/sales?per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openReturn(sale: Sale) {
    setError(null);
    // Load full invoice with lines.
    const res = await api<{ data: Sale }>(`/sales/${sale.id}`);
    const full = res.data;
    const qty: Record<number, string> = {};
    (full.lines ?? []).forEach((l) => (qty[l.id] = String(l.qty)));
    setRet({ sale: full, qty });
  }

  async function submitReturn(full: boolean) {
    if (!ret) return;
    setBusy(true); setError(null);
    try {
      const body = full
        ? {}
        : {
            lines: (ret.sale.lines ?? [])
              .map((l) => ({ sale_line_id: l.id, qty: Number(ret.qty[l.id]) || 0 }))
              .filter((l) => l.qty > 0),
          };
      await api(`/sales/${ret.sale.id}/return`, { method: "POST", body });
      setRet(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإرجاع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">المبيعات والمرتجعات</h1>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الفاتورة</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">رسوم التوصيل</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد فواتير</td></tr>
            ) : (
              list.map((s) => {
                const st = STATUS[s.status] ?? { label: s.status, cls: "bg-slate-100" };
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-[#0E7C66]">{s.number}</td>
                    <td className="px-4 py-3 text-slate-600">{s.invoiced_at?.replace("T", " ").slice(0, 16) ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.order_type}</td>
                    <td className="px-4 py-3 text-slate-600">{s.delivery_fee > 0 ? money(s.delivery_fee) : "—"}</td>
                    <td className="px-4 py-3">{money(s.grand_total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      {s.status === "completed" ? (
                        <button onClick={() => openReturn(s)} className="text-xs text-red-600 hover:underline">إرجاع</button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {ret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRet(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 font-bold text-slate-800">إرجاع الفاتورة {ret.sale.number}</h2>
            <p className="mb-4 text-xs text-slate-500">عدّل الكميات لإرجاع جزئي، أو اضغط «إرجاع كلي».</p>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="max-h-72 space-y-2 overflow-auto">
              {(ret.sale.lines ?? []).map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <span className="flex-1 text-sm text-slate-700">{l.item_name}</span>
                  <span className="text-xs text-slate-400">من {l.qty}</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={l.qty}
                    value={ret.qty[l.id] ?? ""}
                    onChange={(e) => setRet({ ...ret, qty: { ...ret.qty, [l.id]: e.target.value } })}
                    className="w-20 rounded-lg border px-2 py-1 text-center text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRet(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={() => submitReturn(false)} disabled={busy} className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60">إرجاع جزئي</button>
              <button onClick={() => submitReturn(true)} disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60">إرجاع كلي</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
