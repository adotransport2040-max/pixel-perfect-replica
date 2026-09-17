import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Printer,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Check,
  X,
  FileSpreadsheet,
  Plus,
  CreditCard,
} from 'lucide-react';
import { PurchaseBill, SalesBill, PartyRecord } from '../types';
import { formatNPR } from '../utils/nepaliCalendar';

interface PartyLedgerProps {
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  knownParties: PartyRecord[];
  onViewInvoice: (bill: SalesBill) => void;
  onGenerateYearlyBill?: (partyName: string, type: 'sales' | 'purchase') => void;
  onAddParty?: () => void;
}

export const PartyLedger: React.FC<PartyLedgerProps> = ({
  purchaseBills,
  salesBills,
  knownParties,
  onViewInvoice,
  onGenerateYearlyBill,
  onAddParty,
}) => {
  // Aggregate all unique party names from bills and knownParties
  const allPartyNames = useMemo(() => {
    const set = new Set<string>();
    knownParties.forEach((p) => p.name && set.add(p.name.trim()));
    purchaseBills.forEach((b) => b.partyName && set.add(b.partyName.trim()));
    salesBills.forEach((b) => {
      if (b.buyerName) set.add(b.buyerName.trim());
      if (b.partyName) set.add(b.partyName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [purchaseBills, salesBills, knownParties]);

  const [selectedParty, setSelectedParty] = useState<string>(
    allPartyNames.length > 0 ? allPartyNames[0] : ''
  );
  const [filterFY, setFilterFY] = useState<string>('ALL');

  // Searchable party combobox state
  const [searchQuery, setSearchQuery] = useState(allPartyNames.length > 0 ? allPartyNames[0] : '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery when selectedParty updates
  useEffect(() => {
    if (selectedParty) {
      setSearchQuery(selectedParty);
    }
  }, [selectedParty]);

  // Click outside to close combobox
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        // If input does not match selectedParty, revert to selectedParty or exact match
        if (searchQuery.trim().toLowerCase() !== selectedParty.toLowerCase()) {
          const match = allPartyNames.find((p) => p.toLowerCase() === searchQuery.trim().toLowerCase());
          if (match) {
            setSelectedParty(match);
            setSearchQuery(match);
          } else {
            setSearchQuery(selectedParty);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [comboboxRef, searchQuery, selectedParty, allPartyNames]);

  // Filtered party list based on typed query
  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return allPartyNames;
    const q = searchQuery.toLowerCase().trim();
    return allPartyNames.filter((name) => name.toLowerCase().includes(q));
  }, [allPartyNames, searchQuery]);

  const handleSelectParty = (name: string) => {
    setSelectedParty(name);
    setSearchQuery(name);
    setIsDropdownOpen(false);
  };

  // Party info from directory
  const partyInfo = useMemo(() => {
    return knownParties.find((p) => p.name.toLowerCase() === selectedParty.toLowerCase());
  }, [selectedParty, knownParties]);

  // Transactions linked to selected party
  const transactions = useMemo(() => {
    if (!selectedParty) return [];
    const target = selectedParty.toLowerCase();

    const list: Array<{
      id: string;
      dateBS: string;
      fiscalYear: string;
      invoiceNo: string;
      type: 'Sales' | 'Purchase';
      description: string;
      beforeVat: number;
      vat: number;
      afterVat: number;
      paymentMethod?: string;
      rawSale?: SalesBill;
    }> = [];

    // Sales where party is buyerName or partyName
    salesBills.forEach((s) => {
      if (
        s.buyerName.toLowerCase() === target ||
        (s.partyName && s.partyName.toLowerCase() === target)
      ) {
        list.push({
          id: s.id,
          dateBS: s.dateBS,
          fiscalYear: s.fiscalYear,
          invoiceNo: s.invoiceNo,
          type: 'Sales',
          description: s.itemDescription || `${s.category} Freight Service`,
          beforeVat: s.beforeVat,
          vat: s.vat,
          afterVat: s.afterVat,
          paymentMethod: s.paymentMethod,
          rawSale: s,
        });
      }
    });

    // Purchases where party is partyName
    purchaseBills.forEach((p) => {
      if (p.partyName.toLowerCase() === target) {
        list.push({
          id: p.id,
          dateBS: p.dateBS,
          fiscalYear: p.fiscalYear,
          invoiceNo: p.invoiceNo,
          type: 'Purchase',
          description: p.billsDescription || 'Fleet maintenance / supplies',
          beforeVat: p.beforeVat,
          vat: p.vat,
          afterVat: p.afterVat,
        });
      }
    });

    // Sort chronologically
    list.sort((a, b) => b.dateBS.localeCompare(a.dateBS));

    if (filterFY === 'ALL') return list;
    return list.filter((t) => t.fiscalYear === filterFY);
  }, [selectedParty, salesBills, purchaseBills, filterFY]);

  // Aggregate stats
  const totalSalesAmount = transactions
    .filter((t) => t.type === 'Sales')
    .reduce((sum, t) => sum + t.afterVat, 0);

  const totalPurchaseAmount = transactions
    .filter((t) => t.type === 'Purchase')
    .reduce((sum, t) => sum + t.afterVat, 0);

  const totalVatTransacted = transactions.reduce((sum, t) => sum + t.vat, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!selectedParty || transactions.length === 0) return;
    const filename = `Ledger_Statement_${selectedParty.replace(/\s+/g, '_')}.csv`;
    const rows = [
      [`PARTY TRANSACTION LEDGER STATEMENT — ${selectedParty.toUpperCase()}`],
      [`PAN/VAT No: ${partyInfo?.panOrVat || 'N/A'}`],
      [`Address: ${partyInfo?.address || 'N/A'}`],
      [`Filter Fiscal Year: ${filterFY}`],
      [''],
      [
        'S.N.',
        'BS Date',
        'Fiscal Year',
        'Type',
        'Invoice / Ref No.',
        'Particulars / Description',
        'Before VAT (NPR)',
        'VAT Amount (NPR)',
        'Total Amount (NPR)',
        'Payment Method',
      ],
      ...transactions.map((t, idx) => [
        idx + 1,
        t.dateBS,
        t.fiscalYear,
        t.type,
        t.invoiceNo,
        `"${t.description.replace(/"/g, '""')}"`,
        t.beforeVat.toFixed(2),
        t.vat.toFixed(2),
        t.afterVat.toFixed(2),
        t.paymentMethod || '-',
      ]),
    ];

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\r\n');
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
    <div className="space-y-5" id="party-ledger-view">
      {/* Top Party Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <span className="text-sm font-bold text-slate-900">Select Party / Buyer:</span>
          </div>

          {/* Searchable and Typable Party/Buyer Combobox */}
          <div className="relative flex-1 max-w-md" ref={comboboxRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  const exact = allPartyNames.find(
                    (p) => p.toLowerCase() === e.target.value.trim().toLowerCase()
                  );
                  if (exact) {
                    setSelectedParty(exact);
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredParties.length > 0) {
                      handleSelectParty(filteredParties[0]);
                    }
                  } else if (e.key === 'Escape') {
                    setIsDropdownOpen(false);
                    setSearchQuery(selectedParty);
                  } else if (e.key === 'ArrowDown') {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder="Type or select Party / Buyer..."
                className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-md pl-3 pr-16 py-2 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition-all shadow-2xs"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(true);
                    }}
                    title="Clear search"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  title="Toggle party list"
                  className="p-1 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dropdown Options Popup */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg py-1">
                {filteredParties.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400 italic">
                    No matching party found for "{searchQuery}"
                  </div>
                ) : (
                  filteredParties.map((name) => {
                    const isSelected = name.toLowerCase() === selectedParty.toLowerCase();
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectParty(name)}
                        className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate pr-2">{name}</span>
                        {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Fiscal Year Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">FY:</span>
            <select
              value={filterFY}
              onChange={(e) => setFilterFY(e.target.value)}
              className="text-xs font-mono font-medium border border-slate-200 rounded px-2 py-1.5 bg-slate-50 cursor-pointer"
            >
              <option value="ALL">All Fiscal Years</option>
              <option value="2081/82">FY 2081/82</option>
              <option value="2080/81">FY 2080/81</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {onGenerateYearlyBill && selectedParty && (
            <div className="flex items-center rounded-md border border-emerald-300 bg-emerald-50 overflow-hidden text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => onGenerateYearlyBill(selectedParty, 'sales')}
                id="btn-party-yearly-sales"
                className="px-2.5 py-2 font-semibold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                title={`Generate Official Yearly Sales Bill for ${selectedParty}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Yearly Sales Bill</span>
              </button>
              <div className="w-[1px] h-5 bg-emerald-200"></div>
              <button
                type="button"
                onClick={() => onGenerateYearlyBill(selectedParty, 'purchase')}
                id="btn-party-yearly-purchase"
                className="px-2 py-2 font-semibold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                title={`Generate Official Yearly Purchase Bill for ${selectedParty}`}
              >
                <span>Purchase</span>
              </button>
            </div>
          )}

          {onAddParty && (
            <button
              type="button"
              onClick={onAddParty}
              id="btn-party-ledger-add-party"
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              title="Add new Party / Buyer / Client"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Party</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            id="btn-export-ledger-csv"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={transactions.length === 0}
            id="btn-print-ledger"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Party Profile Banner */}
      {selectedParty && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {selectedParty}
                  </h3>
                  {partyInfo?.type && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {partyInfo.type === 'both' ? 'Buyer & Vendor' : partyInfo.type}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  {partyInfo?.panOrVat && (
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                      PAN/VAT: {partyInfo.panOrVat}
                    </span>
                  )}
                  {partyInfo?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {partyInfo.address}
                    </span>
                  )}
                  {partyInfo?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {partyInfo.phone}
                    </span>
                  )}
                  {partyInfo?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {partyInfo.email}
                    </span>
                  )}
                  {partyInfo?.contactPerson && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {partyInfo.contactPerson}
                    </span>
                  )}
                  {partyInfo?.creditDays && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Credit: {partyInfo.creditDays} Days
                    </span>
                  )}
                </div>
                {partyInfo?.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Note: {partyInfo.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-md bg-teal-50 border border-teal-200 text-xs text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Sales Invoiced</span>
                <span className="font-mono font-bold text-teal-900 text-sm">
                  {formatNPR(totalSalesAmount)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Purchases</span>
                <span className="font-mono font-bold text-blue-900 text-sm">
                  {formatNPR(totalPurchaseAmount)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total VAT Transacted</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatNPR(totalVatTransacted)}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No transactions recorded for {selectedParty} in the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="party-ledger-table">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12">S.N.</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date (BS)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Fiscal Year</th>
                    <th className="py-2.5 px-3 text-center w-24">Nature</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Invoice / Ref No.</th>
                    <th className="py-2.5 px-3 min-w-44">Particulars</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Before VAT</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">VAT (13%)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Amount</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {transactions.map((txn, index) => (
                    <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap text-slate-700">
                        {txn.dateBS}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {txn.fiscalYear}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            txn.type === 'Sales'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {txn.invoiceNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{txn.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNPR(txn.beforeVat)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {formatNPR(txn.vat)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNPR(txn.afterVat)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {txn.rawSale && (
                          <button
                            onClick={() => onViewInvoice(txn.rawSale!)}
                            className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                          >
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedParty && (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Parties or Clients Registered Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add parties or record purchase/sales bills to start tracking individual client ledgers, yearly bills, and VAT summaries.
          </p>
          {onAddParty && (
            <button
              onClick={onAddParty}
              id="btn-ledger-add-first-party"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Party / Client</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
