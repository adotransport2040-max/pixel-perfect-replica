import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  Check,
  Calculator,
  Building,
  User,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import {
  BillType,
  PurchaseBill,
  SalesBill,
  PartyRecord,
  VatType,
  PaymentMethod,
  DropdownSettings,
} from '../types';
import {
  isValidPanVat,
  getFiscalYear,
  SALES_CATEGORIES,
  getNextInvoiceNo,
} from '../utils/nepaliCalendar';

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: BillType;
  editingBill: PurchaseBill | SalesBill | null;
  selectedYear: number;
  selectedMonth: number;
  existingPurchaseBills: PurchaseBill[];
  existingSalesBills: SalesBill[];
  knownParties: PartyRecord[];
  dropdownSettings?: DropdownSettings;
  onOpenDropdownManager?: () => void;
  onSavePurchase: (bill: PurchaseBill, isNew: boolean) => void;
  onSaveSales: (bill: SalesBill, isNew: boolean) => void;
  onUpdatePartyDirectory: (party: PartyRecord) => void;
}

export const BillFormModal: React.FC<BillFormModalProps> = ({
  isOpen,
  onClose,
  type,
  editingBill,
  selectedYear,
  selectedMonth,
  existingPurchaseBills,
  existingSalesBills,
  knownParties,
  dropdownSettings,
  onOpenDropdownManager,
  onSavePurchase,
  onSaveSales,
  onUpdatePartyDirectory,
}) => {
  const currentFY = getFiscalYear(selectedYear, selectedMonth);

  const availableCategories = dropdownSettings?.categories || SALES_CATEGORIES;
  const availableVatTypes = dropdownSettings?.vatTypes || ['Taxable', 'Exempt', 'Zero-Rated'];
  const availablePaymentTypes = dropdownSettings?.paymentTypes || [
    'Paid',
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Credit',
  ];

  // Form states
  const [dateBS, setDateBS] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [vatNo, setVatNo] = useState('');
  const [pan, setPan] = useState('');
  const [billsDescription, setBillsDescription] = useState('');
  const [category, setCategory] = useState(availableCategories[0] || 'General');
  const [vatType, setVatType] = useState<string>(availableVatTypes[0] || 'Taxable');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    availablePaymentTypes[0] || 'Bank Transfer'
  );
  const [buyerAddress, setBuyerAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  // Financial fields
  const [beforeVat, setBeforeVat] = useState<string>('');
  const [vat, setVat] = useState<string>('');
  const [afterVat, setAfterVat] = useState<string>('');

  // Autocomplete UI state
  const [partySuggestions, setPartySuggestions] = useState<PartyRecord[]>([]);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingBill) {
      setDateBS(editingBill.dateBS);
      setInvoiceNo(editingBill.invoiceNo);
      setBeforeVat(editingBill.beforeVat.toString());
      setVat(editingBill.vat.toString());
      setAfterVat(editingBill.afterVat.toString());

      if (type === 'purchase') {
        const pb = editingBill as PurchaseBill;
        setPartyName(pb.partyName);
        setVatNo(pb.vatNo || '');
        setPan(pb.pan || '');
        setBillsDescription(pb.billsDescription || '');
      } else {
        const sb = editingBill as SalesBill;
        setBuyerName(sb.buyerName);
        setPartyName(sb.partyName || '');
        setVatNo(sb.vatNo || '');
        setCategory(sb.category || availableCategories[0] || 'General');
        setVatType(sb.vatType || availableVatTypes[0] || 'Taxable');
        setPaymentMethod(sb.paymentMethod || availablePaymentTypes[0] || 'Bank Transfer');
        setBuyerAddress(sb.buyerAddress || '');
        setItemDescription(sb.itemDescription || '');
      }
    } else {
      // New Bill: Blank initial values as requested (nothing pre-filled)
      setDateBS('');
      setInvoiceNo('');

      if (type === 'purchase') {
        setPartyName('');
        setVatNo('');
        setPan('');
        setBillsDescription('');
      } else {
        setBuyerName('');
        setPartyName('');
        setVatNo('');
        setCategory(availableCategories[0] || 'General');
        setVatType(availableVatTypes[0] || 'Taxable');
        setPaymentMethod(availablePaymentTypes[0] || 'Bank Transfer');
        setBuyerAddress('');
        setItemDescription('');
      }

      setBeforeVat('');
      setVat('');
      setAfterVat('');
    }

    setErrors({});
    setDuplicateWarning(null);
  }, [isOpen, editingBill, type, selectedYear, selectedMonth, currentFY]);

  // Check for duplicate invoice in the same fiscal year
  useEffect(() => {
    if (!invoiceNo.trim()) {
      setDuplicateWarning(null);
      return;
    }

    const trimmed = invoiceNo.trim().toLowerCase();
    const currentId = editingBill?.id;

    if (type === 'purchase') {
      const duplicate = existingPurchaseBills.find(
        (b) =>
          b.id !== currentId &&
          b.fiscalYear === currentFY &&
          b.invoiceNo.trim().toLowerCase() === trimmed
      );
      if (duplicate) {
        setDuplicateWarning(
          `Notice: Invoice #${duplicate.invoiceNo} already exists in FY ${currentFY} under party "${duplicate.partyName}" (BS Date: ${duplicate.dateBS}). Please verify if this is a duplicate bill.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      const duplicate = existingSalesBills.find(
        (b) =>
          b.id !== currentId &&
          b.fiscalYear === currentFY &&
          b.invoiceNo.trim().toLowerCase() === trimmed
      );
      if (duplicate) {
        setDuplicateWarning(
          `Warning: Sales Invoice #${duplicate.invoiceNo} already exists in FY ${currentFY} issued to "${duplicate.buyerName}". Duplicate invoice numbers violate IRD rules!`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [invoiceNo, type, currentFY, editingBill, existingPurchaseBills, existingSalesBills]);

  // Handle Before VAT change -> Auto compute VAT and After VAT
  const handleBeforeVatChange = (valStr: string) => {
    setBeforeVat(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      if (type === 'sales' && (vatType === 'Exempt' || vatType === 'Zero-Rated')) {
        setVat('0');
        setAfterVat(num.toFixed(2));
      } else {
        const calculatedVat = Math.round(num * 13) / 100;
        const calculatedTotal = Math.round((num + calculatedVat) * 100) / 100;
        setVat(calculatedVat.toFixed(2));
        setAfterVat(calculatedTotal.toFixed(2));
      }
    } else {
      setVat('');
      setAfterVat('');
    }
  };

  // Allow manual override for VAT
  const handleVatChange = (valStr: string) => {
    setVat(valStr);
    const bNum = parseFloat(beforeVat) || 0;
    const vNum = parseFloat(valStr) || 0;
    const calculatedTotal = Math.round((bNum + vNum) * 100) / 100;
    setAfterVat(calculatedTotal.toFixed(2));
  };

  // Allow manual override for After VAT
  const handleAfterVatChange = (valStr: string) => {
    setAfterVat(valStr);
    const aNum = parseFloat(valStr);
    const bNum = parseFloat(beforeVat);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum >= bNum) {
      const calculatedVat = Math.round((aNum - bNum) * 100) / 100;
      setVat(calculatedVat.toFixed(2));
    }
  };

  // Handle VAT Type changes for Sales
  const handleVatTypeChange = (newType: VatType) => {
    setVatType(newType);
    const num = parseFloat(beforeVat);
    if (!isNaN(num)) {
      if (newType === 'Exempt' || newType === 'Zero-Rated') {
        setVat('0');
        setAfterVat(num.toFixed(2));
      } else {
        const calculatedVat = Math.round(num * 13) / 100;
        setVat(calculatedVat.toFixed(2));
        setAfterVat((num + calculatedVat).toFixed(2));
      }
    }
  };

  // Autocomplete search as user types party/buyer name
  const handlePartyNameInput = (inputVal: string) => {
    if (type === 'purchase') {
      setPartyName(inputVal);
    } else {
      setBuyerName(inputVal);
    }

    if (inputVal.trim().length > 0) {
      const term = inputVal.toLowerCase();
      const filtered = knownParties.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.panOrVat && p.panOrVat.includes(term))
      );
      setPartySuggestions(filtered);
      setShowPartySuggestions(filtered.length > 0);
    } else {
      setPartySuggestions([]);
      setShowPartySuggestions(false);
    }
  };

  const handleSelectPartySuggestion = (selected: PartyRecord) => {
    if (type === 'purchase') {
      setPartyName(selected.name);
      setVatNo(selected.panOrVat || '');
      setPan(selected.panOrVat || '');
    } else {
      setBuyerName(selected.name);
      setVatNo(selected.panOrVat || '');
      if (selected.address) setBuyerAddress(selected.address);
    }
    setShowPartySuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowPartySuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!dateBS.trim()) newErrors.dateBS = 'BS Date is required';
    if (!invoiceNo.trim()) newErrors.invoiceNo = 'Invoice No. is required';

    const currentPartyName = type === 'purchase' ? partyName.trim() : buyerName.trim();
    if (!currentPartyName) {
      newErrors.partyName = type === 'purchase' ? 'Party Name is required' : "Buyer's Name is required";
    }

    // 9-digit validation for VAT/PAN
    if (vatNo.trim() && !isValidPanVat(vatNo)) {
      newErrors.vatNo = 'Nepal VAT/PAN must be exactly 9 numeric digits';
    }
    if (type === 'purchase' && pan.trim() && !isValidPanVat(pan)) {
      newErrors.pan = 'PAN must be exactly 9 numeric digits';
    }

    const bVat = parseFloat(beforeVat);
    if (isNaN(bVat) || bVat < 0) {
      newErrors.beforeVat = 'Please enter a valid amount before VAT';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalBeforeVat = Math.round((parseFloat(beforeVat) || 0) * 100) / 100;
    const finalVat = Math.round((parseFloat(vat) || 0) * 100) / 100;
    const finalAfterVat = Math.round((parseFloat(afterVat) || finalBeforeVat + finalVat) * 100) / 100;

    // Save party into directory for persistent autocomplete
    const partyPan = vatNo.trim() || pan.trim();
    if (currentPartyName) {
      onUpdatePartyDirectory({
        name: currentPartyName,
        panOrVat: partyPan,
        address: buyerAddress.trim() || undefined,
        type: type === 'purchase' ? 'supplier' : 'buyer',
      });
    }

    // Determine bill year, month, and fiscal year from the entered BS Date
    let billYear = selectedYear;
    let billMonth = selectedMonth;
    const dateParts = dateBS.trim().split(/[-/.]/);
    if (dateParts.length >= 2) {
      const pY = parseInt(dateParts[0], 10);
      const pM = parseInt(dateParts[1], 10);
      if (!isNaN(pY) && pY >= 2000 && pY <= 2100) {
        billYear = pY;
      }
      if (!isNaN(pM) && pM >= 1 && pM <= 12) {
        billMonth = pM;
      }
    }
    const billFY = getFiscalYear(billYear, billMonth);

    if (type === 'purchase') {
      const billData: PurchaseBill = {
        id: editingBill ? editingBill.id : `pb-${Date.now()}`,
        dateBS: dateBS.trim(),
        bsYear: billYear,
        bsMonth: billMonth,
        fiscalYear: billFY,
        invoiceNo: invoiceNo.trim(),
        partyName: partyName.trim(),
        vatNo: vatNo.trim(),
        pan: pan.trim() || vatNo.trim(),
        billsDescription: billsDescription.trim() || 'Fleet Logistics Expense',
        beforeVat: finalBeforeVat,
        vat: finalVat,
        afterVat: finalAfterVat,
        createdAt: editingBill ? (editingBill as PurchaseBill).createdAt : new Date().toISOString(),
      };
      onSavePurchase(billData, !editingBill);
    } else {
      const billData: SalesBill = {
        id: editingBill ? editingBill.id : `sb-${Date.now()}`,
        dateBS: dateBS.trim(),
        bsYear: billYear,
        bsMonth: billMonth,
        fiscalYear: billFY,
        invoiceNo: invoiceNo.trim(),
        buyerName: buyerName.trim(),
        partyName: partyName.trim() || buyerName.trim(),
        vatNo: vatNo.trim(),
        category,
        vatType,
        paymentMethod,
        beforeVat: finalBeforeVat,
        vat: finalVat,
        afterVat: finalAfterVat,
        buyerAddress: buyerAddress.trim(),
        itemDescription: itemDescription.trim() || `${category} Cargo Consignment`,
        createdAt: editingBill ? (editingBill as SalesBill).createdAt : new Date().toISOString(),
      };
      onSaveSales(billData, !editingBill);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        id="bill-form-modal-container"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              {type === 'purchase' ? <Building className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {editingBill ? 'Edit' : 'Add New'} {type === 'purchase' ? 'Purchase Bill' : 'Sales Bill (Tax Invoice)'}
              </h3>
              <p className="text-xs text-slate-400">
                Period: <span className="font-semibold text-slate-200">{selectedYear} BS Month {selectedMonth}</span> | FY: <span className="font-mono text-teal-300">{currentFY}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Duplicate Invoice Warning Alert */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Duplicate Invoice Detected: </span>
                {duplicateWarning}
              </div>
            </div>
          )}

          {/* Row 1: Date & Invoice No. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bikram Sambat (BS) Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-bill-date"
                placeholder="YYYY-MM-DD (e.g. 2081-05-14)"
                value={dateBS}
                onChange={(e) => setDateBS(e.target.value)}
                className={`w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono ${
                  errors.dateBS ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {errors.dateBS && <p className="text-[11px] text-rose-500 mt-1">{errors.dateBS}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Invoice No. <span className="text-rose-500">*</span>
                </label>
                {type === 'sales' && !editingBill && (
                  <span className="text-[10px] text-teal-600 font-medium">Auto-generated for FY</span>
                )}
              </div>
              <input
                type="text"
                id="input-bill-invoice-no"
                placeholder={type === 'purchase' ? 'e.g. INV-9042' : 'e.g. ADO-8182-005'}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className={`w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono ${
                  errors.invoiceNo ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {errors.invoiceNo && <p className="text-[11px] text-rose-500 mt-1">{errors.invoiceNo}</p>}
            </div>
          </div>

          {/* Row 2: Party / Buyer Name with Autocomplete */}
          <div className="relative" ref={suggestionRef}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === 'purchase' ? 'Party / Supplier Name' : "Buyer's Registered Name"}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-party-name"
              placeholder={
                type === 'purchase'
                  ? 'e.g. Supplier / Vendor Company Name...'
                  : 'e.g. Buyer / Client Company Name...'
              }
              value={type === 'purchase' ? partyName : buyerName}
              onChange={(e) => handlePartyNameInput(e.target.value)}
              onFocus={() => {
                if (knownParties.length > 0) {
                  setPartySuggestions(knownParties.slice(0, 6));
                  setShowPartySuggestions(true);
                }
              }}
              autoComplete="off"
              className={`w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                errors.partyName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
            />
            {errors.partyName && <p className="text-[11px] text-rose-500 mt-1">{errors.partyName}</p>}

            {/* Suggestions Dropdown */}
            {showPartySuggestions && partySuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                <div className="p-1.5 bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Previously Entered Parties (Click to auto-fill)
                </div>
                {partySuggestions.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPartySuggestion(p)}
                    className="p-2.5 hover:bg-teal-50/70 border-b last:border-0 border-slate-100 cursor-pointer text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      {p.address && <div className="text-[11px] text-slate-400">{p.address}</div>}
                    </div>
                    {p.panOrVat && (
                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        PAN: {p.panOrVat}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: VAT No. & PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  VAT No. / PAN (9 digits)
                </label>
                <span className="text-[10px] text-slate-400">Nepal IRD Standard</span>
              </div>
              <input
                type="text"
                id="input-bill-vat-no"
                placeholder="e.g. 102938475"
                maxLength={9}
                value={vatNo}
                onChange={(e) => {
                  setVatNo(e.target.value);
                  if (type === 'purchase' && !pan) setPan(e.target.value);
                }}
                className={`w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono ${
                  errors.vatNo ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {errors.vatNo && <p className="text-[11px] text-rose-500 mt-1">{errors.vatNo}</p>}
            </div>

            {type === 'purchase' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PAN (Supplier)
                </label>
                <input
                  type="text"
                  id="input-bill-pan"
                  placeholder="e.g. 102938475"
                  maxLength={9}
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
                {errors.pan && <p className="text-[11px] text-rose-500 mt-1">{errors.pan}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Address (for Tax Invoice)
                </label>
                <input
                  type="text"
                  id="input-buyer-address"
                  placeholder="e.g. Simara, Bara / Kathmandu"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            )}
          </div>

          {/* Sales specific: Category, VAT Type, Payment Type */}
          {type === 'sales' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Classification & Payment
                </span>
                {onOpenDropdownManager && (
                  <button
                    type="button"
                    onClick={onOpenDropdownManager}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Add or delete dropdown options"
                  >
                    <span>⚙ Add / Edit Dropdowns</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Service Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    id="select-sales-category"
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    {/* Include existing category if custom */}
                    {category && !availableCategories.includes(category) && (
                      <option value={category}>{category}</option>
                    )}
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    VAT Type
                  </label>
                  <select
                    value={vatType}
                    onChange={(e) => handleVatTypeChange(e.target.value)}
                    id="select-sales-vat-type"
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-md bg-white font-medium text-slate-800 focus:ring-2 focus:ring-teal-600"
                  >
                    {vatType && !availableVatTypes.includes(vatType) && (
                      <option value={vatType}>{vatType}</option>
                    )}
                    {availableVatTypes.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Payment
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    id="select-sales-payment-type"
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    {paymentMethod && !availablePaymentTypes.includes(paymentMethod) && (
                      <option value={paymentMethod}>{paymentMethod}</option>
                    )}
                    {availablePaymentTypes.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description / Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === 'purchase' ? 'Bills (Short Reference / Goods Description)' : 'Invoice Item Particulars (Description)'}
            </label>
            <input
              type="text"
              id="input-bill-desc"
              placeholder={
                type === 'purchase'
                  ? 'e.g. Diesel fuel 1,200L, Tyres 10.00R20, Truck Repairs'
                  : 'e.g. Freight transport finished goods Simara to Kathmandu'
              }
              value={type === 'purchase' ? billsDescription : itemDescription}
              onChange={(e) =>
                type === 'purchase'
                  ? setBillsDescription(e.target.value)
                  : setItemDescription(e.target.value)
              }
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Financial Calculation Fields (Before VAT, VAT, After VAT) */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-teal-700" />
                <span>VAT Calculation (13% Standard Nepal Rate)</span>
              </span>
              <span className="text-[11px] text-teal-700">
                Auto-calculated, accountant manual override enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Before VAT */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Before VAT (NPR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    id="input-before-vat"
                    placeholder="0.00"
                    value={beforeVat}
                    onChange={(e) => handleBeforeVatChange(e.target.value)}
                    className={`w-full text-sm pl-9 pr-3 py-2 border rounded-md font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                      errors.beforeVat ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                    }`}
                  />
                </div>
                {errors.beforeVat && <p className="text-[11px] text-rose-500 mt-1">{errors.beforeVat}</p>}
              </div>

              {/* VAT Amount (13%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    VAT Amount (13%)
                  </label>
                  <span className="text-[10px] text-slate-500">Overridable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    id="input-vat-amount"
                    placeholder="0.00"
                    value={vat}
                    onChange={(e) => handleVatChange(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-md font-mono font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-teal-800"
                  />
                </div>
              </div>

              {/* After VAT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    After VAT Total (NPR)
                  </label>
                  <span className="text-[10px] text-slate-500">Overridable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    id="input-after-vat"
                    placeholder="0.00"
                    value={afterVat}
                    onChange={(e) => handleAfterVatChange(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 border border-teal-300 rounded-md font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-bill"
              className="px-5 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white rounded-md font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingBill ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
