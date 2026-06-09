"use client";

import { ResourceManager } from "@/components/ResourceManager";

const TYPES = [
  { value: "cash", label: "نقدي" },
  { value: "card", label: "بطاقة" },
  { value: "wallet", label: "محفظة" },
  { value: "online", label: "أونلاين" },
  { value: "credit", label: "آجل" },
  { value: "transfer", label: "تحويل" },
];

export default function PaymentMethodsPage() {
  return (
    <ResourceManager
      title="طرق الدفع"
      endpoint="/payment-methods"
      listParams="include_inactive=1"
      searchable={false}
      columns={[
        { key: "name", label: "الاسم" },
        { key: "type", label: "النوع", render: (r) => TYPES.find((t) => t.value === r.type)?.label ?? String(r.type) },
        { key: "opens_drawer", label: "يفتح الدرج", render: (r) => (r.opens_drawer ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "type", label: "النوع", type: "select", defaultValue: "cash", options: TYPES },
        { name: "opens_drawer", label: "يفتح درج النقد", type: "checkbox", defaultValue: false },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
