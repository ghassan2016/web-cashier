"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function CitiesPage() {
  return (
    <ResourceManager
      title="المدن"
      endpoint="/cities"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "name_en", label: "الاسم (إنجليزي)" },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "name_en", label: "الاسم (إنجليزي)" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
