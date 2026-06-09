"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function CategoriesPage() {
  return (
    <ResourceManager
      title="التصنيفات"
      endpoint="/categories"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "type", label: "النوع" },
        { key: "printer_name", label: "طابعة القسم" },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "name_en", label: "الاسم (إنجليزي)" },
        {
          name: "type",
          label: "النوع",
          type: "select",
          defaultValue: "section",
          options: [
            { value: "section", label: "قسم" },
            { value: "hyperstation", label: "هايبر" },
            { value: "device", label: "جهاز" },
            { value: "rep", label: "مندوب" },
          ],
        },
        { name: "printer_name", label: "طابعة المطبخ للقسم" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
