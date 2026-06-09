"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Component = { id: number; type: string; name: string; amount: number };
type Salary = {
  id: number;
  employee_id: number;
  employee_name: string | null;
  period: string;
  basic: number;
  allowances: number;
  deductions: number;
  advances: number;
  net: number;
  status: string;
  components: Component[];
};

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-slate-100 text-slate-600" },
  approved: { label: "معتمد", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "مدفوع", cls: "bg-emerald-100 text-emerald-700" },
};
const TYPES: Record<string, string> = { allowance: "بدل", bonus: "مكافأة", deduction: "خصم", advance: "سلفة" };
const thisMonth = () => new Date().toISOString().slice(0, 7);
const money = (n: number) => Number(n).toFixed(2);

export default function PayrollPage() {
  const [period, setPeriod] = useState(thisMonth());
  const [list, setList] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comp, setComp] = useState<{ salary: Salary; type: string; name: string; amount: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: Salary[] }>(`/salaries?period=${period}&per_page=200`);
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setBusy(true); setError(null);
    try {
      await api("/salaries/generate", { method: "POST", body: { period } });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التوليد");
    } finally { setBusy(false); }
  }

  async function act(id: number, action: "approve" | "pay") {
    await api(`/salaries/${id}/${action}`, { method: "POST" });
    await load();
  }

  async function addComponent() {
    if (!comp) return;
    setBusy(true); setError(null);
    try {
      await api(`/salaries/${comp.salary.id}/components`, {
        method: "POST",
        body: { type: comp.type, name: comp.name, amount: Number(comp.amount) || 0 },
      });
      setComp(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإضافة");
    } finally { setBusy(false); }
  }

  const totalNet = list.reduce((s, x) => s + Number(x.net), 0);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-800">الرواتب</h1>
        <div className="flex items-end gap-2">
          <label className="text-sm text-slate-600">الشهر
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="ms-2 rounded-lg border px-2 py-1" />
          </label>
          <button onClick={generate} disabled={busy} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">
            توليد كشف الرواتب
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الموظف</th>
              <th className="px-4 py-3 font-medium">الأساسي</th>
              <th className="px-4 py-3 font-medium">البدلات</th>
              <th className="px-4 py-3 font-medium">الخصومات</th>
              <th className="px-4 py-3 font-medium">السلف</th>
              <th className="px-4 py-3 font-medium">الصافي</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">لا توجد رواتب — اضغط «توليد كشف الرواتب»</td></tr>
            ) : (
              list.map((s) => {
                const st = STATUS[s.status] ?? { label: s.status, cls: "bg-slate-100" };
                return (
                  <tr key={s.id} className="border-t align-top">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.employee_name ?? `#${s.employee_id}`}
                      {s.components.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {s.components.map((c) => (
                            <span key={c.id} className="mr-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                              {TYPES[c.type] ?? c.type}: {c.name} {money(c.amount)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{money(s.basic)}</td>
                    <td className="px-4 py-3 text-emerald-700">{money(s.allowances)}</td>
                    <td className="px-4 py-3 text-red-600">{money(s.deductions)}</td>
                    <td className="px-4 py-3 text-red-600">{money(s.advances)}</td>
                    <td className="px-4 py-3 font-bold text-[#0E7C66]">{money(s.net)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {s.status !== "paid" && (
                          <button onClick={() => setComp({ salary: s, type: "allowance", name: "", amount: "" })} className="text-slate-600 hover:underline">+ بند</button>
                        )}
                        {s.status === "draft" && (
                          <button onClick={() => act(s.id, "approve")} className="text-amber-700 hover:underline">اعتماد</button>
                        )}
                        {s.status !== "paid" && (
                          <button onClick={() => act(s.id, "pay")} className="text-[#0E7C66] hover:underline">صرف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {list.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-bold">
                <td className="px-4 py-3" colSpan={5}>إجمالي صافي الرواتب</td>
                <td className="px-4 py-3 text-[#0E7C66]">{money(totalNet)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {comp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setComp(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">إضافة بند — {comp.salary.employee_name}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">النوع
                <select value={comp.type} onChange={(e) => setComp({ ...comp, type: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                  {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-600">الوصف
                <input value={comp.name} onChange={(e) => setComp({ ...comp, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm text-slate-600">المبلغ
                <input type="number" step="0.01" value={comp.amount} onChange={(e) => setComp({ ...comp, amount: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setComp(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={addComponent} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
