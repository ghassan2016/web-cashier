"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type OB = { id: number; warehouse_id: number; balance_date: string | null; status: string };
type Ref = { id: number; name: string };
type Line = { item_id: string; qty: string; unit_cost: string };

export default function OpeningBalancesPage() {
  const [list, setList] = useState<OB[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [warehouses, setWarehouses] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ warehouse_id: string; lines: Line[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList((await api<{ data: OB[] }>("/opening-balances?per_page=50")).data ?? []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/items?per_page=300").then((r) => setItems(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/warehouses?per_page=100").then((r) => setWarehouses(r.data ?? [])).catch(() => {});
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      await api("/opening-balances", { method: "POST", body: {
        warehouse_id: Number(form.warehouse_id),
        lines: form.lines.map((l) => ({ item_id: Number(l.item_id), qty: Number(l.qty), unit_cost: Number(l.unit_cost) || 0 })).filter((l) => l.item_id),
      } });
      setForm(null); await load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "تعذّر الترحيل"); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">أرصدة أول المدة</h1>
        <button onClick={() => setForm({ warehouse_id: "", lines: [{ item_id: "", qty: "", unit_cost: "" }] })} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ رصيد افتتاحي</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>
            <th className="px-4 py-3 font-medium">رقم</th><th className="px-4 py-3 font-medium">التاريخ</th><th className="px-4 py-3 font-medium">الحالة</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            : list.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">لا توجد أرصدة</td></tr>
            : list.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium text-[#0E7C66]">#{o.id}</td>
                <td className="px-4 py-3 text-slate-600">{o.balance_date ?? "—"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs text-emerald-700">مُرحّل</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 font-bold text-slate-800">رصيد افتتاحي</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="mb-3 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">المخزن</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <div className="space-y-2 rounded-lg border p-3">
              {form.lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <select value={l.item_id} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => j === i ? { ...x, item_id: e.target.value } : x) })} className="flex-1 rounded-lg border px-2 py-1 text-sm">
                    <option value="">الصنف</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder="كمية" value={l.qty} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })} className="w-20 rounded-lg border px-2 py-1 text-sm" />
                  <input type="number" step="0.0001" placeholder="تكلفة" value={l.unit_cost} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => j === i ? { ...x, unit_cost: e.target.value } : x) })} className="w-24 rounded-lg border px-2 py-1 text-sm" />
                  <button onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })} className="text-red-600">✕</button>
                </div>
              ))}
              <button onClick={() => setForm({ ...form, lines: [...form.lines, { item_id: "", qty: "", unit_cost: "" }] })} className="text-sm text-[#0E7C66] hover:underline">+ صنف</button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={save} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "ترحيل"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
