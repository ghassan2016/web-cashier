"use client";

import { ResourceManager } from "@/components/ResourceManager";

const STATUS: Record<string, string> = { free: "متاحة", occupied: "مشغولة", reserved: "محجوزة" };

// Table QR payload the customer app scans → opens dine-in for this table.
const qrUrl = (payload: string, size = 64) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;

export default function TablesPage() {
  return (
    <ResourceManager
      title="الطاولات"
      endpoint="/tables"
      searchable={false}
      columns={[
        { key: "name", label: "الطاولة" },
        { key: "zone", label: "المنطقة" },
        { key: "seats", label: "المقاعد" },
        { key: "status", label: "الحالة", render: (r) => STATUS[String(r.status)] ?? String(r.status ?? "—") },
        {
          key: "qr",
          label: "رمز الطاولة",
          render: (r) => {
            const payload = `cahier:${r.branch_id ?? ""}:${r.id}`;
            return (
              <a href={qrUrl(payload, 300)} target="_blank" rel="noopener noreferrer" title="فتح للطباعة">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl(payload, 64)} alt="QR" width={40} height={40} />
              </a>
            );
          },
        },
      ]}
      fields={[
        { name: "name", label: "اسم/رقم الطاولة", required: true },
        { name: "zone", label: "المنطقة (صالة/تراس…)" },
        { name: "seats", label: "عدد المقاعد", type: "number", defaultValue: 4 },
        { name: "branch_id", label: "الفرع", type: "select", optionsEndpoint: "/branches" },
        { name: "is_active", label: "مفعّلة", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
