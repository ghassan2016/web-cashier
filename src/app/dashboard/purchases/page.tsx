"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Purchase = {
  id: number;
  number: string;
  invoice_date: string | null;
  grand_total: number;
  paid_total: number;
  is_credit: boolean;
  status: string;
  supplier?: { name: string };
};

export default function PurchasesPage() {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ data: Purchase[] }>("/purchases?per_page=100");
        setRows(res.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">المشتريات</h1>
        <Link href="/dashboard/purchases/new" className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">
          + فاتورة جديدة
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الرقم</th>
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">المدفوع</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد فواتير مشتريات</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.number}</td>
                  <td className="px-4 py-3 text-slate-600">{p.supplier?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.invoice_date ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-800">{p.grand_total.toFixed(2)} ر.س</td>
                  <td className="px-4 py-3 text-slate-600">{p.paid_total.toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_credit ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {p.is_credit ? "آجل" : "مدفوعة"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
