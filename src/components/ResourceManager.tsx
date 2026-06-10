"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, uploadFile } from "@/lib/api";
import { RowActionsMenu, PencilIcon, TrashIcon } from "./RowActionsMenu";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "checkbox" | "select" | "image";
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
  const [uploading, setUploading] = useState<string | null>(null);

  async function handleUpload(field: string, file: File | undefined) {
    if (!file) return;
    setUploading(field);
    setErrors((e) => ({ ...e, [field]: [] }));
    try {
      const { url } = await uploadFile(file);
      setForm((s) => ({ ...s, [field]: url }));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "تعذّر رفع الصورة";
      setErrors((e) => ({ ...e, [field]: [msg] }));
    } finally {
      setUploading(null);
    }
  }

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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[var(--primary-light)] to-[var(--primary)] text-white shadow-md shadow-emerald-600/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-400">
              {loading ? "جارٍ التحميل…" : `${rows.length} عنصر`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث…"
                className="input w-56"
                style={{ paddingInlineEnd: "2.25rem" }}
              />
            </div>
          )}
          <button onClick={openCreate} className="btn btn-primary shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            إضافة
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50 text-slate-600">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
              ))}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-14 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-14 text-center text-slate-400">
                <div className="mb-1 text-2xl">🗂️</div>
                لا توجد بيانات
              </td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={String(row.id)}
                  className="border-b border-border/70 transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]"
                >
                  {columns.map((c, ci) => (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 ${ci === 0 ? "font-semibold text-slate-800" : "text-slate-600"}`}
                    >
                      {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-left whitespace-nowrap">
                    <RowActionsMenu
                      actions={[
                        { label: "تعديل", icon: <PencilIcon />, onClick: () => openEdit(row) },
                        ...(canDelete
                          ? [{ label: "حذف", icon: <TrashIcon />, danger: true, onClick: () => remove(row) }]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="flex items-center gap-2 border-b border-border px-6 py-4 text-base font-bold text-slate-800">
              <span className="h-5 w-1 rounded-full bg-[var(--primary)]" />
              {editing ? "تعديل" : "إضافة"} — {title}
            </h2>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {errors._ && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">{errors._[0]}</p>}
            <div className="space-y-4">
              {fields.map((f) => {
                const opts = f.options ?? optionsMap[f.name] ?? [];
                return (
                  <div key={f.name}>
                    {f.type === "checkbox" ? (
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--primary)]"
                          checked={Boolean(form[f.name])}
                          onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                        />
                        {f.label}
                      </label>
                    ) : (
                      <>
                        <label className="mb-1.5 block text-sm font-medium text-slate-600">{f.label}</label>
                        {f.type === "image" ? (
                          <div className="flex items-center gap-3">
                            {form[f.name] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={String(form[f.name])}
                                alt=""
                                className="h-16 w-16 rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-xs text-slate-400">
                                لا صورة
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploading === f.name}
                                onChange={(e) => handleUpload(f.name, e.target.files?.[0])}
                                className="text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-[#0E7C66] file:px-3 file:py-1.5 file:text-white"
                              />
                              {uploading === f.name && <span className="text-xs text-slate-400">جارٍ الرفع…</span>}
                              {form[f.name] ? (
                                <button
                                  type="button"
                                  onClick={() => setForm((s) => ({ ...s, [f.name]: "" }))}
                                  className="self-start text-xs text-red-600 hover:underline"
                                >
                                  إزالة الصورة
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : f.type === "select" ? (
                          <select
                            value={String(form[f.name] ?? "")}
                            onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                            className="input"
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
                            className="input"
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
            <div className="flex justify-end gap-2 border-t border-border bg-slate-50/50 px-6 py-4">
              <button onClick={() => setOpen(false)} className="btn btn-ghost">إلغاء</button>
              <button onClick={save} disabled={saving} className="btn btn-primary">
                {saving ? "جارٍ الحفظ…" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
