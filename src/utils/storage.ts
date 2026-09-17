import { PurchaseBill, SalesBill, PartyRecord, DropdownSettings } from '../types';
import { getFiscalYear, getCurrentNepaliYearMonth } from './nepaliCalendar';

export const DEFAULT_DROPDOWN_SETTINGS: DropdownSettings = {
  categories: [
    'Readymade',
    'Full Truck Load (FTL)',
    'Container Haulage',
    'Less than Truckload (LTL)',
    'Raw Materials',
    'Heavy Equipment Cargo',
    'General Freight',
  ],
  vatTypes: [
    'Taxable',
    'Exempt',
    'Zero-Rated',
  ],
  paymentTypes: [
    'Paid',
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Credit',
  ],
};

export const COMPANY_INFO = {
  name: 'ADO INTERNATIONAL TRANSPORT NEPAL PVT. LTD.',
  tradeName: 'एडीओ इन्टरनेशनल ट्रान्सपोर्ट नेपाल प्रा. लि.',
  panVatNo: '601248953',
  address: 'Adarshanagar-05, Birgunj, Parsa / Ring Road, Kalanki, Kathmandu, Nepal',
  phone: '+977-1-4289012, +977-9855012345',
  email: 'accounts@adotransport.com.np',
  website: 'www.adotransport.com.np',
  regNo: '142857/076/077',
  vatOffice: 'Large Taxpayers Office / IRO Birgunj',
};

const INITIAL_PURCHASE_BILLS: PurchaseBill[] = [];

const INITIAL_SALES_BILLS: SalesBill[] = [];

const INITIAL_PARTIES: PartyRecord[] = [];

const STORAGE_KEYS = {
  PURCHASES: 'ado_purchase_bills_v1',
  SALES: 'ado_sales_bills_v1',
  PARTIES: 'ado_parties_v1',
  YEAR: 'ado_active_year_v1',
  MONTH: 'ado_active_month_v1',
  DROPDOWNS: 'ado_dropdown_settings_v1',
};

const DUMMY_PURGE_FLAG = 'ado_dummy_data_purged_clean_v1';

// Automatically purge pre-existing dummy data from browser localStorage
export function purgeDummyDataIfPresent(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const alreadyPurged = localStorage.getItem(DUMMY_PURGE_FLAG);
      if (!alreadyPurged) {
        localStorage.removeItem(STORAGE_KEYS.PURCHASES);
        localStorage.removeItem(STORAGE_KEYS.SALES);
        localStorage.removeItem(STORAGE_KEYS.PARTIES);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify([]));
        localStorage.setItem(DUMMY_PURGE_FLAG, 'true');
      }
    }
  } catch (e) {
    console.error('Failed to purge dummy data', e);
  }
}

// Run immediately on module import
purgeDummyDataIfPresent();

export function loadDropdownSettings(): DropdownSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DROPDOWNS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.vatTypes) &&
        Array.isArray(parsed.paymentTypes)
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load dropdown settings', e);
  }
  return DEFAULT_DROPDOWN_SETTINGS;
}

export function saveDropdownSettings(settings: DropdownSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DROPDOWNS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save dropdown settings', e);
  }
}

export function loadPurchaseBills(): PurchaseBill[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load purchase bills', e);
  }
  return INITIAL_PURCHASE_BILLS;
}

export function savePurchaseBills(bills: PurchaseBill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(bills));
  } catch (e) {
    console.error('Failed to save purchase bills', e);
  }
}

export function loadSalesBills(): SalesBill[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load sales bills', e);
  }
  return INITIAL_SALES_BILLS;
}

export function saveSalesBills(bills: SalesBill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(bills));
  } catch (e) {
    console.error('Failed to save sales bills', e);
  }
}

export function loadParties(): PartyRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load parties', e);
  }
  return INITIAL_PARTIES;
}

export function saveParties(parties: PartyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
  } catch (e) {
    console.error('Failed to save parties', e);
  }
}

export function loadInitialYearMonth(): { year: number; month: number } {
  try {
    const y = localStorage.getItem(STORAGE_KEYS.YEAR);
    const m = localStorage.getItem(STORAGE_KEYS.MONTH);
    if (y && m) {
      const year = parseInt(y, 10);
      const month = parseInt(m, 10);
      if (!isNaN(year) && year >= 2070 && year <= 2100 && !isNaN(month) && month >= 1 && month <= 12) {
        return { year, month };
      }
    }
  } catch {}
  return getCurrentNepaliYearMonth();
}

export function saveActiveYearMonth(year: number, month: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.YEAR, year.toString());
    localStorage.setItem(STORAGE_KEYS.MONTH, month.toString());
  } catch {}
}

export function exportBackupJSON(purchases: PurchaseBill[], sales: SalesBill[], parties: PartyRecord[]): void {
  const data = {
    appName: 'ADO Transport — VAT Billing System',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    purchases,
    sales,
    parties,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ado_transport_vat_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAllData(): { purchases: PurchaseBill[]; sales: SalesBill[]; parties: PartyRecord[] } {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify([]));
  } catch {}
  return {
    purchases: [],
    sales: [],
    parties: [],
  };
}
