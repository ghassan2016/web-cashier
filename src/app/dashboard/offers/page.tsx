"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

// ---- types ----
type ItemRef = { id: number; name: string; sale_price?: number };
type OfferItem = { id?: number; item_id: number; name?: string; sale_price?: number; qty: number; is_free: boolean };
type Offer = {
  id: number;
  name: string;
  price_type: "fixed" | "percent";
  price: number;
  freeze_qty: boolean;
  freeze_price: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  items: OfferItem[];
};

const BTN = "rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60";
const INPUT = "w-full rounded-lg border px-3 py-2 text-sm";

const emptyOffer = (): Offer => ({
  id: 0,
  name: "",
  price_type: "fixed",
  price: 0,
  freeze_qty: false,
  freeze_price: false,
  starts_at: null,
  ends_at: null,
  is_active: true,
  items: [],
});

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [items, setItems] = useState<ItemRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Offer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, i] = await Promise.all([
        api<{ data: Offer[] }>("/offers?per_page=200"),
        api<{ data: ItemRef[] }>("/items?per_page=300"),
      ]);
      setOffers(o.data ?? []);
      setItems(i.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(o: Offer) {
    if (!confirm(`حذف عرض «${o.name}»؟`)) return;
    await api(`/offers/${o.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">العروض</h1>
        <button onClick={() => setEditing(emptyOffer())} className={BTN}>+ إضافة عرض</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">القيمة</th>
              <th className="px-4 py-3 font-medium">الأصناف</th>
              <th className="px-4 py-3 font-medium">مفعّل</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد عروض</td></tr>
            ) : offers.map((o) => (
              <tr key={o.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{o.name}</td>
                <td className="px-4 py-3 text-slate-600">{o.price_type === "percent" ? "نسبة %" : "سعر ثابت"}</td>
                <td className="px-4 py-3 text-slate-600">{o.price_type === "percent" ? `${Number(o.price).toFixed(0)}%` : Number(o.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-600">{(o.items ?? []).map((it) => `${it.name}${it.is_free ? " (مجاني)" : ""}`).join("، ") || "—"}</td>
                <td className="px-4 py-3">{o.is_active ? "نعم" : "لا"}</td>
                <td className="px-4 py-3 text-left whitespace-nowrap">
                  <button onClick={() => setEditing({ ...o, items: (o.items ?? []).map((x) => ({ ...x })) })} className="text-[#10B981] hover:underline">تعديل</button>
                  <button onClick={() => remove(o)} className="mr-3 text-red-600 hover:underline">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <OfferModal
          offer={editing}
          items={items}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}
    </div>
  );
}

function OfferModal({ offer, items, onClose, onSaved }: {
  offer: Offer; items: ItemRef[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Offer>({ ...offer, items: offer.items.map((x) => ({ ...x })) });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function setItem(i: number, patch: Partial<OfferItem>) {
    setForm((f) => ({ ...f, items: f.items.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  }
  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { item_id: items[0]?.id ?? 0, qty: 1, is_free: false }] }));
  }
  function removeItem(i: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  }

  // Live preview of the savings vs. the offer price.
  const regular = form.items
    .filter((it) => !it.is_free)
    .reduce((s, it) => {
      const price = items.find((x) => x.id === Number(it.item_id))?.sale_price ?? 0;
      return s + Number(price) * (Number(it.qty) || 0);
    }, 0);
  const savings = form.price_type === "fixed" && regular > Number(form.price) ? regular - Number(form.price) : 0;

  async function save() {
    setSaving(true); setErrors({});
    const payload = {
      name: form.name,
      price_type: form.price_type,
      price: Number(form.price) || 0,
      freeze_qty: form.freeze_qty,
      freeze_price: form.freeze_price,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      is_active: form.is_active,
      items: form.items.map((it) => ({
        item_id: Number(it.item_id),
        qty: Number(it.qty) || 1,
        is_free: it.is_free,
      })),
    };
    try {
      if (offer.id) await api(`/offers/${offer.id}`, { method: "PUT", body: payload });
      else await api("/offers", { method: "POST", body: payload });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.errors) setErrors(e.errors);
      else if (e instanceof ApiError) setErrors({ _: [e.message] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-slate-800">{offer.id ? "تعديل" : "إضافة"} عرض</h2>
        {errors._ && <p className="mb-3 text-sm text-red-600">{errors._[0]}</p>}
        <div className="space-y-3">
          <label className="block text-sm text-slate-600">اسم العرض
            <input className={INPUT + " mt-1"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name[0]}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-600">نوع السعر
              <select className={INPUT + " mt-1"} value={form.price_type}
                onChange={(e) => setForm({ ...form, price_type: e.target.value as "fixed" | "percent" })}>
                <option value="fixed">سعر ثابت للحزمة</option>
                <option value="percent">نسبة خصم %</option>
              </select>
            </label>
            <label className="block text-sm text-slate-600">{form.price_type === "percent" ? "نسبة الخصم %" : "سعر الحزمة"}
              <input type="number" step="0.01" className={INPUT + " mt-1"} value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-600">يبدأ
              <input type="date" className={INPUT + " mt-1"} value={form.starts_at ?? ""}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value || null })} />
            </label>
            <label className="block text-sm text-slate-600">ينتهي
              <input type="date" className={INPUT + " mt-1"} value={form.ends_at ?? ""}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value || null })} />
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              مفعّل
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.freeze_qty} onChange={(e) => setForm({ ...form, freeze_qty: e.target.checked })} />
              تجميد الكمية
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.freeze_price} onChange={(e) => setForm({ ...form, freeze_price: e.target.checked })} />
              تجميد السعر
            </label>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">أصناف العرض</span>
              <button onClick={addItem} className="text-sm text-[#0E7C66] hover:underline">+ صنف</button>
            </div>
            {form.items.length === 0 && <p className="text-xs text-slate-400">أضف صنفًا واحدًا على الأقل.</p>}
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className="flex-1 rounded-lg border px-2 py-2 text-sm" value={it.item_id}
                    onChange={(e) => setItem(i, { item_id: Number(e.target.value) })}>
                    {items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input type="number" min="0" step="1" className="w-20 rounded-lg border px-2 py-2 text-sm" title="الكمية"
                    value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input type="checkbox" checked={it.is_free} onChange={(e) => setItem(i, { is_free: e.target.checked })} />
                    مجاني
                  </label>
                  <button onClick={() => removeItem(i)} className="text-red-600">✕</button>
                </div>
              ))}
            </div>
            {errors.items && <p className="mt-2 text-xs text-red-600">{errors.items[0]}</p>}
            {form.price_type === "fixed" && regular > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                إجمالي الأسعار الأصلية: {regular.toFixed(2)}
                {savings > 0 && <span className="text-emerald-700"> · توفير {savings.toFixed(2)}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
          <button onClick={save} disabled={saving} className={BTN}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button>
        </div>
      </div>
    </div>
  );
}
