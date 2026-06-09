"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Line = { account_code: string; account_name: string; debit: number; credit: number };
type Entry = {
  id: number;
  number: string;
  entry_date: string | null;
  description: string;
  total_debit: number;
  total_credit: number;
  lines?: Line[];
};

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Entry | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ data: Entry[] }>("/journal-entries?per_page=100");
        setEntries(res.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openEntry(id: number) {
    const res = await api<{ data: Entry }>(`/journal-entries/${id}`);
    setOpen(res.data);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">القيود المحاسبية</h1>
        <Link href="/dashboard/journal/new" className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">
          + قيد يدوي
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الرقم</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">البيان</th>
              <th className="px-4 py-3 font-medium">مدين</th>
              <th className="px-4 py-3 font-medium">دائن</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد قيود</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="cursor-pointer border-t hover:bg-slate-50" onClick={() => openEntry(e.id)}>
                  <td className="px-4 py-3 font-medium text-[#10B981]">{e.number}</td>
                  <td className="px-4 py-3 text-slate-600">{e.entry_date}</td>
                  <td className="px-4 py-3 text-slate-700">{e.description}</td>
                  <td className="px-4 py-3 text-slate-800">{e.total_debit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-800">{e.total_credit.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">قيد {open.number}</h2>
              <span className="text-sm text-slate-500">{open.entry_date}</span>
            </div>
            <p className="mb-3 text-sm text-slate-600">{open.description}</p>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">الحساب</th>
                  <th className="px-3 py-2 font-medium">مدين</th>
                  <th className="px-3 py-2 font-medium">دائن</th>
                </tr>
              </thead>
              <tbody>
                {open.lines?.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 text-slate-700">
                      <span className="font-mono text-slate-400">{l.account_code}</span> {l.account_name}
                    </td>
                    <td className="px-3 py-2">{l.debit ? l.debit.toFixed(2) : "-"}</td>
                    <td className="px-3 py-2">{l.credit ? l.credit.toFixed(2) : "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="px-3 py-2">الإجمالي</td>
                  <td className="px-3 py-2">{open.total_debit.toFixed(2)}</td>
                  <td className="px-3 py-2">{open.total_credit.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 text-left">
              <button onClick={() => setOpen(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
