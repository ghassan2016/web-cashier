"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function SuppliersPage() {
  return (
    <ResourceManager
      title="الموردون"
      endpoint="/suppliers"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "phone", label: "الجوال" },
        { key: "tax_number", label: "الرقم الضريبي" },
        { key: "balance", label: "الرصيد", render: (r) => `${Number(r.balance ?? 0).toFixed(2)} ر.س` },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "code", label: "الكود" },
        { name: "phone", label: "الجوال" },
        { name: "email", label: "البريد", type: "email" },
        { name: "tax_number", label: "الرقم الضريبي" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
