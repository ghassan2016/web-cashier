"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type PR = {
  id: number;
  number: string;
  supplier_name: string | null;
  grand_total: number;
  return_date: string | null;
};
type Ref = { id: number; name: string };
type RetLine = { item_id: string; qty: string };
const money = (n: number) => Number(n).toFixed(2);

export default function PurchaseReturnsPage() {
  const [list, setList] = useState<PR[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [suppliers, setSuppliers] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", refund_to_cash: false });
  const [lines, setLines] = useState<RetLine[]>([{ item_id: "", qty: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: PR[] }>("/purchase-returns?per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/items?per_page=300").then((r) => setItems(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/suppliers?per_page=200").then((r) => setSuppliers(r.data ?? [])).catch(() => {});
  }, [load]);

  async function submit() {
    setBusy(true); setError(null);
    try {
      await api("/purchase-returns", {
        method: "POST",
        body: {
          supplier_id: Number(form.supplier_id),
          refund_to_cash: form.refund_to_cash,
          lines: lines
            .map((l) => ({ item_id: Number(l.item_id), qty: Number(l.qty) }))
            .filter((l) => l.item_id && l.qty > 0),
        },
      });
      setShow(false);
      setForm({ supplier_id: "", refund_to_cash: false });
      setLines([{ item_id: "", qty: "" }]);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">مرتجع المشتريات</h1>
        <button onClick={() => setShow(true)} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ مرتجع جديد</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">المرتجع</th>
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد مرتجعات</td></tr>
            ) : (
              list.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-[#0E7C66]">{p.number}</td>
                  <td className="px-4 py-3 text-slate-700">{p.supplier_name ?? "—"}</td>
                  <td className="px-4 py-3">{money(p.grand_total)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.return_date ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">مرتجع مشتريات جديد</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">المورد
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">—</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <div className="space-y-2 rounded-lg border p-3">
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <select value={l.item_id} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, item_id: e.target.value } : x))} className="flex-1 rounded-lg border px-2 py-1 text-sm">
                      <option value="">الصنف</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                    <input type="number" step="0.01" placeholder="كمية" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} className="w-24 rounded-lg border px-2 py-1 text-sm" />
                    <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-red-600">✕</button>
                  </div>
                ))}
                <button onClick={() => setLines([...lines, { item_id: "", qty: "" }])} className="text-sm text-[#0E7C66] hover:underline">+ صنف</button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.refund_to_cash} onChange={(e) => setForm({ ...form, refund_to_cash: e.target.checked })} />
                استرداد نقدي (بدل خصم رصيد المورد)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={submit} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
