import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Coins,
  Receipt,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  PlusCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { PurchaseBill, SalesBill } from '../types';
import {
  formatNPR,
  NEPALI_MONTHS,
  getVatFilingDeadlineInfo,
  getFiscalYear,
} from '../utils/nepaliCalendar';

interface DashboardProps {
  selectedYear: number;
  selectedMonth: number;
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  onOpenAddBill: (type: 'purchase' | 'sales') => void;
  onNavigateToTab: (tab: any) => void;
  onViewInvoice: (bill: SalesBill) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedYear,
  selectedMonth,
  purchaseBills,
  salesBills,
  onOpenAddBill,
  onNavigateToTab,
  onViewInvoice,
}) => {
  // Filter for selected BS month and year
  const monthlyPurchases = purchaseBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );
  const monthlySales = salesBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );

  // Calculations
  const totalPurchaseBeforeVat = monthlyPurchases.reduce((acc, b) => acc + b.beforeVat, 0);
  const totalPurchaseVat = monthlyPurchases.reduce((acc, b) => acc + b.vat, 0);
  const totalPurchaseAfterVat = monthlyPurchases.reduce((acc, b) => acc + b.afterVat, 0);

  const totalSalesBeforeVat = monthlySales.reduce((acc, b) => acc + b.beforeVat, 0);
  const totalSalesVat = monthlySales.reduce((acc, b) => acc + b.vat, 0);
  const totalSalesAfterVat = monthlySales.reduce((acc, b) => acc + b.afterVat, 0);

  // Net VAT: Sales VAT (Output) - Purchase VAT (Input)
  const netVat = totalSalesVat - totalPurchaseVat;
  const isPayable = netVat > 0;
  const isCredit = netVat < 0;

  const currentMonthName = NEPALI_MONTHS.find((m) => m.index === selectedMonth)?.name || '';
  const deadlineInfo = getVatFilingDeadlineInfo(selectedYear, selectedMonth);
  const fiscalYear = getFiscalYear(selectedYear, selectedMonth);

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* VAT Filing Deadline Reminder Banner */}
      <div
        className="rounded-lg p-4 bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        id="vat-deadline-banner"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-amber-100 text-amber-800 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-900">
                Inland Revenue Department (IRD) VAT Filing Notice
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 text-amber-900">
                Monthly Due: 25th
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              VAT Return for <span className="font-semibold">{currentMonthName} {selectedYear} B.S.</span> must be filed and tax paid by{' '}
              <span className="font-bold underline text-amber-950">{deadlineInfo.deadlineFormatted}</span>.
              Late filings incur interest and penalties under Nepal VAT Act 2052.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('vat-return')}
          id="btn-goto-vat-return"
          className="self-end sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Prepare IRD Return</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* Total Purchases Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Purchases (Input)
            </span>
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatNPR(totalPurchaseAfterVat)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">
              <span>Before VAT: {formatNPR(totalPurchaseBeforeVat)}</span>
              <span className="font-medium text-slate-700">{monthlyPurchases.length} bills</span>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sales (Output)
            </span>
            <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatNPR(totalSalesAfterVat)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">
              <span>Before VAT: {formatNPR(totalSalesBeforeVat)}</span>
              <span className="font-medium text-teal-700">{monthlySales.length} invoices</span>
            </div>
          </div>
        </div>

        {/* VAT Paid (Input Tax) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Purchase VAT Paid (Input)
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-800 font-mono tracking-tight">
              {formatNPR(totalPurchaseVat)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Available as input tax credit against sales
            </div>
          </div>
        </div>

        {/* VAT Collected (Output Tax) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sales VAT Collected (Output)
            </span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-800 font-mono tracking-tight">
              {formatNPR(totalSalesVat)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Gross VAT charged to clients on transport
            </div>
          </div>
        </div>
      </div>

      {/* Primary VAT Settlement Callout Card (The essential number for accountants) */}
      <div
        className={`rounded-lg p-5 border shadow-xs ${
          isPayable
            ? 'bg-rose-50/70 border-rose-200'
            : isCredit
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-slate-50 border-slate-200'
        }`}
        id="vat-settlement-card"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Monthly VAT Settlement Status ({currentMonthName} {selectedYear})
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isPayable
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isCredit
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {isPayable ? 'VAT Payable to IRD' : isCredit ? 'VAT Credit (Receivable)' : 'Balanced'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Calculation formula: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-slate-800">Sales VAT ({formatNPR(totalSalesVat)}) − Purchase VAT ({formatNPR(totalPurchaseVat)})</code>
            </p>
          </div>

          <div className="flex items-center gap-6 self-stretch lg:self-auto justify-between lg:justify-end">
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">
                {isPayable ? 'Net Amount to Deposit:' : 'Credit to Carry Forward:'}
              </span>
              <span
                className={`text-2xl sm:text-3xl font-bold font-mono ${
                  isPayable ? 'text-rose-700' : isCredit ? 'text-emerald-700' : 'text-slate-700'
                }`}
              >
                {formatNPR(Math.abs(netVat))}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onNavigateToTab('vat-return')}
                id="btn-review-monthly-vat-return"
                className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                View Full IRD Return
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Purchase Bills ({currentMonthName})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddBill('purchase')}
                id="btn-dash-add-purchase"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Purchase</span>
              </button>
              <button
                onClick={() => onNavigateToTab('purchase')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                View All
              </button>
            </div>
          </div>

          {monthlyPurchases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No purchase bills recorded for {currentMonthName} {selectedYear}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {monthlyPurchases.slice(0, 5).map((bill) => (
                <div key={bill.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{bill.partyName}</span>
                      <span className="font-mono text-slate-400 text-[11px] font-normal">#{bill.invoiceNo}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {bill.dateBS} • {bill.billsDescription || 'Fleet expenses'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-900">
                      {formatNPR(bill.afterVat)}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      VAT: {formatNPR(bill.vat)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Sales Invoices ({currentMonthName})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddBill('sales')}
                id="btn-dash-add-sales"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Sales</span>
              </button>
              <button
                onClick={() => onNavigateToTab('sales')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                View All
              </button>
            </div>
          </div>

          {monthlySales.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No sales invoices recorded for {currentMonthName} {selectedYear}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {monthlySales.slice(0, 5).map((bill) => (
                <div key={bill.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{bill.buyerName}</span>
                      <span className="font-mono text-teal-700 text-[11px] font-medium">#{bill.invoiceNo}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {bill.dateBS} • {bill.category} • {bill.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-mono font-semibold text-slate-900">
                        {formatNPR(bill.afterVat)}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        VAT: {formatNPR(bill.vat)}
                      </div>
                    </div>
                    <button
                      onClick={() => onViewInvoice(bill)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                      title="Print / View Tax Invoice"
                    >
                      Tax Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
