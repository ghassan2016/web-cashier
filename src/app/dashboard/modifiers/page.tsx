"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { RowActionsMenu, PencilIcon, TrashIcon } from "@/components/RowActionsMenu";

// ---- types ----
type Option = {
  id?: number;
  name: string;
  price: number;
  is_default: boolean;
  linked_item_id?: number | null;
  consume_qty?: number;
};
type Group = {
  id: number;
  name: string;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  is_required: boolean;
  modifiers: Option[];
};
type ItemRef = { id: number; name: string; is_combo?: boolean };
type ComboOption = { id?: number; item_id: number; name?: string; extra_price: number; is_default: boolean };
type ComboGroup = { id?: number; name: string; min_select: number; max_select: number; options: ComboOption[] };

const BTN = "rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C] disabled:opacity-60";
const INPUT = "w-full rounded-lg border px-3 py-2 text-sm";

export default function ModifiersPage() {
  const [tab, setTab] = useState<"groups" | "combos">("groups");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">المُعدِّلات والوجبات</h1>
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("groups")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "groups" ? "bg-[#0E7C66] text-white" : "bg-white text-slate-600 border"}`}
        >مجموعات الخيارات</button>
        <button
          onClick={() => setTab("combos")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "combos" ? "bg-[#0E7C66] text-white" : "bg-white text-slate-600 border"}`}
        >الوجبات (كومبو)</button>
      </div>
      {tab === "groups" ? <GroupsTab /> : <CombosTab />}
    </div>
  );
}

// ============================ Modifier groups ============================
function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<ItemRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Group | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, i] = await Promise.all([
        api<{ data: Group[] }>("/modifier-groups?per_page=200"),
        api<{ data: ItemRef[] }>("/items?per_page=300"),
      ]);
      setGroups(g.data ?? []);
      setItems(i.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing({ id: 0, name: "", selection_type: "single", min_select: 0, max_select: 1, is_required: false, modifiers: [] });
    setOpen(true);
  }

  async function remove(g: Group) {
    if (!confirm(`حذف مجموعة «${g.name}»؟`)) return;
    await api(`/modifier-groups/${g.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={openCreate} className={BTN}>+ مجموعة خيارات</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">الخيارات</th>
              <th className="px-4 py-3 font-medium">إلزامي</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">جارٍ التحميل…</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">لا توجد مجموعات</td></tr>
            ) : groups.map((g) => (
              <tr key={g.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{g.name}</td>
                <td className="px-4 py-3 text-slate-600">{g.selection_type === "single" ? "مفرد" : "متعدد"}</td>
                <td className="px-4 py-3 text-slate-600">{g.modifiers.map((m) => m.name).join("، ")}</td>
                <td className="px-4 py-3">{g.is_required ? "نعم" : "لا"}</td>
                <td className="px-4 py-3 text-left whitespace-nowrap">
                  <RowActionsMenu
                    actions={[
                      { label: "تعديل", icon: <PencilIcon />, onClick: () => { setEditing(g); setOpen(true); } },
                      { label: "حذف", icon: <TrashIcon />, danger: true, onClick: () => remove(g) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AttachToItem groups={groups} items={items} onDone={load} />

      {open && editing && (
        <GroupModal
          group={editing}
          items={items}
          onClose={() => setOpen(false)}
          onSaved={async () => { setOpen(false); await load(); }}
        />
      )}
    </div>
  );
}

function GroupModal({ group, items, onClose, onSaved }: {
  group: Group; items: ItemRef[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Group>({ ...group, modifiers: group.modifiers.map((m) => ({ ...m })) });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function setOpt(i: number, patch: Partial<Option>) {
    setForm((f) => ({ ...f, modifiers: f.modifiers.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  }
  function addOpt() {
    setForm((f) => ({ ...f, modifiers: [...f.modifiers, { name: "", price: 0, is_default: false }] }));
  }
  function removeOpt(i: number) {
    setForm((f) => ({ ...f, modifiers: f.modifiers.filter((_, j) => j !== i) }));
  }

  async function save() {
    setSaving(true); setErrors({});
    const payload = {
      name: form.name,
      selection_type: form.selection_type,
      min_select: Number(form.min_select) || 0,
      max_select: Number(form.max_select) || 0,
      is_required: form.is_required,
      modifiers: form.modifiers.map((m) => ({
        id: m.id, name: m.name, price: Number(m.price) || 0,
        is_default: m.is_default, linked_item_id: m.linked_item_id || null,
        consume_qty: Number(m.consume_qty) || 0,
      })),
    };
    try {
      if (group.id) await api(`/modifier-groups/${group.id}`, { method: "PUT", body: payload });
      else await api("/modifier-groups", { method: "POST", body: payload });
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
        <h2 className="mb-4 text-base font-bold text-slate-800">{group.id ? "تعديل" : "إضافة"} مجموعة خيارات</h2>
        {errors._ && <p className="mb-3 text-sm text-red-600">{errors._[0]}</p>}
        <div className="space-y-3">
          <label className="block text-sm text-slate-600">الاسم
            <input className={INPUT + " mt-1"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-600">نوع الاختيار
              <select className={INPUT + " mt-1"} value={form.selection_type}
                onChange={(e) => setForm({ ...form, selection_type: e.target.value as "single" | "multiple" })}>
                <option value="single">مفرد</option>
                <option value="multiple">متعدّد</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} />
              إلزامي
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-600">حد أدنى
              <input type="number" className={INPUT + " mt-1"} value={form.min_select}
                onChange={(e) => setForm({ ...form, min_select: Number(e.target.value) })} />
            </label>
            <label className="block text-sm text-slate-600">حد أقصى (0=بلا حد)
              <input type="number" className={INPUT + " mt-1"} value={form.max_select}
                onChange={(e) => setForm({ ...form, max_select: Number(e.target.value) })} />
            </label>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">الخيارات</span>
              <button onClick={addOpt} className="text-sm text-[#0E7C66] hover:underline">+ خيار</button>
            </div>
            {form.modifiers.length === 0 && <p className="text-xs text-slate-400">أضف خيارًا واحدًا على الأقل.</p>}
            <div className="space-y-2">
              {form.modifiers.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={INPUT} placeholder="الاسم" value={m.name} onChange={(e) => setOpt(i, { name: e.target.value })} />
                  <input type="number" className="w-24 rounded-lg border px-2 py-2 text-sm" placeholder="السعر" value={m.price}
                    onChange={(e) => setOpt(i, { price: Number(e.target.value) })} />
                  <select className="w-32 rounded-lg border px-1 py-2 text-xs text-slate-600" value={m.linked_item_id ?? ""}
                    onChange={(e) => setOpt(i, { linked_item_id: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">— صنف مخزون</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input type="checkbox" checked={m.is_default} onChange={(e) => setOpt(i, { is_default: e.target.checked })} />
                    افتراضي
                  </label>
                  <button onClick={() => removeOpt(i)} className="text-red-600">✕</button>
                </div>
              ))}
            </div>
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

function AttachToItem({ groups, items, onDone }: { groups: Group[]; items: ItemRef[]; onDone: () => void }) {
  const [itemId, setItemId] = useState<number | "">("");
  const [selected, setSelected] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickItem(id: number) {
    setItemId(id); setMsg(null);
    // Load the item's current groups from the catalog endpoint.
    const res = await api<{ data: { id: number; modifier_groups?: { id: number }[] } }>(`/items/${id}`);
    setSelected((res.data.modifier_groups ?? []).map((g) => g.id));
  }

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function save() {
    if (!itemId) return;
    setSaving(true); setMsg(null);
    try {
      await api(`/items/${itemId}/modifier-groups`, {
        method: "PUT",
        body: { groups: selected.map((id, i) => ({ modifier_group_id: id, sort_order: i })) },
      });
      setMsg("تم الربط بالصنف");
      onDone();
    } catch {
      setMsg("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border bg-white p-5">
      <h2 className="mb-3 text-sm font-bold text-slate-700">ربط مجموعات الخيارات بصنف</h2>
      <div className="flex flex-wrap items-center gap-3">
        <select className="rounded-lg border px-3 py-2 text-sm" value={itemId}
          onChange={(e) => e.target.value && pickItem(Number(e.target.value))}>
          <option value="">اختر صنفًا…</option>
          {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
        </select>
        {itemId !== "" && (
          <>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <label key={g.id} className={`flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1 text-sm ${selected.includes(g.id) ? "border-[#0E7C66] bg-emerald-50" : ""}`}>
                  <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
                  {g.name}
                </label>
              ))}
            </div>
            <button onClick={save} disabled={saving} className={BTN}>{saving ? "…" : "حفظ الربط"}</button>
          </>
        )}
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}

// ============================ Combos ============================
function CombosTab() {
  const [items, setItems] = useState<ItemRef[]>([]);
  const [itemId, setItemId] = useState<number | "">("");
  const [isCombo, setIsCombo] = useState(false);
  const [groups, setGroups] = useState<ComboGroup[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data: ItemRef[] }>("/items?per_page=300").then((r) => setItems(r.data ?? []));
  }, []);

  async function pickItem(id: number) {
    setItemId(id); setMsg(null);
    const res = await api<{ data: { is_combo: boolean; groups: ComboGroup[] } }>(`/items/${id}/combo`);
    setIsCombo(res.data.is_combo);
    setGroups(res.data.groups ?? []);
  }

  function addGroup() {
    setGroups((g) => [...g, { name: "", min_select: 1, max_select: 1, options: [] }]);
  }
  function setGroup(i: number, patch: Partial<ComboGroup>) {
    setGroups((g) => g.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function addOption(gi: number) {
    setGroups((g) => g.map((x, j) => (j === gi ? { ...x, options: [...x.options, { item_id: items[0]?.id ?? 0, extra_price: 0, is_default: false }] } : x)));
  }
  function setOption(gi: number, oi: number, patch: Partial<ComboOption>) {
    setGroups((g) => g.map((x, j) => (j === gi ? { ...x, options: x.options.map((o, k) => (k === oi ? { ...o, ...patch } : o)) } : x)));
  }

  async function save() {
    if (!itemId) return;
    setSaving(true); setMsg(null);
    try {
      await api(`/items/${itemId}/combo`, {
        method: "PUT",
        body: {
          is_combo: isCombo,
          groups: groups.map((g, i) => ({
            name: g.name, min_select: Number(g.min_select) || 1, max_select: Number(g.max_select) || 1, sort_order: i,
            options: g.options.map((o, k) => ({ item_id: Number(o.item_id), extra_price: Number(o.extra_price) || 0, is_default: o.is_default, sort_order: k })),
          })),
        },
      });
      setMsg("تم حفظ تكوين الوجبة");
    } catch {
      setMsg("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="rounded-lg border px-3 py-2 text-sm" value={itemId}
          onChange={(e) => e.target.value && pickItem(Number(e.target.value))}>
          <option value="">اختر صنف الوجبة…</option>
          {items.map((it) => <option key={it.id} value={it.id}>{it.name}{it.is_combo ? " (وجبة)" : ""}</option>)}
        </select>
        {itemId !== "" && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isCombo} onChange={(e) => setIsCombo(e.target.checked)} />
            هذا الصنف وجبة (كومبو)
          </label>
        )}
      </div>

      {itemId !== "" && (
        <>
          <div className="space-y-4">
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <input className="flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="اسم المجموعة (اختر برجر…)"
                    value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} />
                  <input type="number" className="w-20 rounded-lg border px-2 py-2 text-sm" title="حد أدنى"
                    value={g.min_select} onChange={(e) => setGroup(gi, { min_select: Number(e.target.value) })} />
                  <input type="number" className="w-20 rounded-lg border px-2 py-2 text-sm" title="حد أقصى"
                    value={g.max_select} onChange={(e) => setGroup(gi, { max_select: Number(e.target.value) })} />
                  <button onClick={() => setGroups((gg) => gg.filter((_, j) => j !== gi))} className="text-red-600">حذف المجموعة</button>
                </div>
                <div className="space-y-2 pr-3">
                  {g.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <select className="flex-1 rounded-lg border px-2 py-2 text-sm" value={o.item_id}
                        onChange={(e) => setOption(gi, oi, { item_id: Number(e.target.value) })}>
                        {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      <input type="number" className="w-28 rounded-lg border px-2 py-2 text-sm" placeholder="ترقية سعرية"
                        value={o.extra_price} onChange={(e) => setOption(gi, oi, { extra_price: Number(e.target.value) })} />
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        <input type="checkbox" checked={o.is_default} onChange={(e) => setOption(gi, oi, { is_default: e.target.checked })} />
                        افتراضي
                      </label>
                      <button onClick={() => setGroups((gg) => gg.map((x, j) => (j === gi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x)))} className="text-red-600">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addOption(gi)} className="text-sm text-[#0E7C66] hover:underline">+ خيار</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={addGroup} className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">+ مجموعة اختيار</button>
            <button onClick={save} disabled={saving} className={BTN}>{saving ? "جارٍ الحفظ…" : "حفظ الوجبة"}</button>
            {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
