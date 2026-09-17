import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { PurchaseBill, SalesBill, PartyRecord } from '../types';
import { exportBackupJSON, resetAllData } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  knownParties: PartyRecord[];
  onDataRestored: (data: {
    purchases: PurchaseBill[];
    sales: SalesBill[];
    parties: PartyRecord[];
  }) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  purchaseBills,
  salesBills,
  knownParties,
  onDataRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupJSON(purchaseBills, salesBills, knownParties);
    setStatusMessage({
      type: 'success',
      text: `Successfully exported ${purchaseBills.length} purchase bills and ${salesBills.length} sales bills as JSON backup.`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.purchases) && Array.isArray(parsed.sales)) {
          onDataRestored({
            purchases: parsed.purchases,
            sales: parsed.sales,
            parties: Array.isArray(parsed.parties) ? parsed.parties : knownParties,
          });
          setStatusMessage({
            type: 'success',
            text: `Backup restored successfully! Loaded ${parsed.purchases.length} purchase bills and ${parsed.sales.length} sales bills.`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Invalid backup file format. Please provide a valid ADO Transport VAT backup JSON.',
          });
        }
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: 'Error reading JSON file. Please ensure the file is not corrupted.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    const restored = resetAllData();
    onDataRestored(restored);
    setShowResetConfirm(false);
    setStatusMessage({
      type: 'success',
      text: 'All records have been cleared. The database is now completely clean with 0 records.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold">Data Backup & Migration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600">
          <p>
            Your VAT records, purchase registers, sales invoices, and party directory are persisted in local browser storage. Use these tools to safeguard your accounting books or migrate to another device.
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Backup Action Cards */}
          <div className="space-y-3">
            {/* Export JSON */}
            <div className="p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 bg-slate-50 flex items-center justify-between transition-colors">
              <div>
                <div className="font-bold text-slate-900 text-sm">Export All Data (JSON)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Download full database ({purchaseBills.length} purchases, {salesBills.length} sales)
                </div>
              </div>
              <button
                onClick={handleExport}
                id="btn-export-backup-json"
                className="px-3.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-3.5 rounded-lg border border-slate-200 hover:border-teal-300 bg-slate-50 flex items-center justify-between transition-colors">
              <div>
                <div className="font-bold text-slate-900 text-sm">Import Data from File</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Restore or merge previously exported JSON backup
                </div>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="import-backup-file-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  id="btn-trigger-import-json"
                  className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>

            {/* Clear All Records */}
            <div className="p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-rose-900 text-sm">Clear All Records (Clean Slate)</div>
                <div className="text-[11px] text-rose-600 mt-0.5">
                  Erase all purchase bills, sales invoices, and parties
                </div>
              </div>
              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 rounded text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    id="btn-confirm-reset-all"
                    className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    Confirm Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  id="btn-request-reset-all"
                  className="px-3 py-1.5 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-md font-semibold hover:bg-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
