"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function MenusPage() {
  return (
    <ResourceManager
      title="قوائم المنيو"
      endpoint="/menus"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "name_en", label: "الاسم (إنجليزي)" },
        { key: "sort_order", label: "الترتيب" },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "name_en", label: "الاسم (إنجليزي)" },
        { name: "sort_order", label: "الترتيب", type: "number", defaultValue: 0 },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
