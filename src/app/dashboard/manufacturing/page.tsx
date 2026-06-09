"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type MO = {
  id: number;
  number: string;
  item_name: string | null;
  produced_qty: number;
  total_cost: number;
  unit_cost: number;
  production_date: string | null;
};
type Ref = { id: number; name: string };
type CompLine = { item_id: string; qty: string };
const money = (n: number) => Number(n).toFixed(2);

export default function ManufacturingPage() {
  const [list, setList] = useState<MO[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [warehouses, setWarehouses] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ warehouse_id: "", item_id: "", produced_qty: "" });
  const [lines, setLines] = useState<CompLine[]>([]);
  const [useBom, setUseBom] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: MO[] }>("/manufacturing?per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/items?per_page=300").then((r) => setItems(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/warehouses?per_page=100").then((r) => setWarehouses(r.data ?? [])).catch(() => {});
  }, [load]);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        warehouse_id: Number(form.warehouse_id),
        item_id: Number(form.item_id),
        produced_qty: Number(form.produced_qty),
      };
      if (!useBom) {
        body.lines = lines
          .map((l) => ({ item_id: Number(l.item_id), qty: Number(l.qty) }))
          .filter((l) => l.item_id && l.qty > 0);
      }
      await api("/manufacturing", { method: "POST", body });
      setShow(false);
      setForm({ warehouse_id: "", item_id: "", produced_qty: "" });
      setLines([]);
      setUseBom(true);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التنفيذ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">التصنيع</h1>
        <button onClick={() => setShow(true)} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ أمر تصنيع</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الأمر</th>
              <th className="px-4 py-3 font-medium">المنتج</th>
              <th className="px-4 py-3 font-medium">الكمية</th>
              <th className="px-4 py-3 font-medium">التكلفة الإجمالية</th>
              <th className="px-4 py-3 font-medium">تكلفة الوحدة</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد أوامر تصنيع</td></tr>
            ) : (
              list.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-[#0E7C66]">{m.number}</td>
                  <td className="px-4 py-3 text-slate-700">{m.item_name ?? "—"}</td>
                  <td className="px-4 py-3">{m.produced_qty}</td>
                  <td className="px-4 py-3">{money(m.total_cost)}</td>
                  <td className="px-4 py-3">{money(m.unit_cost)}</td>
                  <td className="px-4 py-3 text-slate-600">{m.production_date ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">أمر تصنيع جديد</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">المخزن
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">—</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-600">المنتج الناتج
                <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">—</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-600">الكمية المنتجة
                <input type="number" step="0.01" value={form.produced_qty} onChange={(e) => setForm({ ...form, produced_qty: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={useBom} onChange={(e) => setUseBom(e.target.checked)} />
                استخدام قائمة مكوّنات المنتج (BOM) تلقائيًا
              </label>
              {!useBom && (
                <div className="space-y-2 rounded-lg border p-3">
                  {lines.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <select value={l.item_id} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, item_id: e.target.value } : x))} className="flex-1 rounded-lg border px-2 py-1 text-sm">
                        <option value="">المكوّن</option>
                        {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      <input type="number" step="0.01" placeholder="كمية" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} className="w-24 rounded-lg border px-2 py-1 text-sm" />
                      <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-red-600">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setLines([...lines, { item_id: "", qty: "" }])} className="text-sm text-[#0E7C66] hover:underline">+ مكوّن</button>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={submit} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "تنفيذ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
