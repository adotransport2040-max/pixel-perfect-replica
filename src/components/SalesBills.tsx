import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { SalesBill, VatType } from '../types';
import { formatNPR, NEPALI_MONTHS, getFiscalYear } from '../utils/nepaliCalendar';
import { exportSalesBillsToCSV } from '../utils/csvExport';
import { exportSalesBillsToExcel } from '../utils/excelExport';

interface SalesBillsProps {
  selectedYear: number;
  selectedMonth: number;
  salesBills: SalesBill[];
  onAddBill: () => void;
  onEditBill: (bill: SalesBill) => void;
  onDeleteBill: (id: string) => void;
  onViewBill: (bill: SalesBill) => void;
  onPrintInvoice?: (bill: SalesBill) => void;
  onOpenDropdownManager?: () => void;
  onAddParty?: () => void;
}

export const SalesBills: React.FC<SalesBillsProps> = ({
  selectedYear,
  selectedMonth,
  salesBills,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onViewBill,
  onPrintInvoice,
  onOpenDropdownManager,
  onAddParty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const currentFY = getFiscalYear(selectedYear, selectedMonth);

  // Month filtered bills vs Year filtered bills
  const baseBills =
    period === 'yearly'
      ? salesBills.filter((b) => b.bsYear === selectedYear || b.fiscalYear === currentFY)
      : salesBills.filter((b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth);

  // Search and Category filtered bills
  const filteredBills = baseBills.filter((b) => {
    const matchesSearch =
      !searchTerm.trim() ||
      b.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vatNo && b.vatNo.includes(searchTerm)) ||
      (b.partyName && b.partyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || b.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalBeforeVat = filteredBills.reduce((acc, b) => acc + b.beforeVat, 0);
  const totalVat = filteredBills.reduce((acc, b) => acc + b.vat, 0);
  const totalAfterVat = filteredBills.reduce((acc, b) => acc + b.afterVat, 0);

  const currentMonthName = NEPALI_MONTHS.find((m) => m.index === selectedMonth)?.name || '';

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteBill(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Category badge helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Full Truck Load (FTL)':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Container Haulage':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Less than Truckload (LTL)':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Machinery Transport':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // VAT Type badge helper
  const getVatTypeBadgeClass = (vatType: VatType) => {
    switch (vatType) {
      case 'Taxable':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Exempt':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Zero-Rated':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4" id="sales-bills-section">
      {/* Top Action & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-64 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="search-sales-input"
              placeholder="Search Buyer, Invoice No., PAN, Party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50/50"
            />
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Toggle: Monthly vs Yearly */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                period === 'monthly'
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Monthly ({currentMonthName})</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                period === 'yearly'
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Yearly ({selectedYear})</span>
            </button>
          </div>

          {filteredBills.length > 0 && (
            <button
              onClick={() => onViewBill(filteredBills[0])}
              id="btn-excel-view-sales-all"
              className="flex items-center gap-1.5 px-3 py-2 border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title={period === 'yearly' ? 'View all yearly rows in Excel format' : 'View all monthly rows in Excel format'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Excel View</span>
            </button>
          )}

          <div className="flex items-center rounded-md border border-emerald-300 bg-emerald-50/80 overflow-hidden shadow-2xs">
            <button
              onClick={() => exportSalesBillsToExcel(filteredBills, selectedYear, selectedMonth, period)}
              disabled={filteredBills.length === 0}
              id="btn-export-sales-excel"
              className="flex items-center gap-1.5 px-3 py-2 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs sm:text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Export formatted Excel (.xlsx) spreadsheet with centered data & bold highlighted headings"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Excel</span>
            </button>
            <div className="w-[1px] h-5 bg-emerald-300"></div>
            <button
              onClick={() => exportSalesBillsToCSV(filteredBills, selectedYear, selectedMonth)}
              disabled={filteredBills.length === 0}
              id="btn-export-sales-csv"
              className="flex items-center gap-1 px-2.5 py-2 text-emerald-800 hover:bg-emerald-100 font-medium text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Export plain CSV file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>CSV</span>
            </button>
          </div>

          {onOpenDropdownManager && (
            <button
              onClick={onOpenDropdownManager}
              id="btn-open-dropdown-manager"
              className="flex items-center gap-1.5 px-3 py-2 border border-teal-300 bg-teal-50/90 hover:bg-teal-100 text-teal-800 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Add or delete dropdown options (Category, VAT Type, Payment Type)"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-700" />
              <span>Add Dropdown</span>
            </button>
          )}

          {onAddParty && (
            <button
              onClick={onAddParty}
              id="btn-add-party-from-sales"
              className="flex items-center gap-1.5 px-3 py-2 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Register new Party / Buyer / Client"
            >
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>Add Party</span>
            </button>
          )}

          <button
            onClick={onAddBill}
            id="btn-add-new-sales"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sales Bill</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sales Register (बिक्री खाता) —{' '}
              {period === 'yearly'
                ? `Full Year ${selectedYear} B.S. (FY ${currentFY})`
                : `${currentMonthName} ${selectedYear} B.S.`}
            </h3>
            <p className="text-xs text-slate-500">
              Tax invoices issued for freight carriage, container transport, and logistics
            </p>
          </div>
          <span className="text-xs bg-slate-200/70 text-slate-700 font-mono px-2 py-0.5 rounded font-medium">
            {filteredBills.length} {filteredBills.length === 1 ? 'Invoice' : 'Invoices'}
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              {baseBills.length === 0
                ? period === 'yearly'
                  ? `No sales invoices recorded for Year ${selectedYear}`
                  : `No sales invoices recorded for ${currentMonthName} ${selectedYear}`
                : 'No sales invoices match your search filter'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {baseBills.length === 0
                ? 'Click "Add Sales Bill" to generate tax invoices for corporate clients and freight consignments.'
                : 'Try adjusting your search terms or clearing the filter.'}
            </p>
            {baseBills.length === 0 && (
              <button
                onClick={onAddBill}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Sales Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" id="sales-bills-table">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12">S.N.</th>
                  <th className="py-3 px-3 whitespace-nowrap">Date (BS)</th>
                  <th className="py-3 px-3 whitespace-nowrap">Invoice No.</th>
                  <th className="py-3 px-3">Buyer's Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">VAT No.</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Before VAT</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">VAT (13%)</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">After VAT</th>
                  <th className="py-3 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 whitespace-nowrap">Party Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">VAT Type</th>
                  <th className="py-3 px-3 whitespace-nowrap">Payment</th>
                  <th className="py-3 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredBills.map((bill, index) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Auto-increment S.N. based on row order */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap text-slate-700">
                      {bill.dateBS}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-teal-800 whitespace-nowrap">
                      {bill.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {bill.buyerName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {bill.vatNo || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {formatNPR(bill.beforeVat)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-medium">
                      {formatNPR(bill.vat)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNPR(bill.afterVat)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getCategoryBadgeClass(
                          bill.category
                        )}`}
                      >
                        {bill.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {bill.partyName || '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getVatTypeBadgeClass(
                          bill.vatType
                        )}`}
                      >
                        {bill.vatType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                      {bill.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewBill(bill)}
                          id={`btn-view-sb-${bill.id}`}
                          className="px-2 py-1 rounded text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="View details in Excel format (Image 2)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onEditBill(bill)}
                          id={`btn-edit-sb-${bill.id}`}
                          className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(bill.id)}
                          id={`btn-delete-sb-${bill.id}`}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Row */}
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                    Monthly Sales Total ({filteredBills.length} invoices):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm">
                    {formatNPR(totalBeforeVat)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                    {formatNPR(totalVat)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-slate-950">
                    {formatNPR(totalAfterVat)}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Confirm Invoice Deletion</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this sales invoice record? Note that under IRD regulations, sales invoices should only be cancelled or credited if voided.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
