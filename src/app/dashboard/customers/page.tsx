"use client";

import { ResourceManager } from "@/components/ResourceManager";
import { money } from "@/lib/currency";

export default function CustomersPage() {
  return (
    <ResourceManager
      title="العملاء"
      endpoint="/customers"
      columns={[
        { key: "name", label: "الاسم" },
        { key: "phone", label: "الجوال" },
        { key: "loyalty_points", label: "نقاط الولاء" },
        { key: "balance", label: "الرصيد", render: (r) => money(Number(r.balance ?? 0)) },
      ]}
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "phone", label: "الجوال" },
        { name: "email", label: "البريد", type: "email" },
        { name: "tax_number", label: "الرقم الضريبي" },
        {
          name: "type",
          label: "النوع",
          type: "select",
          options: [
            { value: "individual", label: "فرد" },
            { value: "company", label: "شركة" },
          ],
        },
        { name: "fixed_discount_percent", label: "خصم ثابت %", type: "number", step: "0.01" },
        { name: "is_active", label: "مفعّل", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
