"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Integration = { id: number; provider: string; type: string | null; is_enabled: boolean; has_credentials: boolean; settings: Record<string, unknown> | null };

const KNOWN = [
  { provider: "zatca", type: "einvoice", label: "هيئة الزكاة (ZATCA)" },
  { provider: "moyasar", type: "payment", label: "ميسر (Moyasar)" },
  { provider: "tap", type: "payment", label: "Tap" },
  { provider: "foodics", type: "import", label: "Foodics" },
  { provider: "qoyod", type: "import", label: "Qoyod" },
];

export default function IntegrationsPage() {
  const [list, setList] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ provider: string; type: string; is_enabled: boolean; credentials: string; settings: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList((await api<{ data: Integration[] }>("/integrations")).data ?? []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function edit(provider: string, type: string) {
    const ex = list.find((i) => i.provider === provider);
    setForm({
      provider, type: ex?.type ?? type, is_enabled: ex?.is_enabled ?? false,
      credentials: "", settings: ex?.settings ? JSON.stringify(ex.settings, null, 2) : "",
    });
    setError(null);
  }

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      const body: Record<string, unknown> = { type: form.type, is_enabled: form.is_enabled };
      if (form.credentials.trim()) body.credentials = JSON.parse(form.credentials);
      if (form.settings.trim()) body.settings = JSON.parse(form.settings);
      await api(`/integrations/${form.provider}`, { method: "PUT", body });
      setForm(null); await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "صيغة JSON غير صحيحة");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-bold text-slate-800">التكاملات</h1>
      <p className="mb-4 text-sm text-slate-500">المفاتيح تُخزَّن مشفّرة ولا تُعرَض بعد الحفظ.</p>

      <div className="grid gap-3 md:grid-cols-2">
        {KNOWN.map((k) => {
          const ex = list.find((i) => i.provider === k.provider);
          return (
            <div key={k.provider} className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <div className="font-semibold text-slate-800">{k.label}</div>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${ex?.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {ex?.is_enabled ? "مفعّل" : "معطّل"}
                  </span>
                  {ex?.has_credentials && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">مفاتيح محفوظة 🔒</span>}
                </div>
              </div>
              <button onClick={() => edit(k.provider, k.type)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm text-[#0E7C66] hover:bg-emerald-50">إعداد</button>
            </div>
          );
        })}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">إعداد {form.provider}</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} /> مُفعّل
            </label>
            <label className="block text-sm text-slate-600">المفاتيح (JSON — اتركها فارغة للإبقاء)
              <textarea dir="ltr" rows={3} value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} placeholder='{"secret_key":"sk_..."}' className="mt-1 w-full rounded-lg border p-2 font-mono text-xs" />
            </label>
            <label className="mt-3 block text-sm text-slate-600">الإعدادات (JSON)
              <textarea dir="ltr" rows={3} value={form.settings} onChange={(e) => setForm({ ...form, settings: e.target.value })} placeholder='{"currency":"SAR"}' className="mt-1 w-full rounded-lg border p-2 font-mono text-xs" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button onClick={save} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">{busy ? "جارٍ…" : "حفظ"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
