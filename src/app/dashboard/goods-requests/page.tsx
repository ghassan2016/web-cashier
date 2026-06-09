"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Req = { id: number; number: string; from_branch_id: number; to_branch_id: number | null; status: string; request_date: string | null };
type Ref = { id: number; name: string };
type Line = { item_id: string; qty: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "مُرسل", cls: "bg-amber-100 text-amber-700" },
  prepared: { label: "مُجهّز", cls: "bg-blue-100 text-blue-700" },
  transferred: { label: "مُحوّل", cls: "bg-emerald-100 text-emerald-700" },
};

export default function GoodsRequestsPage() {
  const [list, setList] = useState<Req[]>([]);
  const [items, setItems] = useState<Ref[]>([]);
  const [branches, setBranches] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ from_branch_id: string; to_branch_id: string; lines: Line[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList((await api<{ data: Req[] }>("/goods-requests?per_page=50")).data ?? []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Ref[] }>("/items?per_page=300").then((r) => setItems(r.data ?? [])).catch(() => {});
    api<{ data: Ref[] }>("/branches").then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, [load]);

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      await api("/goods-requests", { method: "POST", body: {
        from_branch_id: form.from_branch_id ? Number(form.from_branch_id) : null,
        to_branch_id: form.to_branch_id ? Number(form.to_branch_id) : null,
        lines: form.lines.map((l) => ({ item_id: Number(l.item_id), qty: Number(l.qty) })).filter((l) => l.item_id && l.qty > 0),
      } });
      setForm(null); await load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  }

  async function fulfill(id: number) {
    if (!confirm("تنفيذ الطلب وتحويل البضاعة؟")) return;
    try { await api(`/goods-requests/${id}/fulfill`, { method: "POST" }); await load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "تعذّر التنفيذ"); }
  }

  const branchName = (id: number | null) => branches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">طلبات البضاعة بين الفروع</h1>
        <button onClick={() => setForm({ from_branch_id: "", to_branch_id: "", lines: [{ item_id: "", qty: "" }] })} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ طلب</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>
            <th className="px-4 py-3 font-medium">الرقم</th><th className="px-4 py-3 font-medium">من</th><th className="px-4 py-3 font-medium">إلى</th>
            <th className="px-4 py-3 font-medium">الحالة</th><th className="px-4 py-3 font-medium">إجراء</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            : list.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد طلبات</td></tr>
            : list.map((r) => {
              const st = STATUS[r.status] ?? { label: r.status, cls: "bg-slate-100" };
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-[#0E7C66]">{r.number}</td>
                  <td className="px-4 py-3 text-slate-600">{branchName(r.from_branch_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{branchName(r.to_branch_id)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                  <td className="px-4 py-3">
                    {r.status !== "transferred"
                      ? <button onClick={() => fulfill(r.id)} className="text-xs text-[#0E7C66] hover:underline">تنفيذ وتحويل</button>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 font-bold text-slate-800">طلب بضاعة</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <select value={form.from_branch_id} onChange={(e) => setForm({ ...form, from_branch_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                <option value="">من فرع</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={form.to_branch_id} onChange={(e) => setForm({ ...form, to_branch_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                <option value="">إلى فرع</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              {form.lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <select value={l.item_id} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => j === i ? { ...x, item_id: e.target.value } : x) })} className="flex-1 rounded-lg border px-2 py-1 text-sm">
                    <option value="">الصنف</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder="كمية" value={l.qty} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => j === i ? { ...x, qty: e.target.value } : x) })} className="w-24 rounded-lg border px-2 py-1 text-sm" />
                  <button onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })} className="text-red-600">✕</button>
                </div>
              ))}
              <button onClick={() => setForm({ ...form, lines: [...form.lines, { item_id: "", qty: "" }] })} className="text-sm text-[#0E7C66] hover:underline">+ صنف</button>
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
