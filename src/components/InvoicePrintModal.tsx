import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import { SalesBill } from '../types';
import { COMPANY_INFO } from '../utils/storage';
import { formatNPR, numberToWordsRupees } from '../utils/nepaliCalendar';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: SalesBill | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const amountInWords = numberToWordsRupees(bill.afterVat);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      id="modal-tax-invoice-backdrop"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold">
              Official Tax Invoice Preview — #{bill.invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-tax-invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handlePrint}
              id="btn-download-pdf-invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
              title="Prints to PDF via browser print dialog"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              id="btn-cancel-tax-invoice-top"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-900/40 hover:bg-rose-800 border border-rose-700 text-rose-200 hover:text-white rounded-md text-xs font-semibold transition-colors cursor-pointer ml-1"
              title="Cancel and close invoice preview (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Cancel / Close</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          ref={printAreaRef}
          id="tax-invoice-printable"
          className="p-8 sm:p-10 bg-white text-slate-900 max-w-full text-xs font-sans select-text"
        >
          {/* Header & Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-teal-800 flex items-center justify-center text-white print:border print:border-slate-800">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {COMPANY_INFO.name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-600">
                      {COMPANY_INFO.tradeName}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                  {COMPANY_INFO.address}
                </p>
                <p className="text-[11px] text-slate-600">
                  Tel: {COMPANY_INFO.phone} | Email: {COMPANY_INFO.email}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block border-2 border-slate-900 px-3 py-1 bg-slate-50 text-slate-900 font-black text-sm uppercase tracking-wider mb-1">
                  TAX INVOICE / कर बीजक
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  PAN/VAT No: <span className="text-sm font-black underline">{COMPANY_INFO.panVatNo}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Registered at {COMPANY_INFO.vatOffice}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded p-3 mb-4 bg-slate-50/50">
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Billed To (Customer):
              </div>
              <div className="text-sm font-black text-slate-900">
                {bill.buyerName}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Address: {bill.buyerAddress || 'Kathmandu / Nepal'}
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                Buyer's PAN/VAT: <span className="font-mono underline">{bill.vatNo || 'Not Provided'}</span>
              </div>
              {bill.partyName && bill.partyName !== bill.buyerName && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Consignor / Terminal: {bill.partyName}
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500 font-medium">Invoice No:</span>
                <span className="font-mono font-black text-slate-900 text-sm">#{bill.invoiceNo}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500 font-medium">Transaction Date (BS):</span>
                <span className="font-mono font-bold text-slate-900">{bill.dateBS} B.S.</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500 font-medium">Fiscal Year:</span>
                <span className="font-mono font-bold text-slate-900">{bill.fiscalYear}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-semibold text-slate-900">{bill.paymentMethod}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="text-slate-500 font-medium">Service Nature:</span>
                <span className="font-medium text-slate-800">{bill.category}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full border-collapse border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
                <th className="border border-slate-300 p-2 text-center w-10">S.N.</th>
                <th className="border border-slate-300 p-2 text-left">Particulars / Description of Transport Service</th>
                <th className="border border-slate-300 p-2 text-right w-24">Category</th>
                <th className="border border-slate-300 p-2 text-right w-28">Taxable Amt (Rs.)</th>
                <th className="border border-slate-300 p-2 text-center w-20">VAT Rate</th>
                <th className="border border-slate-300 p-2 text-right w-28">VAT Amt (Rs.)</th>
                <th className="border border-slate-300 p-2 text-right w-32">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-center font-mono">1</td>
                <td className="border border-slate-300 p-2">
                  <div className="font-bold text-slate-900">
                    {bill.itemDescription || `${bill.category} Freight Service`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Carrier: ADO Transport Fleet • Safe Transit & Cargo Handling
                  </div>
                </td>
                <td className="border border-slate-300 p-2 text-right font-medium text-slate-700">
                  {bill.category}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-medium">
                  {formatNPR(bill.beforeVat).replace('Rs. ', '')}
                </td>
                <td className="border border-slate-300 p-2 text-center font-mono">
                  {bill.vatType === 'Taxable' ? '13%' : '0%'}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-medium text-slate-800">
                  {formatNPR(bill.vat).replace('Rs. ', '')}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                  {formatNPR(bill.afterVat).replace('Rs. ', '')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-400">
                <td colSpan={3} className="border border-slate-300 p-2 text-right font-bold uppercase">
                  Sub-Total (Taxable Amount):
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                  {formatNPR(bill.beforeVat).replace('Rs. ', '')}
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold">13%</td>
                <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                  {formatNPR(bill.vat).replace('Rs. ', '')}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                  {formatNPR(bill.afterVat).replace('Rs. ', '')}
                </td>
              </tr>
              <tr className="bg-slate-100 font-black text-slate-950 text-sm">
                <td colSpan={6} className="border border-slate-300 p-2 text-right uppercase tracking-wider">
                  Grand Total (After VAT):
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono">
                  {formatNPR(bill.afterVat)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount In Words */}
          <div className="border border-slate-300 rounded p-2.5 mb-6 bg-slate-50/70">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Amount in Words:
            </div>
            <div className="text-xs font-bold text-slate-900 italic mt-0.5">
              {amountInWords}
            </div>
          </div>

          {/* Terms & Declarations */}
          <div className="text-[10px] text-slate-500 mb-8 space-y-0.5">
            <p className="font-semibold text-slate-700">Terms & Conditions:</p>
            <p>1. This Tax Invoice is generated in compliance with the Value Added Tax Act, 2052 (Nepal).</p>
            <p>2. Consignment freight charges are payable as per agreed transport credit terms.</p>
            <p>3. All disputes subject to Kathmandu / Birgunj jurisdiction.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <p className="text-xs font-semibold text-slate-800">Receiver's Signature & Stamp</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Date: ____________________</p>
            </div>

            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <p className="text-xs font-bold text-slate-900">For ADO Transport Pvt. Ltd.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Authorized Signatory / Accountant</p>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar (Hidden on Print) */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden shrink-0">
          <span className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">Esc</kbd> or click Cancel to return
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              id="btn-cancel-tax-invoice-bottom"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handlePrint}
              id="btn-print-tax-invoice-bottom"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
