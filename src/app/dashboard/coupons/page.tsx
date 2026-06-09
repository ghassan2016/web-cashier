"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function CouponsPage() {
  return (
    <ResourceManager
      title="الكوبونات"
      endpoint="/coupons"
      columns={[
        { key: "code", label: "الرمز" },
        { key: "discount_type", label: "النوع", render: (r) => (r.discount_type === "percent" ? "نسبة %" : "مبلغ ثابت") },
        { key: "value", label: "القيمة", render: (r) => Number(r.value ?? 0).toFixed(2) },
        { key: "min_invoice", label: "أدنى فاتورة", render: (r) => Number(r.min_invoice ?? 0).toFixed(2) },
        { key: "used_count", label: "مرات الاستخدام" },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "code", label: "الرمز", required: true },
        { name: "discount_type", label: "نوع الخصم", type: "select", defaultValue: "percent", options: [{ value: "percent", label: "نسبة %" }, { value: "fixed", label: "مبلغ ثابت" }] },
        { name: "value", label: "القيمة", type: "number", step: "0.01", defaultValue: 0 },
        { name: "min_invoice", label: "أدنى قيمة فاتورة", type: "number", step: "0.01", defaultValue: 0 },
        { name: "usage_limit", label: "حد الاستخدام (فارغ = بلا حد)", type: "number" },
        { name: "starts_at", label: "يبدأ (YYYY-MM-DD)" },
        { name: "ends_at", label: "ينتهي (YYYY-MM-DD)" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
