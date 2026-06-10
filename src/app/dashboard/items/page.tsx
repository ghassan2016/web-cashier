"use client";

import { ResourceManager } from "@/components/ResourceManager";
import { money } from "@/lib/currency";

export default function ItemsPage() {
  return (
    <ResourceManager
      title="الأصناف"
      endpoint="/items"
      columns={[
        { key: "code", label: "الكود" },
        { key: "name", label: "الصنف" },
        { key: "category", label: "القسم", render: (r) => (r.category as { name?: string } | null)?.name ?? "-" },
        { key: "type", label: "النوع" },
        { key: "sale_price", label: "السعر", render: (r) => money(Number(r.sale_price ?? 0)) },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "name_en", label: "الاسم (إنجليزي)" },
        { name: "code", label: "الكود" },
        {
          name: "type",
          label: "النوع",
          type: "select",
          defaultValue: "finished",
          options: [
            { value: "finished", label: "جاهز" },
            { value: "semi", label: "نصف مصنّع" },
            { value: "raw", label: "خام" },
          ],
        },
        { name: "category_id", label: "القسم", type: "select", optionsEndpoint: "/categories" },
        { name: "image_path", label: "صورة الصنف", type: "image" },
        { name: "sale_price", label: "سعر البيع", type: "number", step: "0.01", defaultValue: 0 },
        { name: "cost", label: "التكلفة", type: "number", step: "0.01", defaultValue: 0 },
        { name: "is_taxable", label: "خاضع للضريبة", type: "checkbox", defaultValue: true },
        { name: "allow_sale", label: "متاح للبيع", type: "checkbox", defaultValue: true },
        { name: "track_stock", label: "يتتبّع المخزون", type: "checkbox", defaultValue: false },
      ]}
    />
  );
}
