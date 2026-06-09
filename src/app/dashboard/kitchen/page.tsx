"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribe } from "@/lib/echo";

type Line = { item_name: string; qty: number; notes: string | null; section_name: string | null };
type Order = {
  id: number;
  number: string;
  order_type: string;
  kitchen_status: string;
  invoiced_at: string | null;
  lines: Line[];
};
type Station = { id: number; name: string; printer_name: string | null; has_printer: boolean };

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "new", label: "جديد", color: "border-t-slate-400" },
  { key: "preparing", label: "قيد التحضير", color: "border-t-amber-500" },
  { key: "ready", label: "جاهز", color: "border-t-green-600" },
];

const TYPE_LABELS: Record<string, string> = { dine_in: "محلي", takeaway: "سفري", delivery: "توصيل" };

// Kitchen lifecycle: anything past "ready" leaves the board (served).
const NEXT_STATUS: Record<string, string> = { new: "preparing", preparing: "ready", ready: "served" };
const ON_BOARD = ["new", "preparing", "ready"];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [station, setStation] = useState<number | null>(null);
  const [busy, setBusy] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const q = station ? `?section=${station}` : "";
      const res = await api<{ data: Order[] }>(`/kitchen/orders${q}`);
      setOrders(res.data ?? []);
    } catch {
      /* ignore transient errors while polling */
    } finally {
      setLoaded(true);
    }
  }, [station]);

  useEffect(() => {
    api<{ data: Station[] }>("/kitchen/stations")
      .then((res) => setStations(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // fallback poll
    let unsub = () => {};
    (async () => {
      try {
        const me = await api<{ data: { user: { company_id: number } } }>("/auth/me");
        unsub = subscribe(`kitchen.${me.data.user.company_id}`, "updated", load);
      } catch {
        /* polling still covers it */
      }
    })();
    return () => {
      clearInterval(t);
      unsub();
    };
  }, [load]);

  async function advance(id: number, current: string) {
    if (busy.has(id)) return;
    const next = NEXT_STATUS[current] ?? "served";

    setBusy((b) => new Set(b).add(id));
    // Optimistic: move (or drop, if served) the card immediately so the line
    // cook sees instant feedback — the server + realtime reconcile right after.
    setOrders((prev) =>
      ON_BOARD.includes(next)
        ? prev.map((o) => (o.id === id ? { ...o, kitchen_status: next } : o))
        : prev.filter((o) => o.id !== id),
    );

    try {
      await api(`/kitchen/orders/${id}/advance`, { method: "POST" });
    } catch {
      await load(); // revert to server truth on failure
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(id);
        return n;
      });
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">شاشة المطبخ</h1>
        <span className="text-xs text-slate-400">تحديث تلقائي لحظي</span>
      </div>

      {stations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStation(null)}
            className={`rounded-full px-3 py-1 text-sm ${station === null ? "bg-[#0E7C66] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            كل الأقسام
          </button>
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setStation(s.id)}
              className={`rounded-full px-3 py-1 text-sm ${station === s.id ? "bg-[#0E7C66] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {s.name}
              {s.has_printer && <span className="mr-1 opacity-70">🖨️</span>}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.kitchen_status === col.key);
          return (
            <div key={col.key} className="rounded-xl bg-slate-100 p-3">
              <h2 className="mb-3 flex items-center justify-between font-bold text-slate-700">
                <span>{col.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs">{items.length}</span>
              </h2>
              <div className="space-y-3">
                {loaded && items.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">—</p>
                )}
                {items.map((o) => (
                  <div key={o.id} className={`rounded-lg border border-t-4 ${col.color} bg-white p-3 shadow-sm transition-opacity ${busy.has(o.id) ? "opacity-50" : ""}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{o.number}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {TYPE_LABELS[o.order_type] ?? o.order_type}
                      </span>
                    </div>
                    <ul className="mb-3 space-y-1 text-sm">
                      {o.lines.map((l, i) => (
                        <li key={i} className="text-slate-700">
                          <b>{l.qty}×</b> {l.item_name}
                          {station === null && l.section_name && (
                            <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{l.section_name}</span>
                          )}
                          {l.notes && <span className="block text-xs text-amber-700">• {l.notes}</span>}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => advance(o.id, o.kitchen_status)}
                      disabled={busy.has(o.id)}
                      className="w-full rounded-lg bg-[#0E7C66] py-1.5 text-sm text-white transition-colors hover:bg-[#0A5C4C] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busy.has(o.id) ? "جارٍ…" : col.key === "ready" ? "تسليم ✓" : "التالي →"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
