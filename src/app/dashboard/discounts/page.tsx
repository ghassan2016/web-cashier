"use client";

import { ResourceManager } from "@/components/ResourceManager";

const SCOPES = [
  { value: "invoice", label: "الفاتورة" },
  { value: "item", label: "صنف" },
  { value: "category", label: "تصنيف" },
  { value: "menu", label: "منيو" },
  { value: "branch", label: "فرع" },
];

export default function DiscountsPage() {
  return (
    <ResourceManager
      title="الخصومات"
      endpoint="/discounts"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "scope", label: "النطاق", render: (r) => SCOPES.find((s) => s.value === r.scope)?.label ?? String(r.scope) },
        { key: "discount_type", label: "النوع", render: (r) => (r.discount_type === "percent" ? "نسبة %" : "مبلغ ثابت") },
        { key: "value", label: "القيمة", render: (r) => Number(r.value ?? 0).toFixed(2) },
        { key: "is_active", label: "مفعّل", render: (r) => (r.is_active ? "نعم" : "لا") },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "scope", label: "النطاق", type: "select", defaultValue: "invoice", options: SCOPES },
        { name: "discount_type", label: "نوع الخصم", type: "select", defaultValue: "percent", options: [{ value: "percent", label: "نسبة %" }, { value: "fixed", label: "مبلغ ثابت" }] },
        { name: "value", label: "القيمة", type: "number", step: "0.01", defaultValue: 0 },
        { name: "category_id", label: "التصنيف (لنطاق تصنيف)", type: "select", optionsEndpoint: "/categories" },
        { name: "menu_id", label: "المنيو (لنطاق منيو)", type: "select", optionsEndpoint: "/menus" },
        { name: "starts_at", label: "يبدأ (YYYY-MM-DD)" },
        { name: "ends_at", label: "ينتهي (YYYY-MM-DD)" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
