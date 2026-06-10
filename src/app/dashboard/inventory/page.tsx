"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/currency";

type Stock = {
  item_id: number;
  item_name: string;
  warehouse_name: string;
  qty: number;
  avg_cost: number;
  value: number;
};

export default function InventoryPage() {
  const [rows, setRows] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api<{ data: Stock[] }>(`/inventory/stock${q}`);
      setRows(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalValue = rows.reduce((s, r) => s + (r.value || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">المخزون</h1>
        <div className="rounded-xl border bg-white px-4 py-2 text-sm">
          إجمالي قيمة المخزون: <b className="text-[#0E7C66]">{money(totalValue)}</b>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث عن صنف…"
        className="mb-4 w-full max-w-xs rounded-lg border px-3 py-2 text-sm"
      />

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الصنف</th>
              <th className="px-4 py-3 font-medium">المخزن</th>
              <th className="px-4 py-3 font-medium">الكمية</th>
              <th className="px-4 py-3 font-medium">متوسط التكلفة</th>
              <th className="px-4 py-3 font-medium">القيمة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا يوجد مخزون</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.item_id}-${i}`} className="border-t">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.item_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.warehouse_name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.qty}</td>
                  <td className="px-4 py-3 text-slate-600">{r.avg_cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-800">{money(r.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
