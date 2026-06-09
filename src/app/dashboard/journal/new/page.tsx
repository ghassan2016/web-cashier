"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type Account = { id: number; code: string; name: string; is_group: boolean };
type Line = { account_id: string; debit: string; credit: string };

const emptyLine = (): Line => ({ account_id: "", debit: "0", credit: "0" });

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await api<{ data: Account[] }>("/accounts?is_active=1").catch(() => ({ data: [] }));
      // Only postable (non-group) accounts.
      setAccounts(res.data.filter((a) => !a.is_group));
    })();
  }, []);

  const totals = useMemo(() => {
    let d = 0, c = 0;
    for (const l of lines) { d += Number(l.debit) || 0; c += Number(l.credit) || 0; }
    return { debit: d, credit: c, balanced: d > 0 && Math.abs(d - c) < 0.001 };
  }, [lines]);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setError(null);
    const valid = lines.filter((l) => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (valid.length < 2) return setError("أضف سطرين على الأقل");
    if (!totals.balanced) return setError("القيد غير متوازن (مدين ≠ دائن)");
    setSaving(true);
    try {
      await api("/journal-entries", {
        method: "POST",
        body: {
          entry_date: date,
          description,
          lines: valid.map((l) => ({
            account_id: Number(l.account_id),
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        },
      });
      router.push("/dashboard/journal");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">قيد محاسبي يدوي</h1>
        <Link href="/dashboard/journal" className="text-sm text-slate-500 hover:underline">← رجوع</Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="mb-4 grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-slate-600">التاريخ
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm text-slate-600">البيان
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="وصف القيد" />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">الحساب</th>
              <th className="px-3 py-2 font-medium">مدين</th>
              <th className="px-3 py-2 font-medium">دائن</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">
                  <select value={l.account_id} onChange={(e) => setLine(i, { account_id: e.target.value })} className="w-full rounded border px-2 py-1">
                    <option value="">—</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2"><input type="number" step="0.01" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: "0" })} className="w-28 rounded border px-2 py-1" /></td>
                <td className="px-3 py-2"><input type="number" step="0.01" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: "0" })} className="w-28 rounded border px-2 py-1" /></td>
                <td className="px-3 py-2">
                  <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="text-red-600 hover:underline" disabled={lines.length <= 2}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t p-3">
          <button onClick={() => setLines((ls) => [...ls, emptyLine()])} className="text-sm text-[#0E7C66] hover:underline">+ إضافة سطر</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border bg-white p-4">
        <div className="text-sm">
          <span className="text-slate-600">مدين: <b>{totals.debit.toFixed(2)}</b></span>
          <span className="mx-3 text-slate-600">دائن: <b>{totals.credit.toFixed(2)}</b></span>
          {totals.balanced ? <span className="text-green-600">✓ متوازن</span> : <span className="text-red-600">غير متوازن</span>}
        </div>
        <button onClick={submit} disabled={saving || !totals.balanced} className="rounded-lg bg-[#0E7C66] px-6 py-2.5 text-white hover:bg-[#0A5C4C] disabled:opacity-50">
          {saving ? "جارٍ الحفظ…" : "حفظ القيد"}
        </button>
      </div>
    </div>
  );
}
