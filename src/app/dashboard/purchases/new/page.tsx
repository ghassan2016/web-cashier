"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/currency";

type Option = { id: number; name: string };
type ItemOption = { id: number; name: string; cost?: number };
type Line = { item_id: string; qty: string; unit_cost: string; tax_rate: string; discount_value: string };

const emptyLine = (): Line => ({ item_id: "", qty: "1", unit_cost: "0", tax_rate: "15", discount_value: "0" });

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [isCredit, setIsCredit] = useState(false);
  const [paid, setPaid] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [s, w, it] = await Promise.all([
        api<{ data: Option[] }>("/suppliers?per_page=200").catch(() => ({ data: [] })),
        api<{ data: Option[] }>("/warehouses?per_page=200").catch(() => ({ data: [] })),
        api<{ data: ItemOption[] }>("/items?per_page=500").catch(() => ({ data: [] })),
      ]);
      setSuppliers(s.data);
      setWarehouses(w.data);
      setItems(it.data);
    })();
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const l of lines) {
      const base = (Number(l.qty) || 0) * (Number(l.unit_cost) || 0);
      const taxable = Math.max(0, base - (Number(l.discount_value) || 0));
      subtotal += taxable;
      tax += (taxable * (Number(l.tax_rate) || 0)) / 100;
    }
    return { subtotal, tax, grand: subtotal + tax };
  }, [lines]);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function onPickItem(i: number, itemId: string) {
    const item = items.find((x) => String(x.id) === itemId);
    setLine(i, { item_id: itemId, unit_cost: item?.cost ? String(item.cost) : lines[i].unit_cost });
  }

  async function submit() {
    setError(null);
    const validLines = lines.filter((l) => l.item_id && Number(l.qty) > 0);
    if (!supplierId) return setError("اختر المورد");
    if (validLines.length === 0) return setError("أضف صنفًا واحدًا على الأقل");

    setSaving(true);
    try {
      await api("/purchases", {
        method: "POST",
        body: {
          supplier_id: Number(supplierId),
          warehouse_id: warehouseId ? Number(warehouseId) : null,
          supplier_invoice_no: supplierInvoiceNo || null,
          invoice_date: invoiceDate,
          is_credit: isCredit,
          paid_total: paid === "" ? null : Number(paid),
          lines: validLines.map((l) => ({
            item_id: Number(l.item_id),
            qty: Number(l.qty),
            unit_cost: Number(l.unit_cost),
            tax_rate: Number(l.tax_rate) || 0,
            discount_value: Number(l.discount_value) || 0,
          })),
        },
      });
      router.push("/dashboard/purchases");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">فاتورة مشتريات جديدة</h1>
        <Link href="/dashboard/purchases" className="text-sm text-slate-500 hover:underline">← رجوع</Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="mb-4 grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-3">
        <Field label="المورد">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">—</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="المخزن (اختياري)">
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">الافتراضي</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="رقم فاتورة المورد">
          <input value={supplierInvoiceNo} onChange={(e) => setSupplierInvoiceNo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </Field>
        <Field label="التاريخ">
          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </Field>
        <Field label="المدفوع">
          <input type="number" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={totals.grand.toFixed(2)} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />
          فاتورة آجلة
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">الصنف</th>
              <th className="px-3 py-2 font-medium">الكمية</th>
              <th className="px-3 py-2 font-medium">التكلفة</th>
              <th className="px-3 py-2 font-medium">خصم</th>
              <th className="px-3 py-2 font-medium">ضريبة %</th>
              <th className="px-3 py-2 font-medium">الإجمالي</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const base = (Number(l.qty) || 0) * (Number(l.unit_cost) || 0);
              const taxable = Math.max(0, base - (Number(l.discount_value) || 0));
              const lineTotal = taxable * (1 + (Number(l.tax_rate) || 0) / 100);
              return (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    <select value={l.item_id} onChange={(e) => onPickItem(i, e.target.value)} className="w-full rounded border px-2 py-1">
                      <option value="">—</option>
                      {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><input type="number" step="0.01" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} className="w-20 rounded border px-2 py-1" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" value={l.unit_cost} onChange={(e) => setLine(i, { unit_cost: e.target.value })} className="w-24 rounded border px-2 py-1" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" value={l.discount_value} onChange={(e) => setLine(i, { discount_value: e.target.value })} className="w-20 rounded border px-2 py-1" /></td>
                  <td className="px-3 py-2"><input type="number" step="0.01" value={l.tax_rate} onChange={(e) => setLine(i, { tax_rate: e.target.value })} className="w-16 rounded border px-2 py-1" /></td>
                  <td className="px-3 py-2 text-slate-700">{lineTotal.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="text-red-600 hover:underline" disabled={lines.length === 1}>حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t p-3">
          <button onClick={() => setLines((ls) => [...ls, emptyLine()])} className="text-sm text-[#10B981] hover:underline">+ إضافة سطر</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border bg-white p-4">
        <div className="space-y-1 text-sm text-slate-600">
          <div>الإجمالي الفرعي: {money(totals.subtotal)}</div>
          <div>الضريبة: {money(totals.tax)}</div>
          <div className="text-base font-bold text-slate-800">الإجمالي: {money(totals.grand)}</div>
        </div>
        <button onClick={submit} disabled={saving} className="rounded-lg bg-[#0E7C66] px-6 py-3 text-white hover:bg-[#0A5C4C] disabled:opacity-60">
          {saving ? "جارٍ الحفظ…" : "حفظ الفاتورة"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-600">{label}</label>
      {children}
    </div>
  );
}
