"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Movement = { id: number; type: string; amount: number; reason: string | null };
type Shift = {
  id: number;
  status: string;
  opened_at: string | null;
  closed_at: string | null;
  opening_balance: number;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  total_sales: number;
  total_returns: number;
  user?: { name: string } | null;
  cash_drawer?: { name: string } | null;
  movements?: Movement[];
  summary?: { expected_cash?: number } | null;
};
type Drawer = { id: number; name: string };

const money = (n: number) => Number(n ?? 0).toFixed(2);
const MTYPE: Record<string, string> = { in: "إيداع", out: "سحب", expense: "مصروف" };

export default function ShiftsPage() {
  const [current, setCurrent] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<{ cash_drawer_id: string; opening_balance: string } | null>(null);
  const [mvForm, setMvForm] = useState<{ type: string; amount: string; reason: string } | null>(null);
  const [closeForm, setCloseForm] = useState<{ counted_cash: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cur, hist] = await Promise.all([
        api<{ data: Shift | null }>("/shifts/current"),
        api<{ data: Shift[] }>("/shifts?per_page=30"),
      ]);
      setCurrent(cur.data);
      setHistory(hist.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Drawer[] }>("/cash-drawers").then((r) => setDrawers(r.data ?? [])).catch(() => {});
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await fn(); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  const openShift = () => run(async () => {
    await api("/shifts", { method: "POST", body: { cash_drawer_id: Number(openForm!.cash_drawer_id), opening_balance: Number(openForm!.opening_balance) || 0 } });
    setOpenForm(null);
  });
  const addMovement = () => run(async () => {
    await api(`/shifts/${current!.id}/movements`, { method: "POST", body: { type: mvForm!.type, amount: Number(mvForm!.amount), reason: mvForm!.reason || null } });
    setMvForm(null);
  });
  const closeShift = () => run(async () => {
    await api(`/shifts/${current!.id}/close`, { method: "POST", body: { counted_cash: Number(closeForm!.counted_cash) || 0 } });
    setCloseForm(null);
  });

  if (loading) return <div className="p-6 text-slate-400">جارٍ التحميل…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">الورديات والصندوق</h1>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {current ? (
        <div className="mb-6 rounded-xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">الوردية المفتوحة — {current.cash_drawer?.name ?? ""}</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs text-emerald-700">مفتوحة</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="الرصيد الافتتاحي" v={current.opening_balance} />
            <Stat label="المبيعات" v={current.total_sales} />
            <Stat label="المرتجعات" v={current.total_returns} />
            <Stat label="النقد المتوقّع" v={current.summary?.expected_cash ?? current.expected_cash} accent />
          </div>
          {current.movements && current.movements.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-semibold text-slate-600">الحركات</h3>
              <div className="space-y-1 text-sm">
                {current.movements.map((m) => (
                  <div key={m.id} className="flex justify-between border-b py-1 last:border-0">
                    <span className="text-slate-600">{MTYPE[m.type] ?? m.type}{m.reason ? ` — ${m.reason}` : ""}</span>
                    <span className={m.type === "in" ? "text-emerald-700" : "text-red-600"}>{money(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setMvForm({ type: "in", amount: "", reason: "" })} className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">+ حركة نقدية</button>
            <button onClick={() => setCloseForm({ counted_cash: "" })} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900">إغلاق الوردية</button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border bg-white p-5 text-center">
          <p className="mb-3 text-slate-500">لا توجد وردية مفتوحة</p>
          <button onClick={() => setOpenForm({ cash_drawer_id: String(drawers[0]?.id ?? ""), opening_balance: "" })} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C]">فتح وردية</button>
        </div>
      )}

      <h2 className="mb-2 font-bold text-slate-700">السجلّ</h2>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الكاشير</th>
              <th className="px-4 py-3 font-medium">الفتح</th>
              <th className="px-4 py-3 font-medium">الإغلاق</th>
              <th className="px-4 py-3 font-medium">المبيعات</th>
              <th className="px-4 py-3 font-medium">الفرق</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا يوجد سجلّ</td></tr>
            ) : history.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3 text-slate-700">{s.user?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.opened_at?.replace("T", " ").slice(0, 16) ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.closed_at?.replace("T", " ").slice(0, 16) ?? "—"}</td>
                <td className="px-4 py-3">{money(s.total_sales)}</td>
                <td className={`px-4 py-3 ${Number(s.difference) === 0 ? "text-slate-600" : "text-red-600"}`}>{money(s.difference)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-0.5 text-xs ${s.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {s.status === "open" ? "مفتوحة" : "مغلقة"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openForm && (
        <Modal title="فتح وردية" onClose={() => setOpenForm(null)} onSave={openShift} busy={busy}>
          <label className="block text-sm text-slate-600">درج النقد
            <select value={openForm.cash_drawer_id} onChange={(e) => setOpenForm({ ...openForm, cash_drawer_id: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">—</option>
              {drawers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-sm text-slate-600">الرصيد الافتتاحي
            <input type="number" step="0.01" value={openForm.opening_balance} onChange={(e) => setOpenForm({ ...openForm, opening_balance: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </Modal>
      )}
      {mvForm && (
        <Modal title="حركة نقدية" onClose={() => setMvForm(null)} onSave={addMovement} busy={busy}>
          <label className="block text-sm text-slate-600">النوع
            <select value={mvForm.type} onChange={(e) => setMvForm({ ...mvForm, type: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="in">إيداع</option>
              <option value="out">سحب</option>
              <option value="expense">مصروف</option>
            </select>
          </label>
          <label className="mt-3 block text-sm text-slate-600">المبلغ
            <input type="number" step="0.01" value={mvForm.amount} onChange={(e) => setMvForm({ ...mvForm, amount: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="mt-3 block text-sm text-slate-600">السبب
            <input value={mvForm.reason} onChange={(e) => setMvForm({ ...mvForm, reason: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </Modal>
      )}
      {closeForm && (
        <Modal title="إغلاق الوردية" onClose={() => setCloseForm(null)} onSave={closeShift} busy={busy}>
          <p className="mb-2 text-sm text-slate-500">النقد المتوقّع: {money(current?.summary?.expected_cash ?? current?.expected_cash ?? 0)}</p>
          <label className="block text-sm text-slate-600">النقد المعدود فعليًا
            <input type="number" step="0.01" value={closeForm.counted_cash} onChange={(e) => setCloseForm({ counted_cash: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, v, accent }: { label: string; v: number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-bold ${accent ? "text-[#0E7C66]" : "text-slate-800"}`}>{money(v)}</div>
    </div>
  );
}

function Modal({ title, children, onClose, onSave, busy }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-bold text-slate-800">{title}</h2>
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
          <button onClick={onSave} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "حفظ"}</button>
        </div>
      </div>
    </div>
  );
}
