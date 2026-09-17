import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Download,
  Check,
  FileSpreadsheet,
  FileText,
  Loader2,
  Calendar,
  Users,
  Filter,
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { PurchaseBill, SalesBill } from '../types';
import { COMPANY_INFO } from '../utils/storage';
import { NEPALI_MONTHS, getFiscalYear, getFiscalYearHyphen } from '../utils/nepaliCalendar';
import { exportPurchaseBillsToExcel, exportSalesBillsToExcel } from '../utils/excelExport';

interface ExcelViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'purchase' | 'sales';
  selectedBill?: PurchaseBill | SalesBill | null;
  allMonthPurchases?: PurchaseBill[];
  allMonthSales?: SalesBill[];
  allPurchases?: PurchaseBill[];
  allSales?: SalesBill[];
  selectedYear: number;
  selectedMonth: number;
  initialPeriod?: 'monthly' | 'yearly';
  initialParty?: string;
  onOpenTaxInvoice?: (bill: SalesBill) => void;
}

export const ExcelViewModal: React.FC<ExcelViewModalProps> = ({
  isOpen,
  onClose,
  type,
  selectedBill,
  allMonthPurchases = [],
  allMonthSales = [],
  allPurchases = [],
  allSales = [],
  selectedYear,
  selectedMonth,
  initialPeriod = 'monthly',
  initialParty = '',
  onOpenTaxInvoice,
}) => {
  // Period filter: 'monthly' or 'yearly'
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(initialPeriod);
  // Party filter (allows generating yearly or monthly bill for a specific client/party)
  const [partyFilter, setPartyFilter] = useState<string>(initialParty);
  // Default to 'all' so clicking Excel View immediately shows all data of that month/year!
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');
  const [formatNumbersWithCommas, setFormatNumbersWithCommas] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copyingImage, setCopyingImage] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  // Sync state when modal is opened with specific parameters
  useEffect(() => {
    if (isOpen) {
      if (initialPeriod) setPeriod(initialPeriod);
      if (initialParty !== undefined) setPartyFilter(initialParty);
      setViewMode('all'); // Show all rows by default
    }
  }, [isOpen, initialPeriod, initialParty]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine active year, month, and fiscal year
  const billYear = selectedBill?.bsYear || selectedYear;
  const billMonth = selectedBill?.bsMonth || selectedMonth;
  const monthName = NEPALI_MONTHS.find((m) => m.index === billMonth)?.name || 'Bhadra';
  const currentFiscalYear = getFiscalYear(billYear, billMonth);
  const fiscalYearHyphen = getFiscalYearHyphen(billYear, billMonth);

  // List of all unique party names available for this bill type
  const partyOptions = useMemo(() => {
    const set = new Set<string>();
    if (type === 'purchase') {
      const source = allPurchases.length > 0 ? allPurchases : allMonthPurchases;
      source.forEach((b) => {
        if (b.partyName) set.add(b.partyName.trim());
      });
    } else {
      const source = allSales.length > 0 ? allSales : allMonthSales;
      source.forEach((b) => {
        if (b.buyerName) set.add(b.buyerName.trim());
        if (b.partyName) set.add(b.partyName.trim());
      });
    }
    return Array.from(set).sort();
  }, [type, allPurchases, allSales, allMonthPurchases, allMonthSales]);

  // Base pool for Purchase Bills (Monthly vs Yearly)
  const basePurchaseList = useMemo(() => {
    if (period === 'yearly') {
      const pool = allPurchases.length > 0 ? allPurchases : allMonthPurchases;
      return pool.filter(
        (b) => b.bsYear === billYear || b.fiscalYear === currentFiscalYear
      );
    }
    if (allMonthPurchases.length > 0) return allMonthPurchases;
    return allPurchases.filter((b) => b.bsYear === billYear && b.bsMonth === billMonth);
  }, [period, allPurchases, allMonthPurchases, billYear, billMonth, currentFiscalYear]);

  // Filtered Purchase Bills (Party + Scope)
  const purchaseRows: PurchaseBill[] = useMemo(() => {
    let list = basePurchaseList;
    if (partyFilter.trim()) {
      const term = partyFilter.trim().toLowerCase();
      list = list.filter((b) => b.partyName && b.partyName.toLowerCase() === term);
    }
    if (viewMode === 'single' && selectedBill && type === 'purchase') {
      return [selectedBill as PurchaseBill];
    }
    return list;
  }, [basePurchaseList, partyFilter, viewMode, selectedBill, type]);

  // Base pool for Sales Bills (Monthly vs Yearly)
  const baseSalesList = useMemo(() => {
    if (period === 'yearly') {
      const pool = allSales.length > 0 ? allSales : allMonthSales;
      return pool.filter(
        (b) => b.bsYear === billYear || b.fiscalYear === currentFiscalYear
      );
    }
    if (allMonthSales.length > 0) return allMonthSales;
    return allSales.filter((b) => b.bsYear === billYear && b.bsMonth === billMonth);
  }, [period, allSales, allMonthSales, billYear, billMonth, currentFiscalYear]);

  // Filtered Sales Bills (Party + Scope)
  const salesRows: SalesBill[] = useMemo(() => {
    let list = baseSalesList;
    if (partyFilter.trim()) {
      const term = partyFilter.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.buyerName && b.buyerName.toLowerCase() === term) ||
          (b.partyName && b.partyName.toLowerCase() === term)
      );
    }
    if (viewMode === 'single' && selectedBill && type === 'sales') {
      return [selectedBill as SalesBill];
    }
    return list;
  }, [baseSalesList, partyFilter, viewMode, selectedBill, type]);

  if (!isOpen) return null;

  const formatAmount = (num: number) => {
    if (formatNumbersWithCommas) {
      return num.toLocaleString('en-IN');
    }
    return Math.round(num).toString();
  };

  const handlePrint = () => {
    window.print();
  };

  // Copy as Image (PNG) directly to clipboard, with file download fallback
  const handleCopyImage = async () => {
    if (!sheetRef.current || copyingImage) return;

    try {
      setCopyingImage(true);

      const blob = await toBlob(sheetRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Failed to render sheet to image');
      }

      let copiedDirectly = false;
      if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          copiedDirectly = true;
          setCopied(true);
          setCopyToast('Bill copied as image! Paste (Ctrl+V) directly into Excel, Word, or messages.');
          setTimeout(() => {
            setCopied(false);
            setCopyToast(null);
          }, 3500);
        } catch (clipErr) {
          console.warn('ClipboardItem write rejected:', clipErr);
        }
      }

      if (!copiedDirectly) {
        // Fallback: download PNG image file directly
        const dataUrl = await toPng(sheetRef.current, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        const partySlug = partyFilter ? `_${partyFilter.replace(/\s+/g, '_')}` : '';
        link.download = `${type}_${period}_bill${partySlug}_${fiscalYearHyphen}.png`;
        link.href = dataUrl;
        link.click();
        setCopied(true);
        setCopyToast('Bill exported as PNG image file!');
        setTimeout(() => {
          setCopied(false);
          setCopyToast(null);
        }, 3500);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Could not copy image automatically. You can print or save as PDF.');
    } finally {
      setCopyingImage(false);
    }
  };

  const handleExportExcel = async () => {
    if (type === 'purchase') {
      await exportPurchaseBillsToExcel(purchaseRows, billYear, billMonth, period, partyFilter);
    } else {
      await exportSalesBillsToExcel(salesRows, billYear, billMonth, period, partyFilter);
    }
  };

  const handleDownloadCSV = () => {
    const periodLabel = period === 'yearly' ? `Yearly_${fiscalYearHyphen}` : `${monthName}_${fiscalYearHyphen}`;
    const partySlug = partyFilter ? `_${partyFilter.replace(/\s+/g, '_')}` : '';
    const filename =
      type === 'purchase'
        ? `Purchase_Bills_${periodLabel}${partySlug}.csv`
        : `ADO_Transport_Sales_Bills_${periodLabel}${partySlug}.csv`;

    let rows: string[][] = [];
    if (type === 'purchase') {
      rows = [
        [partyFilter ? `${partyFilter}` : ''],
        [period === 'yearly' ? `Yearly Purchase Bills (${fiscalYearHyphen})` : `${monthName} Month Purchase Bills`],
        [`Fiscal Year: ${fiscalYearHyphen}`],
        [],
        ['S.N', 'Date', 'Invoice No.', 'Party Name', 'VAT No.', 'PAN BILL', 'Before VAT', 'VAT', 'After VAT'],
        ...purchaseRows.map((r, idx) => [
          (idx + 1).toString(),
          r.dateBS,
          r.invoiceNo,
          r.partyName,
          r.vatNo || '',
          r.billsDescription || r.pan || '',
          formatAmount(r.beforeVat),
          formatAmount(r.vat),
          formatAmount(r.afterVat),
        ]),
      ];
    } else {
      rows = [
        ['ADO INTERNATIONAL TRANSPORT NEPAL PVT. LTD.'],
        [partyFilter ? `Client / Buyer: ${partyFilter}` : ''],
        [period === 'yearly' ? `Yearly Sales Bills (${fiscalYearHyphen})` : `${monthName} Month Sales Bills`],
        [`Fiscal Year: ${fiscalYearHyphen}`],
        [],
        [
          'S.N',
          'Date',
          'Invoice No.',
          "Buyer's Name",
          'VAT No.',
          'Before VAT',
          'VAT',
          'After VAT',
          'Category',
          'Party Name',
          'VAT Type',
          'Payment',
        ],
        ...salesRows.map((r, idx) => [
          (idx + 1).toString(),
          r.dateBS,
          r.invoiceNo,
          r.buyerName,
          r.vatNo || '',
          formatAmount(r.beforeVat),
          formatAmount(r.vat),
          formatAmount(r.afterVat),
          r.category || 'General',
          r.partyName || '',
          r.vatType === 'Taxable' ? 'Added' : r.vatType,
          r.paymentMethod === 'Cash' ? 'Paid' : r.paymentMethod,
        ]),
      ];
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
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

  const currentCount = type === 'purchase' ? purchaseRows.length : salesRows.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      id="excel-view-modal-backdrop"
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-[99vw] 2xl:max-w-[1560px] max-h-[96vh] flex flex-col overflow-hidden my-auto"
        id="excel-view-modal-dialog"
      >
        {/* Top Control Header Bar (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">Excel Spreadsheet Detail View</span>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700">
                  {type === 'purchase' ? 'Purchase Bills' : 'Sales Bills'}
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
                  {period === 'yearly' ? `Yearly (FY ${fiscalYearHyphen})` : `${monthName} ${billYear}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official tabular layout matching standard Excel reporting format ({currentCount} rows)
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Toggle: Monthly vs Yearly */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700 text-xs">
              <button
                type="button"
                id="btn-excel-period-monthly"
                onClick={() => setPeriod('monthly')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  period === 'monthly'
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View Month Bills"
              >
                <Calendar className="w-3 h-3" />
                <span>Monthly ({monthName})</span>
              </button>
              <button
                type="button"
                id="btn-excel-period-yearly"
                onClick={() => setPeriod('yearly')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  period === 'yearly'
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Generate Full Yearly Bill for FY"
              >
                <Calendar className="w-3 h-3" />
                <span>Yearly Bill</span>
              </button>
            </div>

            {/* Client / Party Filter Dropdown */}
            <div className="relative flex items-center">
              <select
                id="select-excel-party-filter"
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer max-w-[200px]"
                title="Filter by Client or Party"
              >
                <option value="">All Parties / Clients</option>
                {partyOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle (Selected Row vs All Rows) */}
            {selectedBill && (
              <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Rows ({currentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Row
                </button>
              </div>
            )}

            {/* Currency toggle */}
            <button
              type="button"
              onClick={() => setFormatNumbersWithCommas(!formatNumbersWithCommas)}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer"
              title="Toggle Comma Formatted Numbers"
            >
              {formatNumbersWithCommas ? 'Raw (e.g. 65102)' : 'Formatted (e.g. 65,102)'}
            </button>

            {/* Copy Button (Copies bill in image format) */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copyingImage}
              id="btn-copy-bill-image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Copy bill in image format (PNG) to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : copyingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Copying...</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              id="btn-excel-export-xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-bold cursor-pointer transition-colors shadow-xs"
              title="Export formatted Excel (.xlsx) spreadsheet with centered data & bold highlighted headings"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Export Excel</span>
            </button>

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Download as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            {/* Optional Tax Invoice for Sales */}
            {type === 'sales' && selectedBill && onOpenTaxInvoice && (
              <button
                type="button"
                onClick={() => onOpenTaxInvoice(selectedBill as SalesBill)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                title="View Official IRD Letterhead Tax Invoice"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>IRD Tax Invoice</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Copy Notification Toast */}
        {copyToast && (
          <div className="bg-teal-900/90 text-teal-100 px-4 py-2 text-xs flex items-center justify-between border-b border-teal-700 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-300 shrink-0" />
              <span>{copyToast}</span>
            </div>
            <button
              onClick={() => setCopyToast(null)}
              className="text-teal-300 hover:text-white ml-2 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 md:p-6 bg-slate-50/70 print:p-0 print:bg-white excel-print-container">
          {/* Authentic Excel Worksheet Container */}
          <div
            ref={sheetRef}
            className="bg-white border border-slate-300 shadow-sm p-4 sm:p-6 md:p-8 w-full min-w-[1000px] max-w-full mx-auto print:border-none print:shadow-none print:p-0"
            id="excel-worksheet-content"
          >
            {/* ========================================================= */}
            {/* PURCHASE BILLS EXCEL FORMAT (Exact as Image 1) */}
            {/* ========================================================= */}
            {type === 'purchase' && (
              <div className="space-y-4">
                {/* Heading */}
                <div className="text-center py-2 space-y-1">
                  {partyFilter && (
                    <h2 className="text-xl sm:text-2xl font-bold text-black tracking-normal">
                      {partyFilter}
                    </h2>
                  )}
                  <h1 className="text-xl sm:text-2xl font-bold text-black tracking-normal">
                    {period === 'yearly'
                      ? `Yearly Purchase Bills`
                      : `${monthName} Month Purchase Bills`}
                  </h1>
                  <h3 className="text-lg sm:text-xl font-bold text-black tracking-normal mt-0.5">
                    {fiscalYearHyphen}
                  </h3>
                </div>

                {/* Excel Table Grid */}
                <div className="w-full relative">
                  <table
                    className="excel-grid-table border-collapse w-full table-fixed text-black text-[11px] sm:text-xs font-sans leading-tight shadow-xs"
                    style={{ border: '2px solid #000000', borderBottom: '2px solid #000000' }}
                  >
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-black">
                        <th
                          style={{ width: '3.5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          S.N
                        </th>
                        <th
                          style={{ width: '9.5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Date
                        </th>
                        <th
                          style={{ width: '11%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Invoice No.
                        </th>
                        <th
                          style={{ width: '22%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Party Name
                        </th>
                        <th
                          style={{ width: '8.5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          VAT No.
                        </th>
                        <th
                          style={{ width: '11.5%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          PAN BILL
                        </th>
                        <th
                          style={{ width: '11%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Before VAT
                        </th>
                        <th
                          style={{ width: '11%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          VAT
                        </th>
                        <th
                          style={{ width: '11.5%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          After VAT
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="border border-black px-4 py-8 text-center text-slate-500 italic"
                            style={{ border: '1px solid #000000' }}
                          >
                            No purchase bills recorded for this selection.
                          </td>
                        </tr>
                      ) : (
                        purchaseRows.map((row, index) => {
                          const isLastRow = index === purchaseRows.length - 1;
                          const bottomBorderStyle = isLastRow ? { borderBottom: '2px solid #000000' } : {};
                          return (
                            <tr key={row.id || index} className="hover:bg-slate-50/50">
                              <td
                                className="border border-black px-1 py-1.5 text-center font-medium overflow-hidden break-words leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {index + 1}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center whitespace-nowrap overflow-hidden break-all leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.dateBS}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center font-mono font-medium overflow-hidden break-words leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.invoiceNo}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-medium break-words overflow-hidden leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.partyName}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center font-mono overflow-hidden break-all leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.vatNo || '-'}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center break-words overflow-hidden leading-tight text-slate-700"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.billsDescription || row.pan || '-'}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-medium overflow-hidden break-words"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.beforeVat)}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-medium overflow-hidden break-words"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.vat)}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-bold overflow-hidden break-words text-black"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.afterVat)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {/* Totals Row */}
                    {purchaseRows.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold">
                          <td
                            colSpan={6}
                            className="border border-black px-2 py-2 text-center uppercase tracking-wider overflow-hidden font-extrabold"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            Total ({purchaseRows.length} Bills):
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(purchaseRows.reduce((a, b) => a + b.beforeVat, 0))}
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(purchaseRows.reduce((a, b) => a + b.vat, 0))}
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(purchaseRows.reduce((a, b) => a + b.afterVat, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <div
                    className="w-full pointer-events-none"
                    style={{ height: '2px', backgroundColor: '#000000', marginTop: '-2px', width: '100%' }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SALES BILLS EXCEL FORMAT (Exact as Image 2) */}
            {/* ========================================================= */}
            {type === 'sales' && (
              <div className="space-y-4">
                {/* Heading */}
                <div className="text-center py-2 space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-black tracking-normal uppercase">
                    ADO INTERNATIONAL TRANSPORT NEPAL PVT. LTD.
                  </h1>
                  {partyFilter ? (
                    <>
                      <h2 className="text-lg sm:text-xl font-bold text-black tracking-normal pt-1">
                        Client / Buyer: {partyFilter}
                      </h2>
                      <h3 className="text-base sm:text-lg font-bold text-black tracking-normal">
                        {period === 'yearly' ? 'Yearly Sales Bills' : `${monthName} Month Sales Bills`} ({fiscalYearHyphen})
                      </h3>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg sm:text-xl font-bold text-black tracking-normal pt-1">
                        {period === 'yearly' ? 'Yearly Sales Bills' : `${monthName} Month Sales Bills`}
                      </h2>
                      <h3 className="text-base sm:text-lg font-bold text-black tracking-normal">
                        {fiscalYearHyphen}
                      </h3>
                    </>
                  )}
                </div>

                {/* Excel Table Grid */}
                <div className="w-full relative">
                  <table
                    className="excel-grid-table border-collapse w-full table-fixed text-black text-[11px] sm:text-xs font-sans leading-tight shadow-xs"
                    style={{ border: '2px solid #000000', borderBottom: '2px solid #000000' }}
                  >
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-black">
                        <th
                          style={{ width: '3%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          S.N
                        </th>
                        <th
                          style={{ width: '9%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Date
                        </th>
                        <th
                          style={{ width: '10.5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Invoice No.
                        </th>
                        <th
                          style={{ width: '16%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Buyer's Name
                        </th>
                        <th
                          style={{ width: '8%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          VAT No.
                        </th>
                        <th
                          style={{ width: '8.5%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Before VAT
                        </th>
                        <th
                          style={{ width: '6.5%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          VAT
                        </th>
                        <th
                          style={{ width: '8.5%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          After VAT
                        </th>
                        <th
                          style={{ width: '10%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Category
                        </th>
                        <th
                          style={{ width: '10%', border: '1px solid #000000' }}
                          className="border border-black px-1.5 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Party Name
                        </th>
                        <th
                          style={{ width: '5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          VAT Type
                        </th>
                        <th
                          style={{ width: '5%', border: '1px solid #000000' }}
                          className="border border-black px-1 py-2 text-center font-extrabold text-black uppercase tracking-wider overflow-hidden break-words bg-slate-100"
                        >
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={12}
                            className="border border-black px-4 py-8 text-center text-slate-500 italic"
                            style={{ border: '1px solid #000000' }}
                          >
                            No sales bills recorded for this selection.
                          </td>
                        </tr>
                      ) : (
                        salesRows.map((row, index) => {
                          const isLastRow = index === salesRows.length - 1;
                          const bottomBorderStyle = isLastRow ? { borderBottom: '2px solid #000000' } : {};
                          return (
                            <tr key={row.id || index} className="hover:bg-slate-50/50">
                              <td
                                className="border border-black px-1 py-1.5 text-center font-medium overflow-hidden break-words leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {index + 1}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center whitespace-nowrap overflow-hidden break-all leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.dateBS}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center font-mono font-medium overflow-hidden break-words leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.invoiceNo}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center break-words overflow-hidden leading-tight font-medium"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.buyerName}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center font-mono overflow-hidden break-all leading-tight"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.vatNo || '-'}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-medium overflow-hidden break-words"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.beforeVat)}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-medium overflow-hidden break-words"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.vat)}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center font-mono font-bold overflow-hidden break-words text-black"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {formatAmount(row.afterVat)}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center break-words overflow-hidden leading-tight text-slate-700"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.category || 'General'}
                              </td>
                              <td
                                className="border border-black px-1.5 py-1.5 text-center break-words overflow-hidden leading-tight text-slate-700"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.partyName || row.buyerName}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center overflow-hidden break-words leading-tight text-[10px] uppercase font-medium"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.vatType === 'Taxable' ? 'Added' : row.vatType}
                              </td>
                              <td
                                className="border border-black px-1 py-1.5 text-center overflow-hidden break-words leading-tight text-[10px] uppercase font-medium"
                                style={{ border: '1px solid #000000', ...bottomBorderStyle }}
                              >
                                {row.paymentMethod === 'Cash' ? 'Paid' : row.paymentMethod}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {/* Totals Row */}
                    {salesRows.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold">
                          <td
                            colSpan={5}
                            className="border border-black px-2 py-2 text-center uppercase tracking-wider overflow-hidden font-extrabold"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            Total ({salesRows.length} Bills):
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(salesRows.reduce((a, b) => a + b.beforeVat, 0))}
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(salesRows.reduce((a, b) => a + b.vat, 0))}
                          </td>
                          <td
                            className="border border-black px-1.5 py-2 text-center font-mono font-extrabold overflow-hidden break-words"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          >
                            {formatAmount(salesRows.reduce((a, b) => a + b.afterVat, 0))}
                          </td>
                          <td
                            colSpan={4}
                            className="border border-black overflow-hidden bg-slate-100"
                            style={{ border: '1px solid #000000', borderBottom: '2px solid #000000' }}
                          ></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <div
                    className="w-full pointer-events-none"
                    style={{ height: '2px', backgroundColor: '#000000', marginTop: '-2px', width: '100%' }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Status Bar (Hidden during Print) */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">
              Format: Microsoft Excel Spreadsheet Compatible Grid
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 hidden sm:inline">
              Tip: Press "Copy" to paste directly into an Excel worksheet or send as image.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-semibold cursor-pointer transition-colors"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
