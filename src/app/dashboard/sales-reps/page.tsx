"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function SalesRepsPage() {
  return (
    <ResourceManager
      title="مندوبو المبيعات"
      endpoint="/sales-reps"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "commission_percent", label: "العمولة %", render: (r) => Number(r.commission_percent ?? 0).toFixed(2) },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "employee_id", label: "الموظف المرتبط (اختياري)", type: "select", optionsEndpoint: "/employees" },
        { name: "commission_percent", label: "نسبة العمولة %", type: "number", step: "0.01", defaultValue: 0 },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
