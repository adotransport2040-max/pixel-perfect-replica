import { supabase } from '@/integrations/supabase/client';
import { PurchaseBill, SalesBill, PartyRecord, DropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS } from './storage';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You are signed out. Please sign in again.');
  return data.user.id;
}

const num = (v: unknown) => Number(v ?? 0);

/* ---------- mappers ---------- */

function toPurchase(row: Record<string, any>): PurchaseBill {
  return {
    id: row.id,
    sn: row.sn ?? undefined,
    dateBS: row.date_bs ?? '',
    bsYear: row.bs_year,
    bsMonth: row.bs_month,
    fiscalYear: row.fiscal_year ?? '',
    invoiceNo: row.invoice_no ?? '',
    partyName: row.party_name ?? '',
    vatNo: row.vat_no ?? '',
    pan: row.pan ?? '',
    billsDescription: row.bills_description ?? '',
    beforeVat: num(row.before_vat),
    vat: num(row.vat),
    afterVat: num(row.after_vat),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromPurchase(bill: PurchaseBill, userId: string) {
  return {
    id: bill.id,
    user_id: userId,
    sn: bill.sn ?? null,
    date_bs: bill.dateBS ?? '',
    bs_year: bill.bsYear,
    bs_month: bill.bsMonth,
    fiscal_year: bill.fiscalYear ?? '',
    invoice_no: bill.invoiceNo ?? '',
    party_name: bill.partyName ?? '',
    vat_no: bill.vatNo ?? '',
    pan: bill.pan ?? '',
    bills_description: bill.billsDescription ?? '',
    before_vat: num(bill.beforeVat),
    vat: num(bill.vat),
    after_vat: num(bill.afterVat),
    created_at: bill.createdAt ?? new Date().toISOString(),
  };
}

function toSales(row: Record<string, any>): SalesBill {
  return {
    id: row.id,
    sn: row.sn ?? undefined,
    dateBS: row.date_bs ?? '',
    bsYear: row.bs_year,
    bsMonth: row.bs_month,
    fiscalYear: row.fiscal_year ?? '',
    invoiceNo: row.invoice_no ?? '',
    buyerName: row.buyer_name ?? '',
    partyName: row.party_name ?? undefined,
    vatNo: row.vat_no ?? '',
    category: row.category ?? '',
    vatType: row.vat_type ?? '',
    paymentMethod: row.payment_method ?? '',
    beforeVat: num(row.before_vat),
    vat: num(row.vat),
    afterVat: num(row.after_vat),
    buyerAddress: row.buyer_address ?? undefined,
    itemDescription: row.item_description ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromSales(bill: SalesBill, userId: string) {
  return {
    id: bill.id,
    user_id: userId,
    sn: bill.sn ?? null,
    date_bs: bill.dateBS ?? '',
    bs_year: bill.bsYear,
    bs_month: bill.bsMonth,
    fiscal_year: bill.fiscalYear ?? '',
    invoice_no: bill.invoiceNo ?? '',
    buyer_name: bill.buyerName ?? '',
    party_name: bill.partyName ?? null,
    vat_no: bill.vatNo ?? '',
    category: bill.category ?? '',
    vat_type: bill.vatType ?? '',
    payment_method: bill.paymentMethod ?? '',
    before_vat: num(bill.beforeVat),
    vat: num(bill.vat),
    after_vat: num(bill.afterVat),
    buyer_address: bill.buyerAddress ?? null,
    item_description: bill.itemDescription ?? null,
    created_at: bill.createdAt ?? new Date().toISOString(),
  };
}

function toParty(row: Record<string, any>): PartyRecord {
  return {
    name: row.name ?? '',
    panOrVat: row.pan_or_vat ?? '',
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    contactPerson: row.contact_person ?? undefined,
    type: (row.type ?? 'buyer') as PartyRecord['type'],
    notes: row.notes ?? undefined,
    creditDays: row.credit_days ?? undefined,
  };
}

function fromParty(party: PartyRecord, userId: string) {
  return {
    user_id: userId,
    name: party.name?.trim() ?? '',
    pan_or_vat: party.panOrVat ?? '',
    address: party.address ?? null,
    phone: party.phone ?? null,
    email: party.email ?? null,
    contact_person: party.contactPerson ?? null,
    type: party.type ?? 'buyer',
    notes: party.notes ?? null,
    credit_days: party.creditDays ?? null,
  };
}

/* ---------- reads ---------- */

export interface CloudSnapshot {
  purchases: PurchaseBill[];
  sales: SalesBill[];
  parties: PartyRecord[];
  settings: DropdownSettings;
}

export async function fetchAllCloudData(): Promise<CloudSnapshot> {
  const userId = await requireUserId();

  const [purchaseRes, salesRes, partyRes, settingsRes] = await Promise.all([
    supabase.from('purchase_bills').select('*').order('created_at', { ascending: false }),
    supabase.from('sales_bills').select('*').order('created_at', { ascending: false }),
    supabase.from('parties').select('*').order('created_at', { ascending: false }),
    supabase.from('app_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const firstError = purchaseRes.error || salesRes.error || partyRes.error || settingsRes.error;
  if (firstError) throw firstError;

  const settingsRow = settingsRes.data as Record<string, any> | null;
  const settings: DropdownSettings = settingsRow
    ? {
        categories: settingsRow.categories?.length
          ? settingsRow.categories
          : DEFAULT_DROPDOWN_SETTINGS.categories,
        vatTypes: settingsRow.vat_types?.length
          ? settingsRow.vat_types
          : DEFAULT_DROPDOWN_SETTINGS.vatTypes,
        paymentTypes: settingsRow.payment_types?.length
          ? settingsRow.payment_types
          : DEFAULT_DROPDOWN_SETTINGS.paymentTypes,
      }
    : DEFAULT_DROPDOWN_SETTINGS;

  return {
    purchases: ((purchaseRes.data ?? []) as Record<string, any>[]).map(toPurchase),
    sales: ((salesRes.data ?? []) as Record<string, any>[]).map(toSales),
    parties: ((partyRes.data ?? []) as Record<string, any>[]).map(toParty),
    settings,
  };
}

/* ---------- writes ---------- */

export async function savePurchaseToCloud(bill: PurchaseBill): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('purchase_bills').upsert(fromPurchase(bill, userId));
  if (error) throw error;
}

export async function saveSalesToCloud(bill: SalesBill): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('sales_bills').upsert(fromSales(bill, userId));
  if (error) throw error;
}

export async function deletePurchaseFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('purchase_bills').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteSalesFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('sales_bills').delete().eq('id', id);
  if (error) throw error;
}

export async function savePartyToCloud(party: PartyRecord): Promise<void> {
  const userId = await requireUserId();
  const payload = fromParty(party, userId);
  const { data: existing, error: findError } = await supabase
    .from('parties')
    .select('id')
    .ilike('name', payload.name)
    .maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase.from('parties').update(payload).eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('parties').insert(payload);
  if (error) throw error;
}

export async function saveSettingsToCloud(settings: DropdownSettings): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('app_settings').upsert({
    user_id: userId,
    categories: settings.categories,
    vat_types: settings.vatTypes,
    payment_types: settings.paymentTypes,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteAllCloudData(): Promise<void> {
  const userId = await requireUserId();
  for (const table of ['purchase_bills', 'sales_bills', 'parties'] as const) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
}

export async function replaceAllCloudData(data: {
  purchases: PurchaseBill[];
  sales: SalesBill[];
  parties: PartyRecord[];
}): Promise<void> {
  const userId = await requireUserId();
  await deleteAllCloudData();

  if (data.purchases.length) {
    const { error } = await supabase
      .from('purchase_bills')
      .insert(data.purchases.map((b) => fromPurchase(b, userId)));
    if (error) throw error;
  }
  if (data.sales.length) {
    const { error } = await supabase
      .from('sales_bills')
      .insert(data.sales.map((b) => fromSales(b, userId)));
    if (error) throw error;
  }
  const seen = new Set<string>();
  const uniqueParties = data.parties.filter((p) => {
    const key = (p.name ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (uniqueParties.length) {
    const { error } = await supabase
      .from('parties')
      .insert(uniqueParties.map((p) => fromParty(p, userId)));
    if (error) throw error;
  }
}
