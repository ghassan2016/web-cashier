"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function CashDrawersPage() {
  return (
    <ResourceManager
      title="أدراج النقد"
      endpoint="/cash-drawers"
      listParams="manage=1"
      searchable={false}
      columns={[
        { key: "name", label: "الاسم" },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "branch_id", label: "الفرع", type: "select", optionsEndpoint: "/branches" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
