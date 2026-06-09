"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Adj = { id: number; item_id: number; old_cost: number; new_cost: number; adjustment_date: string | null; reason: string | null };
type Ref = { id: number; name: string };
const money = (n: number) => Number(n).toFixed(2);

export default function CostAdjustmentsPage() {
  const [list, setList] = useState<Adj[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [warehouses, setWarehouses] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ warehouse_id: string; item_id: string; new_cost: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList((await api<{ data: Adj[] }>("/cost-adjustments?per_page=50")).data ?? []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/items?per_page=300").then((r) => setItems(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/warehouses?per_page=100").then((r) => setWarehouses(r.data ?? [])).catch(() => {});
  }, [load]);

  const itemName = (id: number) => items.find((i) => i.id === id)?.name ?? `#${id}`;

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      await api("/cost-adjustments", { method: "POST", body: {
        warehouse_id: Number(form.warehouse_id), item_id: Number(form.item_id),
        new_cost: Number(form.new_cost), reason: form.reason || null,
      } });
      setForm(null); await load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">تعديل التكلفة</h1>
        <button onClick={() => setForm({ warehouse_id: "", item_id: "", new_cost: "", reason: "" })} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ تعديل</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>
            <th className="px-4 py-3 font-medium">الصنف</th><th className="px-4 py-3 font-medium">التكلفة القديمة</th>
            <th className="px-4 py-3 font-medium">التكلفة الجديدة</th><th className="px-4 py-3 font-medium">التاريخ</th><th className="px-4 py-3 font-medium">السبب</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            : list.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد تعديلات</td></tr>
            : list.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 text-slate-700">{itemName(a.item_id)}</td>
                <td className="px-4 py-3">{money(a.old_cost)}</td>
                <td className="px-4 py-3 font-semibold text-[#0E7C66]">{money(a.new_cost)}</td>
                <td className="px-4 py-3 text-slate-600">{a.adjustment_date ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{a.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">تعديل تكلفة صنف</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">المخزن</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">الصنف</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input type="number" step="0.0001" placeholder="التكلفة الجديدة" value={form.new_cost} onChange={(e) => setForm({ ...form, new_cost: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="السبب" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={save} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
