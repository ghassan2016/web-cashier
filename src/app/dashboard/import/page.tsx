"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";

type Mode = "foodics" | "qoyod";

const SAMPLE: Record<Mode, string> = {
  foodics: "name,sku,price,cost,category,is_taxable\nشاورما,SHW-1,35,12,شاورما,1\nبطاطس,FRY-1,12,3,مقبلات,1",
  qoyod: "code,name,type,parent_code,is_group\n6000,مصاريف تشغيلية,expense,,1\n6001,صيانة,expense,6000,0",
};

const ENDPOINT: Record<Mode, string> = {
  foodics: "/import/foodics/products",
  qoyod: "/import/qoyod/accounts",
};

/** Parse pasted text as a JSON array, or as CSV (first row = headers). */
function parseRows(text: string): Record<string, unknown>[] {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith("[")) return JSON.parse(t);

  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      let v: unknown = (cells[i] ?? "").trim();
      if (h === "is_taxable" || h === "is_group") v = v === "1" || v === "true";
      if (h === "price" || h === "cost") v = Number(v) || 0;
      row[h] = v;
    });
    return row;
  });
}

export default function ImportPage() {
  const [mode, setMode] = useState<Mode>("foodics");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true); setError(null); setResult(null);
    try {
      const rows = parseRows(text);
      if (rows.length === 0) { setError("لا توجد بيانات للاستيراد"); return; }
      const res = await api<{ data: Record<string, number> }>(ENDPOINT[mode], { method: "POST", body: { rows } });
      setResult(res.data);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("صيغة غير صحيحة — تأكّد من CSV أو JSON");
    } finally { setBusy(false); }
  }

  const LABELS: Record<string, string> = {
    categories_created: "تصنيفات أُنشئت",
    items_created: "أصناف أُنشئت",
    items_updated: "أصناف حُدّثت",
    created: "حسابات أُنشئت",
    updated: "حسابات حُدّثت",
    skipped: "صفوف متخطّاة",
  };

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-bold text-slate-800">استيراد البيانات</h1>
      <p className="mb-4 text-sm text-slate-500">الصق بيانات بصيغة CSV (صف العناوين أولًا) أو مصفوفة JSON.</p>

      <div className="mb-4 flex gap-2">
        {([["foodics", "منتجات Foodics"], ["qoyod", "حسابات Qoyod"]] as [Mode, string][]).map(([m, l]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(null); }}
            className={`rounded-lg px-4 py-2 text-sm ${mode === m ? "bg-[#0E7C66] text-white" : "border bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={SAMPLE[mode]}
        rows={10}
        className="w-full rounded-xl border bg-white p-3 font-mono text-sm"
        dir="ltr"
      />

      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-lg bg-[#0E7C66] px-5 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60">
          {busy ? "جارٍ الاستيراد…" : "استيراد"}
        </button>
        <button onClick={() => setText(SAMPLE[mode])} className="text-sm text-slate-500 hover:underline">إدراج مثال</button>
      </div>

      {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(result).map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-white p-4">
              <div className="text-sm text-slate-500">{LABELS[k] ?? k}</div>
              <div className="mt-1 text-2xl font-bold text-[#0E7C66]">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
