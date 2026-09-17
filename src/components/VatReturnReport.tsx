import React from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
} from 'lucide-react';
import { PurchaseBill, SalesBill } from '../types';
import { COMPANY_INFO } from '../utils/storage';
import {
  formatNPR,
  NEPALI_MONTHS,
  getFiscalYear,
  getVatFilingDeadlineInfo,
} from '../utils/nepaliCalendar';

interface VatReturnReportProps {
  selectedYear: number;
  selectedMonth: number;
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
}

export const VatReturnReport: React.FC<VatReturnReportProps> = ({
  selectedYear,
  selectedMonth,
  purchaseBills,
  salesBills,
}) => {
  const currentMonthName = NEPALI_MONTHS.find((m) => m.index === selectedMonth)?.name || '';
  const currentMonthNepali = NEPALI_MONTHS.find((m) => m.index === selectedMonth)?.nepaliName || '';
  const fiscalYear = getFiscalYear(selectedYear, selectedMonth);
  const deadlineInfo = getVatFilingDeadlineInfo(selectedYear, selectedMonth);

  // Filter bills
  const monthPurchases = purchaseBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );
  const monthSales = salesBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );

  // Sales Categorization
  const taxableSalesBills = monthSales.filter((b) => b.vatType === 'Taxable' || !b.vatType);
  const exemptSalesBills = monthSales.filter((b) => b.vatType === 'Exempt');
  const zeroRatedSalesBills = monthSales.filter((b) => b.vatType === 'Zero-Rated');

  const taxableSalesBefore = taxableSalesBills.reduce((acc, b) => acc + b.beforeVat, 0);
  const taxableSalesVat = taxableSalesBills.reduce((acc, b) => acc + b.vat, 0);

  const exemptSalesBefore = exemptSalesBills.reduce((acc, b) => acc + b.beforeVat, 0);
  const zeroRatedSalesBefore = zeroRatedSalesBills.reduce((acc, b) => acc + b.beforeVat, 0);

  const totalSalesBefore = taxableSalesBefore + exemptSalesBefore + zeroRatedSalesBefore;
  const totalSalesVat = taxableSalesVat; // Output VAT
  const totalSalesAfter = totalSalesBefore + totalSalesVat;

  // Purchase Categorization
  const totalPurchaseBefore = monthPurchases.reduce((acc, b) => acc + b.beforeVat, 0);
  const totalPurchaseVat = monthPurchases.reduce((acc, b) => acc + b.vat, 0); // Input VAT
  const totalPurchaseAfter = monthPurchases.reduce((acc, b) => acc + b.afterVat, 0);

  // Net VAT Calculation
  const netVat = totalSalesVat - totalPurchaseVat;
  const isPayable = netVat > 0;
  const isCredit = netVat < 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const filename = `IRD_VAT_Return_Summary_${currentMonthName}_${selectedYear}.csv`;
    const rows = [
      ['INLAND REVENUE DEPARTMENT (NEPAL) - MONTHLY VAT RETURN SUMMARY'],
      [`Company Name: ${COMPANY_INFO.name}`],
      [`PAN/VAT No: ${COMPANY_INFO.panVatNo}`],
      [`Accounting Period: ${currentMonthName} ${selectedYear} B.S. (FY ${fiscalYear})`],
      [`Filing Deadline: ${deadlineInfo.deadlineFormatted}`],
      [''],
      ['SECTION 1: SALES REGISTER (OUTPUT TAX)'],
      ['Category', 'Before VAT (Taxable)', 'VAT Rate', 'VAT Collected (Output)'],
      ['1. Taxable Domestic Freight Sales', taxableSalesBefore.toFixed(2), '13%', taxableSalesVat.toFixed(2)],
      ['2. Exempt Sales', exemptSalesBefore.toFixed(2), '0%', '0.00'],
      ['3. Zero-Rated Export Consignments', zeroRatedSalesBefore.toFixed(2), '0%', '0.00'],
      ['Total Sales', totalSalesBefore.toFixed(2), '', totalSalesVat.toFixed(2)],
      [''],
      ['SECTION 2: PURCHASE REGISTER (INPUT TAX CREDIT)'],
      ['Category', 'Before VAT (Taxable)', 'VAT Rate', 'VAT Paid (Input)'],
      ['1. Taxable Fleet Purchases & Fuel', totalPurchaseBefore.toFixed(2), '13%', totalPurchaseVat.toFixed(2)],
      ['Total Purchases', totalPurchaseBefore.toFixed(2), '', totalPurchaseVat.toFixed(2)],
      [''],
      ['SECTION 3: NET TAX ASSESSMENT'],
      ['Gross Output VAT (Sales Tax Collected)', '', '', totalSalesVat.toFixed(2)],
      ['Less: Input VAT Credit (Purchase Tax Paid)', '', '', totalPurchaseVat.toFixed(2)],
      [
        isPayable ? 'Net VAT Payable to IRD' : 'Net VAT Credit Carried Forward',
        '',
        '',
        Math.abs(netVat).toFixed(2),
      ],
    ];

    const csvContent = '\uFEFF' + rows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="vat-return-report-view">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-700" />
            <span>Monthly VAT Return Report (मूल्य अभिवृद्धि कर विवरण)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Formulated according to Inland Revenue Department (IRD) Nepal standard VAT filing format
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            id="btn-export-vat-return-csv"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Summary CSV</span>
          </button>
          <button
            onClick={handlePrint}
            id="btn-print-vat-return"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print IRD Return</span>
          </button>
        </div>
      </div>

      {/* Main IRD Form Container */}
      <div
        className="bg-white border border-slate-300 rounded-xl shadow-xs p-6 sm:p-8 space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0"
        id="vat-return-form-document"
      >
        {/* IRD Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Government of Nepal • Ministry of Finance • Inland Revenue Department
          </p>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
            Value Added Tax (VAT) Return — अनुसूची १० (नियम २३ सँग सम्बन्धित)
          </h1>
          <p className="text-xs text-slate-700 font-medium">
            Monthly Tax Statement for Accounting Period: <span className="font-bold underline">{currentMonthName} {selectedYear} B.S. ({currentMonthNepali})</span> | Fiscal Year: <span className="font-bold font-mono">{fiscalYear}</span>
          </p>
        </div>

        {/* Taxpayer Information Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 bg-slate-50/60 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Taxpayer's Legal Name:</span>
              <span className="font-bold text-slate-900">{COMPANY_INFO.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Trade Name (Nepali):</span>
              <span className="font-semibold text-slate-800">{COMPANY_INFO.tradeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Registered Address:</span>
              <span className="text-slate-800">{COMPANY_INFO.address}</span>
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500 font-medium">Permanent Account No. (PAN/VAT):</span>
              <span className="font-mono font-black text-slate-950 text-sm bg-white px-2 py-0.5 border border-slate-300 rounded">
                {COMPANY_INFO.panVatNo}
              </span>
            </div>
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500 font-medium">Filing Office:</span>
              <span className="font-semibold text-slate-800">{COMPANY_INFO.vatOffice}</span>
            </div>
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500 font-medium">Statutory Filing Deadline:</span>
              <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {deadlineInfo.deadlineFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Table 1: Sales (Output Tax) Register */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">1</span>
              <span>Output Tax Details — Sales Register (बिक्री खाता विवरण)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Total Invoices: {monthSales.length}
            </span>
          </div>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-semibold text-[11px]">
                <th className="border border-slate-300 p-2 text-left">Classification of Sales</th>
                <th className="border border-slate-300 p-2 text-right w-36">Before VAT (NPR)</th>
                <th className="border border-slate-300 p-2 text-center w-20">Rate</th>
                <th className="border border-slate-300 p-2 text-right w-36">VAT Collected (NPR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2.5 font-medium text-slate-900">
                  (a) Taxable Transport & Freight Sales (करयोग्य बिक्री)
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono">
                  {formatNPR(taxableSalesBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center font-mono font-medium">
                  13%
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-semibold text-emerald-700">
                  {formatNPR(taxableSalesVat)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2.5 text-slate-700">
                  (b) Exempt Cargo Sales (कर छुट भएको बिक्री)
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-600">
                  {formatNPR(exemptSalesBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center font-mono text-slate-400">
                  0%
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-400">
                  Rs. 0.00
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2.5 text-slate-700">
                  (c) Zero-Rated Cross-Border Consignments (शुन्य दरको बिक्री)
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-600">
                  {formatNPR(zeroRatedSalesBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center font-mono text-slate-400">
                  0%
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-400">
                  Rs. 0.00
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-400 font-bold">
                <td className="border border-slate-300 p-2.5 uppercase">
                  Total Sales / Output Tax (जम्मा बिक्री तथा असुल भएको कर):
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono">
                  {formatNPR(totalSalesBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center">-</td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-emerald-800 text-sm">
                  {formatNPR(totalSalesVat)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table 2: Purchase (Input Tax) Register */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Input Tax Details — Purchase Register (खरीद खाता विवरण)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Total Bills: {monthPurchases.length}
            </span>
          </div>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-semibold text-[11px]">
                <th className="border border-slate-300 p-2 text-left">Classification of Purchases</th>
                <th className="border border-slate-300 p-2 text-right w-36">Before VAT (NPR)</th>
                <th className="border border-slate-300 p-2 text-center w-20">Rate</th>
                <th className="border border-slate-300 p-2 text-right w-36">VAT Paid (Input) (NPR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2.5 font-medium text-slate-900">
                  (a) Taxable Purchases (Fuel, Tyres, Spares, Maintenance)
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono">
                  {formatNPR(totalPurchaseBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center font-mono font-medium">
                  13%
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-semibold text-blue-700">
                  {formatNPR(totalPurchaseVat)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-400 font-bold">
                <td className="border border-slate-300 p-2.5 uppercase">
                  Total Purchases / Input Tax Credit (जम्मा खरीद तथा दाखिला योग्य कर):
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono">
                  {formatNPR(totalPurchaseBefore)}
                </td>
                <td className="border border-slate-300 p-2.5 text-center">-</td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-blue-800 text-sm">
                  {formatNPR(totalPurchaseVat)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table 3: Final Tax Settlement Computation */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center justify-center">3</span>
            <span>Net Tax Settlement Computation (खुद मूल्य अभिवृद्धि कर हिसाब)</span>
          </h3>

          <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-200 text-xs">
              <div className="p-3 flex justify-between items-center bg-white">
                <span className="font-semibold text-slate-700">
                  1. Total Output Tax Collected on Sales (असुली कर)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatNPR(totalSalesVat)}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center bg-white">
                <span className="font-semibold text-slate-700">
                  2. Less: Total Input Tax Credit on Purchases (कट्टी गर्न पाउने खरीद कर)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  (-) {formatNPR(totalPurchaseVat)}
                </span>
              </div>
              <div
                className={`p-4 flex justify-between items-center ${
                  isPayable ? 'bg-rose-100/70 text-rose-950' : 'bg-emerald-100/70 text-emerald-950'
                }`}
              >
                <div>
                  <span className="text-sm font-black uppercase tracking-wide block">
                    {isPayable
                      ? 'Net VAT Payable to IRD (दाखिला गर्नुपर्ने खुद कर):'
                      : 'Net VAT Credit Carried Forward (अर्को महिना सार्ने कर कट्टी):'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {isPayable
                      ? 'Must be deposited at authorized bank counter or e-payment before deadline'
                      : 'Eligible for adjustment against next month sales output tax'}
                  </span>
                </div>
                <span className="font-mono font-black text-xl sm:text-2xl">
                  {formatNPR(Math.abs(netVat))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Declaration & Signatures */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-4">
          <p className="italic">
            Declaration: I hereby declare that the particulars provided in this Return are true, correct, and complete according to the records maintained by ADO Transport Pvt. Ltd. in accordance with Nepal Value Added Tax Act, 2052.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-800">Chief Accountant / Tax Officer</p>
              <p className="text-[10px] text-slate-500">ADO Transport Pvt. Ltd.</p>
              <p className="text-[10px] text-slate-400 mt-1">Date: ____________________</p>
            </div>

            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-800">Managing Director / Authorized Representative</p>
              <p className="text-[10px] text-slate-500">Official Company Seal</p>
              <p className="text-[10px] text-slate-400 mt-1">Date: ____________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
