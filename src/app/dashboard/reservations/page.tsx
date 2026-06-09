"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Reservation = {
  id: number;
  number: string;
  reserved_for: string;
  total: number;
  deposit_total: number;
  balance_due: number;
  status: string;
  customer: { name: string } | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  booked: { label: "محجوز", cls: "bg-slate-100 text-slate-600" },
  preparing: { label: "قيد التحضير", cls: "bg-amber-100 text-amber-700" },
  delivered: { label: "مُسلّم", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغى", cls: "bg-red-100 text-red-700" },
};
const NEXT: Record<string, { to: string; label: string }[]> = {
  booked: [{ to: "preparing", label: "بدء التحضير" }, { to: "cancelled", label: "إلغاء" }],
  preparing: [{ to: "delivered", label: "تسليم" }, { to: "cancelled", label: "إلغاء" }],
};

export default function ReservationsPage() {
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ reserved_for: "", total: "", deposit_total: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: Reservation[] }>("/reservations?per_page=100");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: number, status: string) {
    await api(`/reservations/${id}/status`, { method: "POST", body: { status } });
    await load();
  }

  async function create() {
    setError(null);
    if (!form.reserved_for) return setError("حدّد تاريخ الحجز");
    setSaving(true);
    try {
      await api("/reservations", {
        method: "POST",
        body: {
          reserved_for: form.reserved_for,
          total: Number(form.total) || 0,
          deposit_total: Number(form.deposit_total) || 0,
          notes: form.notes || null,
        },
      });
      setShow(false);
      setForm({ reserved_for: "", total: "", deposit_total: "", notes: "" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">الحجوزات</h1>
        <button onClick={() => setShow(true)} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ حجز جديد</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الرقم</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">تاريخ الحجز</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">المتبقّي</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد حجوزات</td></tr>
            ) : (
              list.map((r) => {
                const st = STATUS[r.status] ?? { label: r.status, cls: "bg-slate-100" };
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-[#0E7C66]">{r.number}</td>
                    <td className="px-4 py-3 text-slate-700">{r.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.reserved_for?.replace("T", " ").slice(0, 16)}</td>
                    <td className="px-4 py-3">{r.total.toFixed(2)}</td>
                    <td className="px-4 py-3">{r.balance_due.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(NEXT[r.status] ?? []).map((n) => (
                          <button key={n.to} onClick={() => setStatus(r.id, n.to)} className="text-xs text-[#0E7C66] hover:underline">{n.label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">حجز جديد</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">تاريخ الحجز
                <input type="datetime-local" value={form.reserved_for} onChange={(e) => setForm({ ...form, reserved_for: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-600">الإجمالي
                  <input type="number" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                </label>
                <label className="block text-sm text-slate-600">العربون
                  <input type="number" step="0.01" value={form.deposit_total} onChange={(e) => setForm({ ...form, deposit_total: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                </label>
              </div>
              <label className="block text-sm text-slate-600">ملاحظات
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={create} disabled={saving} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{saving ? "جارٍ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
