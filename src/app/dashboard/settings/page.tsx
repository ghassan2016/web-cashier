"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { setCurrency } from "@/lib/currency";
import { setCompanyName } from "@/lib/company";

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "company_name", label: "اسم المنشأة" },
  { key: "vat_number", label: "الرقم الضريبي" },
  { key: "cr_number", label: "السجل التجاري" },
  { key: "phone", label: "الهاتف" },
  { key: "address", label: "العنوان" },
  { key: "currency", label: "العملة (مثال: ر.س)" },
  { key: "vat_rate", label: "نسبة الضريبة %", type: "number" },
  { key: "tobacco_fee", label: "رسم التبغ الافتراضي (لكل وحدة)", type: "number" },
  { key: "receipt_footer", label: "تذييل الإيصال" },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: Record<string, string> }>("/settings")
      .then((r) => { setValues(r.data ?? {}); setCurrency(r.data?.currency); setCompanyName(r.data?.company_name); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setMsg(null); setError(null);
    try {
      const res = await api<{ data: Record<string, string> }>("/settings", {
        method: "PUT",
        body: { settings: values },
      });
      const saved = res.data ?? values;
      setValues(saved);
      setCurrency(saved.currency);
      setCompanyName(saved.company_name);
      setMsg("تم حفظ الإعدادات");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-400">جارٍ التحميل…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">إعدادات المنشأة</h1>

      {msg && <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm text-slate-600">
            {f.label}
            <input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        ))}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60"
        >
          {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
