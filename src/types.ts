export type BillType = 'purchase' | 'sales';

export type VatType = 'Taxable' | 'Exempt' | 'Zero-Rated' | string;

export type PaymentMethod = 'Cash' | 'Paid' | 'Bank Transfer' | 'Cheque' | 'Credit' | string;

export interface DropdownSettings {
  categories: string[];
  vatTypes: string[];
  paymentTypes: string[];
}

export interface PurchaseBill {
  id: string;
  sn?: number;
  dateBS: string; // e.g., "2081-05-14"
  bsYear: number; // e.g., 2081
  bsMonth: number; // 1 to 12
  fiscalYear: string; // e.g., "2081/82"
  invoiceNo: string;
  partyName: string;
  vatNo: string; // 9 digits
  pan: string; // 9 digits
  billsDescription: string; // short reference/description e.g., "Fuel & Engine Oil"
  beforeVat: number;
  vat: number;
  afterVat: number;
  createdAt: string;
}

export interface SalesBill {
  id: string;
  sn?: number;
  dateBS: string;
  bsYear: number;
  bsMonth: number;
  fiscalYear: string;
  invoiceNo: string;
  buyerName: string;
  partyName?: string; // consignor/broker/reference
  vatNo: string;
  category: string; // e.g., "Full Truck Load (FTL)", "Container Cargo"
  vatType: VatType;
  paymentMethod: PaymentMethod;
  beforeVat: number;
  vat: number;
  afterVat: number;
  buyerAddress?: string;
  itemDescription?: string;
  createdAt: string;
}

export interface PartyRecord {
  name: string;
  panOrVat: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  type: 'buyer' | 'supplier' | 'both';
  notes?: string;
  creditDays?: number;
}

export type ActiveTab = 'dashboard' | 'purchase' | 'sales' | 'vat-return' | 'party-ledger';

export interface MonthSummary {
  bsYear: number;
  bsMonth: number;
  fiscalYear: string;
  totalPurchaseBeforeVat: number;
  totalPurchaseVat: number;
  totalPurchaseAfterVat: number;
  totalSalesBeforeVat: number;
  totalSalesVat: number;
  totalSalesAfterVat: number;
  netVatPayable: number; // Sales VAT - Purchase VAT (positive = payable to IRD, negative = credit)
  purchaseCount: number;
  salesCount: number;
}
