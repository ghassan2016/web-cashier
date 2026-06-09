"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function EmployeesPage() {
  return (
    <ResourceManager
      title="الموظفون"
      endpoint="/employees"
      columns={[
        { key: "code", label: "الرقم" },
        { key: "name", label: "الاسم" },
        { key: "job_title", label: "الوظيفة" },
        { key: "phone", label: "الجوال" },
        { key: "basic_salary", label: "الراتب الأساسي", render: (r) => Number(r.basic_salary ?? 0).toFixed(2) },
        { key: "is_driver", label: "سائق", render: (r) => (r.is_driver ? "نعم" : "لا") },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "code", label: "الرقم الوظيفي" },
        { name: "job_title", label: "المسمى الوظيفي" },
        { name: "national_id", label: "الهوية / الإقامة" },
        { name: "phone", label: "الجوال" },
        { name: "email", label: "البريد", type: "email" },
        { name: "hire_date", label: "تاريخ التعيين (YYYY-MM-DD)" },
        { name: "basic_salary", label: "الراتب الأساسي", type: "number", step: "0.01", defaultValue: 0 },
        { name: "personal_discount_percent", label: "خصم شخصي %", type: "number", step: "0.01", defaultValue: 0 },
        { name: "is_driver", label: "مندوب توصيل", type: "checkbox", defaultValue: false },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
