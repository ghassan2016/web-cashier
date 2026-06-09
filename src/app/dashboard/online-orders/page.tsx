"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribe } from "@/lib/echo";

type Order = {
  id: number;
  number: string;
  channel: string;
  order_type: string;
  status: string;
  kitchen_status: string;
  delivery_fee: number;
  grand_total: number;
  invoiced_at: string | null;
};

// Kitchen stages the back-office can advance (pending waits for the cashier).
const ADVANCEABLE = new Set(["new", "preparing", "ready"]);

const KITCHEN: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار القبول", cls: "bg-orange-100 text-orange-700" },
  new: { label: "جديد", cls: "bg-slate-100 text-slate-600" },
  preparing: { label: "قيد التحضير", cls: "bg-amber-100 text-amber-700" },
  ready: { label: "جاهز", cls: "bg-blue-100 text-blue-700" },
  served: { label: "مُسلّم", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
};
const money = (n: number) => Number(n).toFixed(2);

export default function OnlineOrdersPage() {
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: Order[] }>("/sales?channel=online,app&per_page=50");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    let unsub = () => {};
    (async () => {
      try {
        const me = await api<{ data: { user: { company_id: number } } }>("/auth/me");
        unsub = subscribe(`kitchen.${me.data.user.company_id}`, "updated", load);
      } catch { /* polling covers it */ }
    })();
    return () => { clearInterval(t); unsub(); };
  }, [load]);

  async function advance(id: number) {
    await api(`/kitchen/orders/${id}/advance`, { method: "POST" });
    await load();
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">الطلبات أونلاين</h1>
        <span className="text-xs text-slate-400">تحديث تلقائي لحظي</span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الطلب</th>
              <th className="px-4 py-3 font-medium">القناة</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">رسوم التوصيل</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">حالة المطبخ</th>
              <th className="px-4 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">لا توجد طلبات أونلاين</td></tr>
            ) : (
              list.map((o) => {
                const k = KITCHEN[o.kitchen_status] ?? { label: o.kitchen_status, cls: "bg-slate-100" };
                return (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-[#0E7C66]">{o.number}</td>
                    <td className="px-4 py-3 text-slate-600">{o.channel === "app" ? "تطبيق" : "أونلاين"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.order_type}</td>
                    <td className="px-4 py-3 text-slate-600">{o.invoiced_at?.replace("T", " ").slice(0, 16) ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.delivery_fee > 0 ? money(o.delivery_fee) : "—"}</td>
                    <td className="px-4 py-3">{money(o.grand_total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-0.5 text-xs ${k.cls}`}>{k.label}</span></td>
                    <td className="px-4 py-3">
                      {ADVANCEABLE.has(o.kitchen_status) && o.status === "completed" ? (
                        <button onClick={() => advance(o.id)} className="text-xs text-[#0E7C66] hover:underline">
                          {o.kitchen_status === "ready" ? "تسليم ✓" : "التالي →"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
