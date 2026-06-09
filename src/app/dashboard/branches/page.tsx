"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function BranchesPage() {
  return (
    <ResourceManager
      title="الفروع"
      endpoint="/branches"
      listParams="all=1"
      searchable={false}
      columns={[
        { key: "name", label: "الاسم" },
        { key: "code", label: "الرمز" },
        { key: "phone", label: "الهاتف" },
        { key: "is_main", label: "رئيسي", render: (r) => (r.is_main ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "name_en", label: "الاسم (إنجليزي)" },
        { name: "code", label: "الرمز" },
        { name: "city_id", label: "المدينة", type: "select", optionsEndpoint: "/cities" },
        { name: "phone", label: "الهاتف" },
        { name: "address", label: "العنوان" },
        { name: "tax_number", label: "الرقم الضريبي" },
        { name: "is_main", label: "فرع رئيسي", type: "checkbox", defaultValue: false },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
