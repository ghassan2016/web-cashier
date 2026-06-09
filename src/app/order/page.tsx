"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { subscribe } from "@/lib/echo";

type MenuItem = { id: number; name: string; sale_price: number };
type MenuGroup = { category: string; items: MenuItem[] };
type CartLine = { item: MenuItem; qty: number };

const BRANCH_ID = 1; // single-branch storefront (extend via ?branch= later)

export default function OrderPage() {
  const [menu, setMenu] = useState<MenuGroup[]>([]);
  const [storeName, setStoreName] = useState("كاهييه");
  const [currency, setCurrency] = useState("ر.س");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ number: string; uuid: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ data: { company?: { name?: string; currency?: string }; categories?: MenuGroup[] } }>(`/online/menu/${BRANCH_ID}`);
        setMenu(res.data?.categories ?? []);
        if (res.data?.company?.name) setStoreName(res.data.company.name);
        if (res.data?.company?.currency) setCurrency(res.data.company.currency);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.item.sale_price * l.qty, 0),
    [cart]
  );

  function add(item: MenuItem) {
    setCart((c) => {
      const ex = c.find((l) => l.item.id === item.id);
      if (ex) return c.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { item, qty: 1 }];
    });
  }
  function changeQty(id: number, d: number) {
    setCart((c) =>
      c.map((l) => (l.item.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0)
    );
  }

  async function place() {
    setError(null);
    if (cart.length === 0) return setError("السلة فارغة");
    if (!name || !phone) return setError("الاسم والجوال مطلوبان");
    if (orderType === "delivery" && !address) return setError("العنوان مطلوب للتوصيل");
    setPlacing(true);
    try {
      const res = await api<{ data: { order_number: string; tracking_uuid: string } }>("/online/orders", {
        method: "POST",
        body: {
          branch_id: BRANCH_ID,
          name,
          phone,
          order_type: orderType,
          address_line: orderType === "delivery" ? address : null,
          lines: cart.map((l) => ({ item_id: l.item.id, qty: l.qty })),
        },
      });
      setDone({ number: res.data.order_number, uuid: res.data.tracking_uuid });
      setCart([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إرسال الطلب");
    } finally {
      setPlacing(false);
    }
  }

  if (done) {
    return <Confirmation done={done} onNew={() => setDone(null)} />;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 pb-40">
      <header className="bg-[#0E7C66] p-5 text-white">
        <h1 className="text-xl font-bold">{storeName} — اطلب أونلاين</h1>
        <p className="text-sm text-white/80">اختر أصنافك وأكمل الطلب</p>
      </header>

      <div className="mx-auto max-w-2xl p-4">
        {loading ? (
          <p className="text-center text-slate-400">جارٍ تحميل المنيو…</p>
        ) : (
          menu.map((g) => (
            <section key={g.category} className="mb-6">
              <h2 className="mb-2 font-bold text-slate-700">{g.category}</h2>
              <div className="space-y-2">
                {g.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                    <div>
                      <div className="font-semibold text-slate-800">{it.name}</div>
                      <div className="text-sm text-[#0E7C66]">{it.sale_price.toFixed(2)} {currency}</div>
                    </div>
                    <button onClick={() => add(it)} className="rounded-lg bg-[#0E7C66] px-4 py-1.5 text-sm text-white hover:bg-[#0A5C4C]">إضافة +</button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {cart.length > 0 && (
          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-2 font-bold text-slate-700">سلتك</h2>
            {cart.map((l) => (
              <div key={l.item.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-slate-700">{l.item.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(l.item.id, -1)} className="h-7 w-7 rounded bg-slate-100">−</button>
                  <span className="w-6 text-center">{l.qty}</span>
                  <button onClick={() => changeQty(l.item.id, 1)} className="h-7 w-7 rounded bg-slate-100">+</button>
                </div>
              </div>
            ))}

            <div className="mt-4 grid gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="rounded-lg border px-3 py-2" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال" className="rounded-lg border px-3 py-2" />
              <div className="flex gap-2">
                {(["delivery", "pickup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm ${orderType === t ? "border-[#0E7C66] bg-[#E6F7F1] text-[#0E7C66]" : "text-slate-600"}`}
                  >
                    {t === "delivery" ? "توصيل" : "استلام"}
                  </button>
                ))}
              </div>
              {orderType === "delivery" && (
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" className="rounded-lg border px-3 py-2" />
              )}
            </div>
          </section>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </div>

      {cart.length > 0 && (
        <div dir="rtl" className="fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t bg-white p-4 shadow-lg">
          <button
            onClick={place}
            disabled={placing}
            className="flex w-full items-center justify-center rounded-xl bg-[#0E7C66] py-3 text-white hover:bg-[#0A5C4C] disabled:opacity-60"
          >
            {placing ? "جارٍ الإرسال…" : `إتمام الطلب · ${total.toFixed(2)} ${currency}`}
          </button>
        </div>
      )}
    </main>
  );
}

/** Order confirmation with live tracking + optional online payment. */
function Confirmation({ done, onNew }: { done: { number: string; uuid: string }; onNew: () => void }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  async function payOnline() {
    setPaying(true);
    try {
      await api(`/online/orders/${done.uuid}/pay`, { method: "POST" });
      setPaid(true);
    } catch {
      /* keep COD */
    } finally {
      setPaying(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-xl font-bold text-slate-800">تم استلام طلبك!</h1>
        <p className="mt-1 text-slate-600">رقم الطلب: <b className="text-[#0E7C66]">{done.number}</b></p>
        <TrackTimeline uuid={done.uuid} />
        {paid ? (
          <p className="mt-5 rounded-lg bg-emerald-50 py-2 text-emerald-700">💳 تم الدفع أونلاين ✓</p>
        ) : (
          <button onClick={payOnline} disabled={paying} className="mt-5 w-full rounded-lg border border-[#0E7C66] py-2 text-[#0E7C66] hover:bg-[#E6F7F1] disabled:opacity-60">
            {paying ? "جارٍ الدفع…" : "💳 ادفع أونلاين"}
          </button>
        )}
        <button onClick={onNew} className="mt-3 w-full rounded-lg bg-[#0E7C66] py-2 text-white">طلب جديد</button>
      </div>
    </main>
  );
}

type Track = {
  order_type: string;
  kitchen_status: string;
  delivery: { status: string } | null;
};

/** Live order-status timeline (polls the public tracking endpoint). */
function TrackTimeline({ uuid }: { uuid: string }) {
  const [t, setT] = useState<Track | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api<{ data: Track }>(`/online/track/${uuid}`);
        if (active) setT(res.data);
      } catch {
        /* ignore */
      }
    };
    load();
    const unsub = subscribe(`order.${uuid}`, "status", load); // live push
    const id = setInterval(load, 15000); // fallback poll
    return () => {
      active = false;
      unsub();
      clearInterval(id);
    };
  }, [uuid]);

  if (!t) return null;

  // Build an ordered set of stages with the current one highlighted.
  const kitchen = t.kitchen_status;
  const deliv = t.delivery?.status;
  const stages: { key: string; label: string; done: boolean; active: boolean }[] = [];
  const kOrder = ["new", "preparing", "ready"];
  const kIdx = kOrder.indexOf(kitchen);
  stages.push({ key: "received", label: "تم الاستلام", done: true, active: false });
  stages.push({ key: "preparing", label: "قيد التحضير", done: kIdx >= 1, active: kitchen === "preparing" });
  stages.push({ key: "ready", label: "جاهز", done: kIdx >= 2, active: kitchen === "ready" && !deliv });
  if (t.order_type === "delivery") {
    stages.push({ key: "on_way", label: "في الطريق", done: deliv === "delivered", active: deliv === "on_way" });
    stages.push({ key: "delivered", label: "تم التسليم", done: deliv === "delivered", active: deliv === "delivered" });
  }

  return (
    <div className="mt-5 space-y-2 text-right">
      {stages.map((s) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              s.done ? "bg-[#0E7C66] text-white" : s.active ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-400"
            }`}
          >
            {s.done ? "✓" : s.active ? "•" : ""}
          </span>
          <span className={s.done || s.active ? "text-slate-800" : "text-slate-400"}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
