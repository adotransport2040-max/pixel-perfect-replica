/**
 * ADO Transport — VAT Billing System
 * Bikram Sambat (BS) VAT Billing and Accounting Application
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, BillType, PurchaseBill, SalesBill, PartyRecord, DropdownSettings } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MonthYearFilter } from './components/MonthYearFilter';
import { Dashboard } from './components/Dashboard';
import { PurchaseBills } from './components/PurchaseBills';
import { SalesBills } from './components/SalesBills';
import { VatReturnReport } from './components/VatReturnReport';
import { PartyLedger } from './components/PartyLedger';
import { BillFormModal } from './components/BillFormModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { BackupModal } from './components/BackupModal';
import { ExcelViewModal } from './components/ExcelViewModal';
import { DropdownSettingsModal } from './components/DropdownSettingsModal';
import { AddPartyModal } from './components/AddPartyModal';
import {
  loadInitialYearMonth,
  saveActiveYearMonth,
  DEFAULT_DROPDOWN_SETTINGS,
  COMPANY_INFO,
} from './utils/storage';
import {
  fetchAllCloudData,
  savePurchaseToCloud,
  saveSalesToCloud,
  deletePurchaseFromCloud,
  deleteSalesFromCloud,
  savePartyToCloud,
  saveSettingsToCloud,
  deleteAllCloudData,
  replaceAllCloudData,
} from './utils/cloudStorage';
import { getFiscalYear } from './utils/nepaliCalendar';

interface AppProps {
  userEmail?: string;
  onSignOut?: () => void;
}

export default function App({ userEmail, onSignOut }: AppProps = {}) {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Accounting Period in Bikram Sambat (BS)
  const initialYM = loadInitialYearMonth();
  const [selectedYear, setSelectedYear] = useState<number>(initialYM.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialYM.month);

  // Main Data Collections (stored permanently in the cloud database)
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [knownParties, setKnownParties] = useState<PartyRecord[]>([]);
  const [dropdownSettings, setDropdownSettings] =
    useState<DropdownSettings>(DEFAULT_DROPDOWN_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const reportError = (err: unknown) => {
    console.error(err);
    setDataError(
      err instanceof Error ? err.message : 'Could not save to the cloud. Please try again.'
    );
  };

  // Initial load from the cloud database
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await fetchAllCloudData();
        if (cancelled) return;
        setPurchaseBills(snapshot.purchases);
        setSalesBills(snapshot.sales);
        setKnownParties(snapshot.parties);
        setDropdownSettings(snapshot.settings);
      } catch (err) {
        if (!cancelled) reportError(err);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<BillType>('purchase');
  const [editingBill, setEditingBill] = useState<PurchaseBill | SalesBill | null>(null);

  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);
  const [printingSalesBill, setPrintingSalesBill] = useState<SalesBill | null>(null);

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isDropdownSettingsOpen, setIsDropdownSettingsOpen] = useState(false);

  // Excel Format Detail View Modal State
  const [isExcelViewOpen, setIsExcelViewOpen] = useState(false);
  const [excelViewType, setExcelViewType] = useState<'purchase' | 'sales'>('purchase');
  const [viewingBill, setViewingBill] = useState<PurchaseBill | SalesBill | null>(null);
  const [excelInitialPeriod, setExcelInitialPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [excelInitialParty, setExcelInitialParty] = useState<string>('');

  // Add Party Modal State
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [addPartyType, setAddPartyType] = useState<'buyer' | 'supplier' | 'both'>('buyer');

  const handleOpenAddParty = (type: 'buyer' | 'supplier' | 'both' = 'buyer') => {
    setAddPartyType(type);
    setIsAddPartyOpen(true);
  };

  const handleSaveNewParty = (party: PartyRecord) => {
    handleUpdatePartyDirectory(party);
    setIsAddPartyOpen(false);
  };

  const handleGenerateYearlyBillFromLedger = (partyName: string, type: 'sales' | 'purchase') => {
    setExcelViewType(type);
    setExcelInitialPeriod('yearly');
    setExcelInitialParty(partyName);
    setViewingBill(null);
    setIsExcelViewOpen(true);
  };

  const handleSaveDropdownSettings = (newSettings: DropdownSettings) => {
    setDropdownSettings(newSettings);
    saveSettingsToCloud(newSettings).catch(reportError);
  };

  const handleViewPurchaseExcel = (bill: PurchaseBill) => {
    setExcelViewType('purchase');
    setViewingBill(bill);
    setExcelInitialPeriod('monthly');
    setExcelInitialParty('');
    setIsExcelViewOpen(true);
  };

  const handleViewSalesExcel = (bill: SalesBill) => {
    setExcelViewType('sales');
    setViewingBill(bill);
    setExcelInitialPeriod('monthly');
    setExcelInitialParty('');
    setIsExcelViewOpen(true);
  };


  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    saveActiveYearMonth(year, selectedMonth);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    saveActiveYearMonth(selectedYear, month);
  };

  // Open Add Bill Modal
  const handleOpenAddBill = (type: BillType) => {
    setFormType(type);
    setEditingBill(null);
    setIsFormOpen(true);
  };

  // Open Edit Bill Modal
  const handleOpenEditBill = (bill: PurchaseBill | SalesBill, type: BillType) => {
    setFormType(type);
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  // Save Purchase Bill
  const handleSavePurchase = (bill: PurchaseBill, isNew: boolean) => {
    if (isNew) {
      setPurchaseBills((prev) => [bill, ...prev]);
    } else {
      setPurchaseBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    }
  };

  // Save Sales Bill
  const handleSaveSales = (bill: SalesBill, isNew: boolean) => {
    if (isNew) {
      setSalesBills((prev) => [bill, ...prev]);
    } else {
      setSalesBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    }
  };

  // Delete Purchase Bill
  const handleDeletePurchase = (id: string) => {
    setPurchaseBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Delete Sales Bill
  const handleDeleteSales = (id: string) => {
    setSalesBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Update Party directory for autocompletion
  const handleUpdatePartyDirectory = (newParty: PartyRecord) => {
    setKnownParties((prev) => {
      const idx = prev.findIndex(
        (p) => p.name.trim().toLowerCase() === newParty.name.trim().toLowerCase()
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newParty };
        return updated;
      }
      return [newParty, ...prev];
    });
  };

  // Open Invoice Print Modal
  const handlePrintInvoice = (bill: SalesBill) => {
    setPrintingSalesBill(bill);
    setIsInvoicePrintOpen(true);
  };

  // Restore backup handler
  const handleDataRestored = (data: {
    purchases: PurchaseBill[];
    sales: SalesBill[];
    parties: PartyRecord[];
  }) => {
    setPurchaseBills(data.purchases);
    setSalesBills(data.sales);
    setKnownParties(data.parties);
  };

  const currentFY = getFiscalYear(selectedYear, selectedMonth);

  // Filter count for current month
  const currentMonthPurchases = purchaseBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );
  const currentMonthSales = salesBills.filter(
    (b) => b.bsYear === selectedYear && b.bsMonth === selectedMonth
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        onOpenBackup={() => setIsBackupOpen(true)}
        fiscalYear={currentFY}
        onOpenAddParty={() => handleOpenAddParty('buyer')}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        purchaseCount={currentMonthPurchases.length}
        salesCount={currentMonthSales.length}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Month & Year BS Scoping Filter (shared across all main accounting views) */}
        {activeTab !== 'party-ledger' && (
          <MonthYearFilter
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            purchaseBills={purchaseBills}
            salesBills={salesBills}
            onOpenAddBill={handleOpenAddBill}
            onNavigateToTab={setActiveTab}
            onViewInvoice={handlePrintInvoice}
          />
        )}

        {/* Tab 2: Purchase Bills */}
        {activeTab === 'purchase' && (
          <PurchaseBills
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            purchaseBills={purchaseBills}
            onAddBill={() => handleOpenAddBill('purchase')}
            onEditBill={(b) => handleOpenEditBill(b, 'purchase')}
            onDeleteBill={handleDeletePurchase}
            onViewBill={handleViewPurchaseExcel}
            onAddParty={() => handleOpenAddParty('supplier')}
          />
        )}

        {/* Tab 3: Sales Bills */}
        {activeTab === 'sales' && (
          <SalesBills
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            salesBills={salesBills}
            onAddBill={() => handleOpenAddBill('sales')}
            onEditBill={(b) => handleOpenEditBill(b, 'sales')}
            onDeleteBill={handleDeleteSales}
            onViewBill={handleViewSalesExcel}
            onPrintInvoice={handlePrintInvoice}
            onOpenDropdownManager={() => setIsDropdownSettingsOpen(true)}
            onAddParty={() => handleOpenAddParty('buyer')}
          />
        )}

        {/* Tab 4: Monthly VAT Return Report (IRD layout) */}
        {activeTab === 'vat-return' && (
          <VatReturnReport
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            purchaseBills={purchaseBills}
            salesBills={salesBills}
          />
        )}

        {/* Tab 5: Party Ledger */}
        {activeTab === 'party-ledger' && (
          <PartyLedger
            purchaseBills={purchaseBills}
            salesBills={salesBills}
            knownParties={knownParties}
            onViewInvoice={handlePrintInvoice}
            onGenerateYearlyBill={handleGenerateYearlyBillFromLedger}
            onAddParty={() => handleOpenAddParty('both')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">{COMPANY_INFO.name}</span> — VAT Billing & Transport Accounting Software
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Compliant with Inland Revenue Department (IRD) Nepal • VAT Act 2052 (13%)
          </div>
        </div>
      </footer>

      {/* Add / Edit Bill Modal */}
      <BillFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        type={formType}
        editingBill={editingBill}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        existingPurchaseBills={purchaseBills}
        existingSalesBills={salesBills}
        knownParties={knownParties}
        dropdownSettings={dropdownSettings}
        onOpenDropdownManager={() => setIsDropdownSettingsOpen(true)}
        onSavePurchase={handleSavePurchase}
        onSaveSales={handleSaveSales}
        onUpdatePartyDirectory={handleUpdatePartyDirectory}
      />

      {/* Dropdown Options Manager Modal */}
      <DropdownSettingsModal
        isOpen={isDropdownSettingsOpen}
        onClose={() => setIsDropdownSettingsOpen(false)}
        settings={dropdownSettings}
        onSave={handleSaveDropdownSettings}
        onSaveSettings={handleSaveDropdownSettings}
      />

      {/* Official Printable Tax Invoice Modal */}
      <InvoicePrintModal
        isOpen={isInvoicePrintOpen}
        onClose={() => setIsInvoicePrintOpen(false)}
        bill={printingSalesBill}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        purchaseBills={purchaseBills}
        salesBills={salesBills}
        knownParties={knownParties}
        onDataRestored={handleDataRestored}
      />

      {/* Excel Format Table View Modal (Exact layouts as in Image 1 & Image 2) */}
      <ExcelViewModal
        isOpen={isExcelViewOpen}
        onClose={() => setIsExcelViewOpen(false)}
        type={excelViewType}
        selectedBill={viewingBill}
        allMonthPurchases={currentMonthPurchases}
        allMonthSales={currentMonthSales}
        allPurchases={purchaseBills}
        allSales={salesBills}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        initialPeriod={excelInitialPeriod}
        initialParty={excelInitialParty}
        onOpenTaxInvoice={handlePrintInvoice}
      />

      {/* Add Party / Buyer / Client Modal */}
      <AddPartyModal
        isOpen={isAddPartyOpen}
        onClose={() => setIsAddPartyOpen(false)}
        onSaveParty={handleSaveNewParty}
        initialType={addPartyType}
        existingParties={knownParties}
      />
    </div>
  );
}
