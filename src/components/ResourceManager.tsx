"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "checkbox" | "select";
  required?: boolean;
  step?: string;
  options?: { value: string | number; label: string }[];
  optionsEndpoint?: string; // expects { data: [{id, name}] }
  defaultValue?: unknown;
};

export type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type Row = Record<string, unknown>;

export function ResourceManager({
  title,
  endpoint,
  columns,
  fields,
  searchable = true,
  canDelete = true,
  listParams = "",
}: {
  title: string;
  endpoint: string;
  columns: Column[];
  fields: Field[];
  searchable?: boolean;
  canDelete?: boolean;
  listParams?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [optionsMap, setOptionsMap] = useState<Record<string, { value: string | number; label: string }[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchable && search ? `&search=${encodeURIComponent(search)}` : "";
      const extra = listParams ? `&${listParams}` : "";
      const res = await api<{ data: Row[] }>(`${endpoint}?per_page=100${q}${extra}`);
      setRows(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [endpoint, search, searchable, listParams]);

  useEffect(() => {
    load();
  }, [load]);

  // Lock background (page + sidebar) scroll while the modal is open so the
  // body doesn't scroll behind the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    fields.forEach(async (f) => {
      if (!f.optionsEndpoint) return;
      try {
        const res = await api<{ data: { id: number; name: string }[] }>(`${f.optionsEndpoint}?per_page=200`);
        setOptionsMap((m) => ({
          ...m,
          [f.name]: res.data.map((o) => ({ value: o.id, label: o.name })),
        }));
      } catch {
        /* ignore */
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    const init: Record<string, unknown> = {};
    fields.forEach((f) => (init[f.name] = f.defaultValue ?? (f.type === "checkbox" ? true : "")));
    setForm(init);
    setEditing(null);
    setErrors({});
    setOpen(true);
  }

  function openEdit(row: Row) {
    const init: Record<string, unknown> = {};
    fields.forEach((f) => (init[f.name] = row[f.name] ?? (f.type === "checkbox" ? false : "")));
    setForm(init);
    setEditing(row);
    setErrors({});
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setErrors({});
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      let v = form[f.name];
      if (f.type === "number") v = v === "" || v === null ? null : Number(v);
      if (f.type === "select" && v === "") v = null;
      payload[f.name] = v;
    });
    try {
      if (editing) await api(`${endpoint}/${editing.id}`, { method: "PUT", body: payload });
      else await api(endpoint, { method: "POST", body: payload });
      setOpen(false);
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.errors) setErrors(e.errors);
      else if (e instanceof ApiError) setErrors({ _: [e.message] });
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm(`حذف «${row.name ?? row.id}»؟`)) return;
    await api(`${endpoint}/${row.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]"
        >
          + إضافة
        </button>
      </div>

      {searchable && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث…"
          className="mb-4 w-full max-w-xs rounded-lg border px-3 py-2 text-sm"
        />
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)} className="border-t hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-slate-700">
                      {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-left whitespace-nowrap">
                    <button onClick={() => openEdit(row)} className="text-[#10B981] hover:underline">تعديل</button>
                    {canDelete && (
                      <button onClick={() => remove(row)} className="mr-3 text-red-600 hover:underline">حذف</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <h2 className="border-b px-6 py-4 text-base font-bold text-slate-800">
              {editing ? "تعديل" : "إضافة"} — {title}
            </h2>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {errors._ && <p className="mb-3 text-sm text-red-600">{errors._[0]}</p>}
            <div className="space-y-3">
              {fields.map((f) => {
                const opts = f.options ?? optionsMap[f.name] ?? [];
                return (
                  <div key={f.name}>
                    {f.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(form[f.name])}
                          onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                        />
                        {f.label}
                      </label>
                    ) : (
                      <>
                        <label className="mb-1 block text-sm text-slate-600">{f.label}</label>
                        {f.type === "select" ? (
                          <select
                            value={String(form[f.name] ?? "")}
                            onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                          >
                            <option value="">—</option>
                            {opts.map((o) => (
                              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                            step={f.step}
                            value={String(form[f.name] ?? "")}
                            onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                          />
                        )}
                      </>
                    )}
                    {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name][0]}</p>}
                  </div>
                );
              })}
            </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">إلغاء</button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60"
              >
                {saving ? "جارٍ الحفظ…" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
