"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function TaxesPage() {
  return (
    <ResourceManager
      title="الضرائب"
      endpoint="/taxes"
      searchable={false}
      columns={[
        { key: "name", label: "الاسم" },
        { key: "rate", label: "النسبة %", render: (r) => Number(r.rate ?? 0).toFixed(2) },
        { key: "is_inclusive", label: "شامل", render: (r) => (r.is_inclusive ? "نعم" : "لا") },
        { key: "is_default", label: "افتراضي", render: (r) => (r.is_default ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "rate", label: "النسبة %", type: "number", step: "0.001", defaultValue: 15 },
        { name: "is_inclusive", label: "شامل للضريبة", type: "checkbox", defaultValue: false },
        { name: "is_default", label: "افتراضي", type: "checkbox", defaultValue: false },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
