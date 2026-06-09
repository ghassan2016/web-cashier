"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function WarehousesPage() {
  return (
    <ResourceManager
      title="المخازن"
      endpoint="/warehouses"
      searchable={false}
      columns={[
        { key: "name", label: "الاسم" },
        { key: "is_default", label: "افتراضي", render: (r) => (r.is_default ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "branch_id", label: "الفرع", type: "select", optionsEndpoint: "/branches" },
        { name: "is_default", label: "افتراضي", type: "checkbox", defaultValue: false },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
