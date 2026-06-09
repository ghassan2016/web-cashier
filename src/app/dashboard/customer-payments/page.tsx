"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Payment = {
  id: number;
  number: string;
  customer_name: string | null;
  amount: number;
  payment_date: string | null;
  notes: string | null;
};
type Ref = { id: number; name: string; balance?: number };
type Row = { date: string | null; type: string; ref: string; debit: number; credit: number; balance: number };
const money = (n: number) => Number(n).toFixed(2);
const BTN = "rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60";

export default function CustomerPaymentsPage() {
  const [tab, setTab] = useState<"receipts" | "statement">("receipts");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">سندات القبض وكشف الحساب</h1>
      <div className="mb-5 flex gap-2">
        <button onClick={() => setTab("receipts")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "receipts" ? "bg-[#0E7C66] text-white" : "border bg-white text-slate-600"}`}>سندات القبض</button>
        <button onClick={() => setTab("statement")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "statement" ? "bg-[#0E7C66] text-white" : "border bg-white text-slate-600"}`}>كشف حساب عميل</button>
      </div>
      {tab === "receipts" ? <Receipts /> : <Statement />}
    </div>
  );
}

function Receipts() {
  const [list, setList] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [methods, setMethods] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ customer_id: string; payment_method_id: string; amount: string; notes: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: Payment[] }>("/customer-payments?per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/customers?per_page=300").then((r) => setCustomers(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/payment-methods").then((r) => setMethods(r.data ?? [])).catch(() => {});
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      await api("/customer-payments", {
        method: "POST",
        body: {
          customer_id: Number(form.customer_id),
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
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setForm({ customer_id: "", payment_method_id: "", amount: "", notes: "" })} className={BTN}>+ سند قبض</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">السند</th>
              <th className="px-4 py-3 font-medium">العميل</th>
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
                  <td className="px-4 py-3 text-slate-700">{p.customer_name ?? "—"}</td>
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
            <h2 className="mb-4 font-bold text-slate-800">سند قبض من عميل</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">العميل</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.balance ? ` (عليه ${money(c.balance)})` : ""}</option>)}
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
              <button onClick={save} disabled={busy} className={BTN}>{busy ? "جارٍ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Statement() {
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [rows, setRows] = useState<Row[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ data: Ref[] }>("/customers?per_page=300").then((r) => setCustomers(r.data ?? [])).catch(() => {});
  }, []);

  async function pick(id: number) {
    setCustomerId(id); setLoading(true);
    try {
      const res = await api<{ data: { balance: number; rows: Row[] } }>(`/customers/${id}/statement`);
      setRows(res.data.rows ?? []);
      setBalance(res.data.balance ?? 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="rounded-lg border px-3 py-2 text-sm" value={customerId}
          onChange={(e) => e.target.value && pick(Number(e.target.value))}>
          <option value="">اختر عميلًا…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {customerId !== "" && (
          <span className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
            الرصيد المستحق: {money(balance)}
          </span>
        )}
      </div>

      {customerId !== "" && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">البيان</th>
                <th className="px-4 py-3 font-medium">مدين</th>
                <th className="px-4 py-3 font-medium">دائن</th>
                <th className="px-4 py-3 font-medium">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد حركات</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 text-slate-600">{r.date ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{r.type === "invoice" ? `فاتورة ${r.ref}` : `سند قبض ${r.ref}`}</td>
                    <td className="px-4 py-3 text-red-600">{r.debit ? money(r.debit) : "—"}</td>
                    <td className="px-4 py-3 text-emerald-700">{r.credit ? money(r.credit) : "—"}</td>
                    <td className="px-4 py-3 font-medium">{money(r.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
