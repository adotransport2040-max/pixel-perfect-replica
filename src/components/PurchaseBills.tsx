import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Eye,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { PurchaseBill } from '../types';
import { formatNPR, NEPALI_MONTHS, getFiscalYear } from '../utils/nepaliCalendar';
import { exportPurchaseBillsToCSV } from '../utils/csvExport';
import { exportPurchaseBillsToExcel } from '../utils/excelExport';

interface PurchaseBillsProps {
  selectedYear: number;
  selectedMonth: number;
  purchaseBills: PurchaseBill[];
  onAddBill: () => void;
  onEditBill: (bill: PurchaseBill) => void;
  onDeleteBill: (id: string) => void;
  onViewBill: (bill: PurchaseBill) => void;
  onAddParty?: () => void;
}

export const PurchaseBills: React.FC<PurchaseBillsProps> = ({
  selectedYear,
  selectedMonth,
  purchaseBills,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onViewBill,
  onAddParty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const currentFY = getFiscalYear(selectedYear, selectedMonth);

  // Month filtered bills vs Year filtered bills
  const baseBills =
    period === 'yearly'
      ? purchaseBills.filter((b) => b.bsYear === selectedYear || b.fiscalYear === currentFY)
      : purchaseBills.filter((b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth);

  // Search filtered bills
  const filteredBills = baseBills.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.partyName.toLowerCase().includes(term) ||
      b.invoiceNo.toLowerCase().includes(term) ||
      (b.vatNo && b.vatNo.includes(term)) ||
      (b.billsDescription && b.billsDescription.toLowerCase().includes(term))
    );
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

  return (
    <div className="space-y-4" id="purchase-bills-section">
      {/* Top Action & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="search-purchase-input"
              placeholder="Search by Party Name, Invoice No., VAT..."
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
              id="btn-excel-view-purchase-all"
              className="flex items-center gap-1.5 px-3 py-2 border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title={period === 'yearly' ? 'View all yearly rows in Excel format' : 'View all monthly rows in Excel format'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Excel View</span>
            </button>
          )}

          <div className="flex items-center rounded-md border border-emerald-300 bg-emerald-50/80 overflow-hidden shadow-2xs">
            <button
              onClick={() => exportPurchaseBillsToExcel(filteredBills, selectedYear, selectedMonth, period)}
              disabled={filteredBills.length === 0}
              id="btn-export-purchase-excel"
              className="flex items-center gap-1.5 px-3 py-2 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs sm:text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Export formatted Excel (.xlsx) spreadsheet with centered data & bold highlighted headings"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export Excel</span>
            </button>
            <div className="w-[1px] h-5 bg-emerald-300"></div>
            <button
              onClick={() => exportPurchaseBillsToCSV(filteredBills, selectedYear, selectedMonth)}
              disabled={filteredBills.length === 0}
              id="btn-export-purchase-csv"
              className="flex items-center gap-1 px-2.5 py-2 text-emerald-800 hover:bg-emerald-100 font-medium text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Export plain CSV file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>CSV</span>
            </button>
          </div>

          {onAddParty && (
            <button
              onClick={onAddParty}
              id="btn-add-party-from-purchase"
              className="flex items-center gap-1.5 px-3 py-2 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Register new Party / Vendor / Supplier"
            >
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>Add Party</span>
            </button>
          )}

          <button
            onClick={onAddBill}
            id="btn-add-new-purchase"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Purchase Register (खरीद खाता) —{' '}
              {period === 'yearly'
                ? `Full Year ${selectedYear} B.S. (FY ${currentFY})`
                : `${currentMonthName} ${selectedYear} B.S.`}
            </h3>
            <p className="text-xs text-slate-500">
              All input invoices recorded for fleet maintenance, fuel, and transport operations
            </p>
          </div>
          <span className="text-xs bg-slate-200/70 text-slate-700 font-mono px-2 py-0.5 rounded font-medium">
            {filteredBills.length} {filteredBills.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              {baseBills.length === 0
                ? period === 'yearly'
                  ? `No purchase bills recorded for Year ${selectedYear}`
                  : `No purchase bills recorded for ${currentMonthName} ${selectedYear}`
                : 'No purchase bills match your search filter'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {baseBills.length === 0
                ? 'Click "Add Purchase Bill" to record invoices from fuel pumps, spare part suppliers, or repair workshops.'
                : 'Try adjusting your search terms or clearing the search field.'}
            </p>
            {baseBills.length === 0 && (
              <button
                onClick={onAddBill}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Purchase Bill</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" id="purchase-bills-table">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12">S.N.</th>
                  <th className="py-3 px-3 whitespace-nowrap">Date (BS)</th>
                  <th className="py-3 px-3 whitespace-nowrap">Invoice No.</th>
                  <th className="py-3 px-3">Party Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">VAT No.</th>
                  <th className="py-3 px-3 whitespace-nowrap">PAN</th>
                  <th className="py-3 px-3 min-w-40">Bills (Reference / Description)</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Before VAT</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">VAT (13%)</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">After VAT</th>
                  <th className="py-3 px-3 text-center w-24">Actions</th>
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
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {bill.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {bill.partyName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {bill.vatNo || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {bill.pan || bill.vatNo || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {bill.billsDescription}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                      {formatNPR(bill.beforeVat)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-medium">
                      {formatNPR(bill.vat)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNPR(bill.afterVat)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewBill(bill)}
                          id={`btn-view-pb-${bill.id}`}
                          className="px-2 py-1 rounded text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="View details in Excel format (Image 1)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onEditBill(bill)}
                          id={`btn-edit-pb-${bill.id}`}
                          className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                          title="Edit Bill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(bill.id)}
                          id={`btn-delete-pb-${bill.id}`}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Bill"
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
                  <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                    Monthly Total ({filteredBills.length} bills):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm">
                    {formatNPR(totalBeforeVat)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-blue-800">
                    {formatNPR(totalVat)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-slate-950">
                    {formatNPR(totalAfterVat)}
                  </td>
                  <td></td>
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
              <h4 className="text-base font-bold text-slate-900">Confirm Bill Deletion</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this purchase bill record? This action will update monthly totals and VAT calculations.
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
                Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
