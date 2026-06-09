"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Module = { id: number; key: string; name: string; monthly_price: number; is_core: boolean; enabled: boolean };

export default function ModulesPage() {
  const [list, setList] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList((await api<{ data: Module[] }>("/modules")).data ?? []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(m: Module) {
    if (m.is_core) return;
    setError(null);
    try {
      await api(`/modules/${m.id}`, { method: "PUT", body: { is_enabled: !m.enabled } });
      await load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "تعذّر التحديث"); }
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-bold text-slate-800">الوحدات والاشتراكات</h1>
      <p className="mb-4 text-sm text-slate-500">فعّل أو عطّل وحدات النظام لمنشأتك.</p>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-400">جارٍ التحميل…</p>
        ) : list.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <div className="font-semibold text-slate-800">{m.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {m.is_core ? "وحدة أساسية" : (m.monthly_price > 0 ? `${m.monthly_price.toFixed(2)} ر.س / شهر` : "مجانية")}
              </div>
            </div>
            <button
              onClick={() => toggle(m)}
              disabled={m.is_core}
              className={`relative h-6 w-11 rounded-full transition ${m.enabled ? "bg-[#0E7C66]" : "bg-slate-300"} ${m.is_core ? "opacity-50" : ""}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${m.enabled ? "right-0.5" : "right-5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
