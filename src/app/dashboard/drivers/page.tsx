"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function DriversPage() {
  return (
    <ResourceManager
      title="السائقون"
      endpoint="/drivers"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "phone", label: "الجوال" },
        { key: "vehicle", label: "المركبة" },
        { key: "balance", label: "الرصيد (محفظة)", render: (r) => Number(r.balance ?? 0).toFixed(2) },
        { key: "is_available", label: "متاح", render: (r) => (r.is_available ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "phone", label: "الجوال" },
        { name: "vehicle", label: "المركبة" },
        { name: "branch_id", label: "الفرع", type: "select", optionsEndpoint: "/branches" },
        { name: "employee_id", label: "الموظف المرتبط", type: "select", optionsEndpoint: "/employees" },
        { name: "is_available", label: "متاح للتوصيل", type: "checkbox", defaultValue: true },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
