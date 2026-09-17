import React from 'react';
import { Truck, ShieldCheck, Download, Upload, RefreshCw, FileText, UserPlus } from 'lucide-react';
import { COMPANY_INFO } from '../utils/storage';

interface HeaderProps {
  onOpenBackup: () => void;
  fiscalYear: string;
  onOpenAddParty?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBackup, fiscalYear, onOpenAddParty }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  ADO Transport
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30">
                  VAT Billing System
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {COMPANY_INFO.tradeName} | PAN: <span className="font-mono text-slate-200">{COMPANY_INFO.panVatNo}</span>
              </p>
            </div>
          </div>

          {/* Right side info & Actions */}
          <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto text-xs">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>IRD Compliant (13% VAT)</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium">
              <span className="text-slate-400">Current FY:</span>
              <span className="font-mono text-teal-300 font-semibold">{fiscalYear}</span>
            </div>

            {onOpenAddParty && (
              <button
                onClick={onOpenAddParty}
                id="header-add-party-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors cursor-pointer shadow-xs"
                title="Register new Party / Buyer / Client"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Party / Client</span>
              </button>
            )}

            <button
              onClick={onOpenBackup}
              id="header-backup-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Backup & Restore Data"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Data Backup</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
