"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Account = {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  type: string;
  is_group: boolean;
  balance: number;
};

const TYPE_LABELS: Record<string, string> = {
  asset: "أصول",
  liability: "خصوم",
  equity: "حقوق ملكية",
  revenue: "إيرادات",
  expense: "مصروفات",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ data: Account[] }>("/accounts");
        setAccounts(res.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build tree (children grouped by parent_id), render depth-first.
  const childrenOf = (pid: number | null) =>
    accounts.filter((a) => a.parent_id === pid).sort((a, b) => a.code.localeCompare(b.code));

  const renderRows = (pid: number | null, depth: number): React.ReactNode[] =>
    childrenOf(pid).flatMap((a) => [
      <tr key={a.id} className="border-t hover:bg-slate-50">
        <td className="px-4 py-2 font-mono text-slate-500">{a.code}</td>
        <td className="px-4 py-2" style={{ paddingInlineStart: 16 + depth * 20 }}>
          <span className={a.is_group ? "font-bold text-slate-800" : "text-slate-700"}>{a.name}</span>
        </td>
        <td className="px-4 py-2 text-slate-500">{TYPE_LABELS[a.type] ?? a.type}</td>
        <td className="px-4 py-2 text-left text-slate-800">{Number(a.balance).toFixed(2)}</td>
      </tr>,
      ...renderRows(a.id, depth + 1),
    ]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">شجرة الحسابات</h1>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الكود</th>
              <th className="px-4 py-3 font-medium">الحساب</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد حسابات</td></tr>
            ) : (
              renderRows(null, 0)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
