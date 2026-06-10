"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { RowActionsMenu, PencilIcon, TrashIcon } from "@/components/RowActionsMenu";

type User = {
  id: number;
  name: string;
  email: string | null;
  username: string | null;
  is_active: boolean;
  default_branch_id: number | null;
  roles: string[];
};
type Role = { id: number; name: string };
type Branch = { id: number; name: string };

const ROLE_LABEL: Record<string, string> = {
  "super-admin": "مدير عام",
  "company-admin": "مدير المنشأة",
  "branch-manager": "مدير فرع",
  cashier: "كاشير",
  accountant: "محاسب",
  storekeeper: "أمين مخزن",
  driver: "سائق",
};

type Form = {
  id?: number;
  name: string;
  email: string;
  username: string;
  password: string;
  default_branch_id: string;
  is_active: boolean;
  roles: string[];
};
const empty: Form = { name: "", email: "", username: "", password: "", default_branch_id: "", is_active: true, roles: [] };

export default function UsersPage() {
  const [list, setList] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: User[] }>("/users?per_page=100");
      setList(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api<{ data: Role[] }>("/roles").then((r) => setRoles(r.data ?? [])).catch(() => {});
    api<{ data: Branch[] }>("/branches").then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, [load]);

  function openCreate() { setForm({ ...empty }); setError(null); }
  function openEdit(u: User) {
    setForm({ id: u.id, name: u.name, email: u.email ?? "", username: u.username ?? "", password: "", default_branch_id: String(u.default_branch_id ?? ""), is_active: u.is_active, roles: u.roles });
    setError(null);
  }

  async function save() {
    if (!form) return;
    setBusy(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name, email: form.email || null, username: form.username || null,
        default_branch_id: form.default_branch_id ? Number(form.default_branch_id) : null,
        is_active: form.is_active, roles: form.roles,
      };
      if (form.password) body.password = form.password;
      if (form.id) await api(`/users/${form.id}`, { method: "PUT", body });
      else await api("/users", { method: "POST", body });
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally { setBusy(false); }
  }

  async function remove(u: User) {
    if (!confirm(`حذف المستخدم «${u.name}»؟`)) return;
    try { await api(`/users/${u.id}`, { method: "DELETE" }); await load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "تعذّر الحذف"); }
  }

  function toggleRole(name: string) {
    if (!form) return;
    setForm({ ...form, roles: form.roles.includes(name) ? form.roles.filter((r) => r !== name) : [...form.roles, name] });
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">المستخدمون</h1>
        <button onClick={openCreate} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">+ مستخدم</button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">البريد</th>
              <th className="px-4 py-3 font-medium">الأدوار</th>
              <th className="px-4 py-3 font-medium">مفعّل</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا يوجد مستخدمون</td></tr>
            ) : (
              list.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{ROLE_LABEL[r] ?? r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.is_active ? "نعم" : "لا"}</td>
                  <td className="px-4 py-3 text-left whitespace-nowrap">
                    <RowActionsMenu
                      actions={[
                        { label: "تعديل", icon: <PencilIcon />, onClick: () => openEdit(u) },
                        { label: "حذف", icon: <TrashIcon />, danger: true, onClick: () => remove(u) },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-bold text-slate-800">{form.id ? "تعديل مستخدم" : "مستخدم جديد"}</h2>
            {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <input placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="اسم المستخدم (اختياري)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input type="password" placeholder={form.id ? "كلمة مرور جديدة (اتركها فارغة لإبقائها)" : "كلمة المرور"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <select value={form.default_branch_id} onChange={(e) => setForm({ ...form, default_branch_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">الفرع الافتراضي (اختياري)</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div>
                <p className="mb-1 text-sm text-slate-600">الأدوار</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button key={r.id} type="button" onClick={() => toggleRole(r.name)}
                      className={`rounded-full px-3 py-1 text-xs ${form.roles.includes(r.name) ? "bg-[#0E7C66] text-white" : "bg-slate-100 text-slate-600"}`}>
                      {ROLE_LABEL[r.name] ?? r.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                مفعّل
              </label>
            </div>
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
