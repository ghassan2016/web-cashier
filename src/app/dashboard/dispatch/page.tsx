"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribe } from "@/lib/echo";
import { money } from "@/lib/currency";

type Driver = {
  id: number;
  name: string;
  phone: string | null;
  is_available: boolean;
  active_orders: number;
  balance: number;
};
type Order = {
  id: number;
  status: string;
  invoice_number: string | null;
  grand_total: number | null;
  delivery_fee: number;
  distance_km: number | null;
  driver_id: number | null;
  driver: { name: string } | null;
  customer: { name: string; phone: string | null } | null;
  address: { address_line: string | null } | null;
  payment_method: string | null;
  collected_amount: number;
  proof_photo: string | null;
  payment_proof: string | null;
};

const METHOD: Record<string, string> = { cash: "نقدي", card: "شبكة", bank: "تحويل بنكي" };

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "bg-slate-100 text-slate-600" },
  assigned: { label: "مُسند", cls: "bg-amber-100 text-amber-700" },
  on_way: { label: "في الطريق", cls: "bg-emerald-100 text-emerald-700" },
};

export default function DispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, d] = await Promise.all([
        api<{ data: Order[] }>("/dispatch/orders"),
        api<{ data: Driver[] }>("/dispatch/drivers"),
      ]);
      setOrders(o.data ?? []);
      setDrivers(d.data ?? []);
    } catch {
      /* ignore transient poll errors */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // fallback poll
    let unsub = () => {};
    (async () => {
      try {
        const me = await api<{ data: { user: { company_id: number } } }>("/auth/me");
        unsub = subscribe(`dispatch.${me.data.user.company_id}`, "updated", load);
      } catch {
        /* polling still covers it */
      }
    })();
    return () => {
      clearInterval(t);
      unsub();
    };
  }, [load]);

  async function assign(orderId: number, driverId: number) {
    setBusy(orderId);
    try {
      await api(`/dispatch/${orderId}/assign`, { method: "POST", body: { driver_id: driverId } });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function autoAssign(orderId: number) {
    setBusy(orderId);
    try {
      await api(`/dispatch/${orderId}/auto-assign`, { method: "POST" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "تعذّر الإسناد");
    } finally {
      setBusy(null);
    }
  }

  async function payout(driver: Driver) {
    const amount = prompt(`تسوية رصيد ${driver.name} (${money(driver.balance)})`, driver.balance.toFixed(2));
    if (!amount) return;
    await api(`/dispatch/drivers/${driver.id}/payout`, { method: "POST", body: { amount: Number(amount) } });
    await load();
  }

  const available = drivers.filter((d) => d.is_available);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">إدارة التوصيل</h1>
        <span className="text-xs text-slate-400">تحديث تلقائي كل 10 ثوانٍ</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Orders */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-slate-700">الطلبات النشطة ({orders.length})</h2>
          {loaded && orders.length === 0 && (
            <p className="rounded-xl border bg-white p-6 text-center text-slate-400">لا توجد طلبات توصيل</p>
          )}
          {orders.map((o) => {
            const st = STATUS[o.status] ?? { label: o.status, cls: "bg-slate-100 text-slate-600" };
            return (
              <div key={o.id} className="rounded-xl border bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-slate-800">طلب {o.invoice_number ?? o.id}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                </div>
                <div className="text-sm text-slate-600">
                  {o.customer?.name && <div>👤 {o.customer.name} · {o.customer.phone ?? ""}</div>}
                  {o.address?.address_line && <div className="text-slate-500">📍 {o.address.address_line}</div>}
                  <div className="mt-1 font-semibold text-[#0E7C66]">
                    {money(o.grand_total ?? 0)}
                    {o.distance_km != null && <span className="text-slate-400"> · {o.distance_km} كم</span>}
                  </div>
                  {/* Delivery completion: payment method + proof images */}
                  {o.payment_method && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-0.5">💳 {METHOD[o.payment_method] ?? o.payment_method}</span>
                      {o.collected_amount > 0 && <span>محصّل: {o.collected_amount.toFixed(2)}</span>}
                      {o.proof_photo && (
                        <a href={o.proof_photo} target="_blank" rel="noreferrer" className="text-[#0E7C66] underline">صورة التسليم</a>
                      )}
                      {o.payment_proof && (
                        <a href={o.payment_proof} target="_blank" rel="noreferrer" className="text-[#0E7C66] underline">إشعار التحويل</a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  {o.driver ? (
                    <span className="text-sm text-slate-700">المندوب: <b>{o.driver.name}</b></span>
                  ) : (
                    <span className="text-sm text-slate-400">غير مُسند</span>
                  )}
                  <div className="flex-1" />
                  <button
                    disabled={busy === o.id || available.length === 0}
                    onClick={() => autoAssign(o.id)}
                    className="rounded-lg bg-[#0E7C66] px-3 py-1.5 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-50"
                  >
                    ⚡ أقرب مندوب
                  </button>
                  <select
                    disabled={busy === o.id || available.length === 0}
                    defaultValue=""
                    onChange={(e) => e.target.value && assign(o.id, Number(e.target.value))}
                    className="rounded-lg border px-2 py-1.5 text-sm"
                  >
                    <option value="">إسناد يدوي…</option>
                    {available.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.active_orders})</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drivers */}
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700">المندوبون ({drivers.length})</h2>
          {drivers.map((d) => (
            <div key={d.id} className="rounded-xl border bg-white p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${d.is_available ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="font-semibold text-slate-800">{d.name}</span>
                <div className="flex-1" />
                <span className="text-xs text-slate-500">{d.active_orders} نشط</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">الرصيد: <b>{money(d.balance)}</b></span>
                {d.balance > 0 && (
                  <button onClick={() => payout(d)} className="text-xs text-[#0E7C66] hover:underline">تسوية</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
