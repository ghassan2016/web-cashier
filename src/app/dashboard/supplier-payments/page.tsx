"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Payment = {
  id: number;
  number: string;
  supplier_name: string | null;
  amount: number;
  payment_date: string | null;
  notes: string | null;
};
type Ref = { id: number; name: string };
const money = (n: number) => Number(n).toFixed(2);

export default function SupplierPaymentsPage() {
  const [list, setList] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Ref[]>([]);
  const [methods, setMethods] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ supplier_id: string; payment_method_id: string; amount: string; notes: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: Payment[] }>("/supplier-payments?per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/suppliers?per_page=200").then((r) => setSuppliers(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/payment-methods").then((r) => setMethods(r.data ?? [])).catch(() => {});
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      await api("/supplier-payments", {
        method: "POST",
        body: {
          supplier_id: Number(form.supplier_id),
          payment_method_id: form.payment_method_id ? Number(form.payment_method_id) : null,
          amount: Number(form.amount),
          notes: form.notes || null,
        },
      });
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">سداد الموردين</h1>
        <button onClick={() => setForm({ supplier_id: "", payment_method_id: "", amount: "", notes: "" })} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ سداد</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">السند</th>
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد سندات</td></tr>
            ) : (
              list.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-[#0E7C66]">{p.number}</td>
                  <td className="px-4 py-3 text-slate-700">{p.supplier_name ?? "—"}</td>
                  <td className="px-4 py-3">{money(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.payment_date ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{p.notes ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">سداد مورد</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">المورد</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={form.payment_method_id} onChange={(e) => setForm({ ...form, payment_method_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">طريقة الدفع (اختياري)</option>
                {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
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
