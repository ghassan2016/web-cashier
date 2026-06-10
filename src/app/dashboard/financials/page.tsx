"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, getCurrency } from "@/lib/currency";

type Line = { code: string; name: string; total: number };
type Income = { revenue: Line[]; expenses: Line[]; revenue_total: number; expense_total: number; net_profit: number };
type Balance = {
  assets: Line[]; liabilities: Line[]; equity: Line[];
  assets_total: number; liabilities_total: number; equity_total: number;
  net_income: number; balanced: boolean;
};
type TB = { rows: { code: string; name: string; debit: number; credit: number }[]; total_debit: number; total_credit: number };
type Profit = { net_sales: number; cogs: number; gross_profit: number; margin_percent: number; items: { name: string; qty: number; net_sales: number; cogs: number; profit: number }[] };
type TaxR = { output_vat: number; input_vat: number; net_vat_due: number };
type Vat = {
  sales: { standard_rated: { amount: number; vat: number }; zero_rated: { amount: number; vat: number } };
  purchases: { standard_rated: { amount: number; vat: number } };
  output_vat: number; input_vat: number; net_vat_due: number; payable: boolean;
};
type Inv = { rows: { item_name: string; warehouse_name: string; qty: number; avg_cost: number; value: number }[]; total_value: number };
type ByHour = { rows: { hour: number; count: number; total: number }[] };
type ByEmp = { rows: { name: string; count: number; total: number; average_ticket: number }[] };

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

type Tab = "income" | "balance" | "trial" | "profit" | "tax" | "vat" | "inventory" | "byhour" | "byemployee";

export default function FinancialsPage() {
  const [tab, setTab] = useState<Tab>("income");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [asOf, setAsOf] = useState(today());

  const [income, setIncome] = useState<Income | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [trial, setTrial] = useState<TB | null>(null);
  const [profit, setProfit] = useState<Profit | null>(null);
  const [taxR, setTaxR] = useState<TaxR | null>(null);
  const [vat, setVat] = useState<Vat | null>(null);
  const [inv, setInv] = useState<Inv | null>(null);
  const [byHour, setByHour] = useState<ByHour | null>(null);
  const [byEmp, setByEmp] = useState<ByEmp | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "income") setIncome((await api<{ data: Income }>(`/reports/income-statement?from=${from}&to=${to}`)).data);
      if (tab === "balance") setBalance((await api<{ data: Balance }>(`/reports/balance-sheet?as_of=${asOf}`)).data);
      if (tab === "trial") setTrial((await api<{ data: TB }>(`/reports/trial-balance?from=${from}&to=${to}`)).data);
      if (tab === "profit") setProfit((await api<{ data: Profit }>(`/reports/profit?from=${from}&to=${to}`)).data);
      if (tab === "tax") setTaxR((await api<{ data: TaxR }>(`/reports/tax?from=${from}&to=${to}`)).data);
      if (tab === "vat") setVat((await api<{ data: Vat }>(`/reports/vat-return?from=${from}&to=${to}`)).data);
      if (tab === "inventory") setInv((await api<{ data: Inv }>(`/reports/inventory`)).data);
      if (tab === "byhour") setByHour((await api<{ data: ByHour }>(`/reports/sales-by-hour?from=${from}&to=${to}`)).data);
      if (tab === "byemployee") setByEmp((await api<{ data: ByEmp }>(`/reports/sales-by-employee?from=${from}&to=${to}`)).data);
    } finally {
      setLoading(false);
    }
  }, [tab, from, to, asOf]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-slate-800">القوائم المالية</h1>

      <div className="mb-4 flex gap-2">
        {([["income", "قائمة الدخل"], ["balance", "الميزانية"], ["trial", "ميزان المراجعة"], ["profit", "الأرباح"], ["tax", "الضرائب"], ["vat", "الإقرار الضريبي"], ["inventory", "تقييم المخزون"], ["byhour", "المبيعات بالساعة"], ["byemployee", "المبيعات بالموظف"]] as [Tab, string][]).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t ? "bg-[#0E7C66] text-white" : "border bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3">
        {tab === "balance" ? (
          <label className="text-sm text-slate-600">حتى تاريخ
            <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="ms-2 rounded-lg border px-2 py-1" />
          </label>
        ) : (
          <>
            <label className="text-sm text-slate-600">من
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ms-2 rounded-lg border px-2 py-1" />
            </label>
            <label className="text-sm text-slate-600">إلى
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ms-2 rounded-lg border px-2 py-1" />
            </label>
          </>
        )}
        <button onClick={load} className="rounded-lg bg-[#0E7C66] px-4 py-2 text-sm text-white hover:bg-[#0A5C4C]">عرض</button>
      </div>

      {loading ? (
        <p className="text-slate-400">جارٍ التحميل…</p>
      ) : tab === "income" && income ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="الإيرادات" lines={income.revenue} total={income.revenue_total} />
          <Section title="المصروفات" lines={income.expenses} total={income.expense_total} />
          <div className="md:col-span-2 rounded-xl border bg-white p-4 text-center">
            <span className="text-slate-600">صافي الربح: </span>
            <b className={income.net_profit >= 0 ? "text-green-600" : "text-red-600"}>{money(income.net_profit)}</b>
          </div>
        </div>
      ) : tab === "balance" && balance ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Section title="الأصول" lines={balance.assets} total={balance.assets_total} />
          <Section title="الخصوم" lines={balance.liabilities} total={balance.liabilities_total} />
          <Section title="حقوق الملكية" lines={[...balance.equity, { code: "", name: "صافي الدخل", total: balance.net_income }]} total={balance.equity_total} />
          <div className="md:col-span-3 rounded-xl border bg-white p-4 text-center text-sm">
            {balance.balanced ? <span className="text-green-600">✓ الميزانية متوازنة</span> : <span className="text-red-600">⚠ غير متوازنة</span>}
            <span className="text-slate-500"> — الأصول {money(balance.assets_total)} = الخصوم {money(balance.liabilities_total)} + حقوق الملكية {money(balance.equity_total)}</span>
          </div>
        </div>
      ) : tab === "trial" && trial ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">الحساب</th>
                <th className="px-4 py-3 font-medium">مدين</th>
                <th className="px-4 py-3 font-medium">دائن</th>
              </tr>
            </thead>
            <tbody>
              {trial.rows.map((r) => (
                <tr key={r.code} className="border-t">
                  <td className="px-4 py-2 font-mono text-slate-400">{r.code}</td>
                  <td className="px-4 py-2 text-slate-700">{r.name}</td>
                  <td className="px-4 py-2">{r.debit ? r.debit.toFixed(2) : "-"}</td>
                  <td className="px-4 py-2">{r.credit ? r.credit.toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-slate-50 font-bold">
                <td className="px-4 py-3" colSpan={2}>الإجمالي</td>
                <td className="px-4 py-3">{trial.total_debit.toFixed(2)}</td>
                <td className="px-4 py-3">{trial.total_credit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : tab === "profit" && profit ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="صافي المبيعات" value={profit.net_sales} />
            <Stat label="تكلفة المبيعات" value={profit.cogs} />
            <Stat label="إجمالي الربح" value={profit.gross_profit} accent />
            <Stat label="هامش الربح" value={profit.margin_percent} suffix="%" />
          </div>
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600"><tr>
                <th className="px-4 py-3 font-medium">الصنف</th><th className="px-4 py-3 font-medium">الكمية</th>
                <th className="px-4 py-3 font-medium">صافي البيع</th><th className="px-4 py-3 font-medium">التكلفة</th><th className="px-4 py-3 font-medium">الربح</th>
              </tr></thead>
              <tbody>
                {profit.items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 text-slate-700">{it.name}</td>
                    <td className="px-4 py-2">{it.qty}</td>
                    <td className="px-4 py-2">{it.net_sales.toFixed(2)}</td>
                    <td className="px-4 py-2">{it.cogs.toFixed(2)}</td>
                    <td className="px-4 py-2 font-semibold text-[#0E7C66]">{it.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "tax" && taxR ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="ضريبة المخرجات (مبيعات)" value={taxR.output_vat} />
          <Stat label="ضريبة المدخلات (مشتريات)" value={taxR.input_vat} />
          <Stat label="صافي الضريبة المستحقة" value={taxR.net_vat_due} accent />
        </div>
      ) : tab === "vat" && vat ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600"><tr>
                <th className="px-4 py-3 font-medium">البند</th>
                <th className="px-4 py-3 font-medium">المبلغ الخاضع</th>
                <th className="px-4 py-3 font-medium">الضريبة</th>
              </tr></thead>
              <tbody>
                <tr className="border-t"><td className="px-4 py-2 text-slate-700">مبيعات خاضعة (15%)</td><td className="px-4 py-2">{vat.sales.standard_rated.amount.toFixed(2)}</td><td className="px-4 py-2 font-semibold">{vat.sales.standard_rated.vat.toFixed(2)}</td></tr>
                <tr className="border-t"><td className="px-4 py-2 text-slate-700">مبيعات بنسبة صفرية / معفاة</td><td className="px-4 py-2">{vat.sales.zero_rated.amount.toFixed(2)}</td><td className="px-4 py-2">0.00</td></tr>
                <tr className="border-t"><td className="px-4 py-2 text-slate-700">مشتريات خاضعة (15%)</td><td className="px-4 py-2">{vat.purchases.standard_rated.amount.toFixed(2)}</td><td className="px-4 py-2 font-semibold">{vat.purchases.standard_rated.vat.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="ضريبة المخرجات" value={vat.output_vat} />
            <Stat label="ضريبة المدخلات" value={vat.input_vat} />
            <Stat label={vat.payable ? "صافي المستحق للهيئة" : "صافي القابل للاسترداد"} value={vat.net_vat_due} accent />
          </div>
          <p className="text-center text-xs text-slate-400">
            تُحتسب ضريبتا المخرجات والمدخلات من دفتر الأستاذ (الحسابان 2102 و 1105) ليُخصم أثر المرتجعات تلقائيًا.
          </p>
        </div>
      ) : tab === "byhour" && byHour ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          {byHour.rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-400">لا توجد مبيعات في الفترة</p>
          ) : (() => {
            const max = Math.max(...byHour.rows.map((r) => r.total), 1);
            return (
              <div className="space-y-2 p-4">
                {byHour.rows.map((r) => (
                  <div key={r.hour} className="flex items-center gap-3 text-sm">
                    <span className="w-16 shrink-0 text-slate-500">{String(r.hour).padStart(2, "0")}:00</span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                      <div className="h-full rounded bg-[#0E7C66]" style={{ width: `${(r.total / max) * 100}%` }} />
                    </div>
                    <span className="w-28 shrink-0 text-left font-medium text-slate-700">{money(r.total)}</span>
                    <span className="w-16 shrink-0 text-left text-slate-400">{r.count} فاتورة</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : tab === "byemployee" && byEmp ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr>
              <th className="px-4 py-3 font-medium">الموظف</th><th className="px-4 py-3 font-medium">عدد الفواتير</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th><th className="px-4 py-3 font-medium">متوسط الفاتورة</th>
            </tr></thead>
            <tbody>
              {byEmp.rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
              ) : byEmp.rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 text-slate-700">{r.name}</td>
                  <td className="px-4 py-2">{r.count}</td>
                  <td className="px-4 py-2 font-semibold text-[#0E7C66]">{r.total.toFixed(2)}</td>
                  <td className="px-4 py-2">{r.average_ticket.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "inventory" && inv ? (
        <div className="space-y-4">
          <Stat label="إجمالي قيمة المخزون" value={inv.total_value} accent />
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600"><tr>
                <th className="px-4 py-3 font-medium">الصنف</th><th className="px-4 py-3 font-medium">المخزن</th>
                <th className="px-4 py-3 font-medium">الكمية</th><th className="px-4 py-3 font-medium">متوسط التكلفة</th><th className="px-4 py-3 font-medium">القيمة</th>
              </tr></thead>
              <tbody>
                {inv.rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 text-slate-700">{r.item_name}</td>
                    <td className="px-4 py-2 text-slate-500">{r.warehouse_name}</td>
                    <td className="px-4 py-2">{r.qty}</td>
                    <td className="px-4 py-2">{r.avg_cost.toFixed(2)}</td>
                    <td className="px-4 py-2 font-semibold">{r.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, accent, suffix }: { label: string; value: number; accent?: boolean; suffix?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? "text-[#0E7C66]" : "text-slate-800"}`}>
        {value.toFixed(2)}{suffix ?? ` ${getCurrency()}`}
      </div>
    </div>
  );
}

function Section({ title, lines, total }: { title: string; lines: Line[]; total: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 font-bold text-slate-700">{title}</h2>
      <div className="space-y-1">
        {lines.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">لا توجد بيانات</p>
        ) : (
          lines.map((l, i) => (
            <div key={`${l.code}-${i}`} className="flex justify-between border-b py-1.5 text-sm last:border-0">
              <span className="text-slate-600">{l.name}</span>
              <span className="font-medium text-slate-800">{l.total.toFixed(2)}</span>
            </div>
          ))
        )}
        <div className="flex justify-between border-t-2 pt-2 text-sm font-bold">
          <span>الإجمالي</span>
          <span>{money(total)}</span>
        </div>
      </div>
    </div>
  );
}
