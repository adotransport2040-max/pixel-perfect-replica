import { PurchaseBill, SalesBill } from '../types';
import { NEPALI_MONTHS } from './nepaliCalendar';

function downloadCSVFile(filename: string, csvContent: string) {
  // UTF-8 BOM so Excel opens characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportPurchaseBillsToCSV(bills: PurchaseBill[], year: number, month: number) {
  const monthName = NEPALI_MONTHS.find((m) => m.index === month)?.name || month;
  const filename = `Purchase_Register_ADO_Transport_${monthName}_${year}.csv`;

  const headers = [
    'S.N.',
    'BS Date',
    'Fiscal Year',
    'Invoice No.',
    'Party Name',
    'VAT No.',
    'PAN',
    'Bills Reference / Description',
    'Before VAT (NPR)',
    'VAT Amount 13% (NPR)',
    'After VAT Total (NPR)',
  ];

  const rows = bills.map((b, idx) => [
    idx + 1,
    escapeCSV(b.dateBS),
    escapeCSV(b.fiscalYear),
    escapeCSV(b.invoiceNo),
    escapeCSV(b.partyName),
    escapeCSV(b.vatNo),
    escapeCSV(b.pan),
    escapeCSV(b.billsDescription),
    b.beforeVat.toFixed(2),
    b.vat.toFixed(2),
    b.afterVat.toFixed(2),
  ]);

  // Add Totals row
  const totalBeforeVat = bills.reduce((sum, b) => sum + b.beforeVat, 0);
  const totalVat = bills.reduce((sum, b) => sum + b.vat, 0);
  const totalAfterVat = bills.reduce((sum, b) => sum + b.afterVat, 0);

  rows.push([
    'TOTAL',
    '',
    '',
    '',
    `Total Records: ${bills.length}`,
    '',
    '',
    '',
    totalBeforeVat.toFixed(2),
    totalVat.toFixed(2),
    totalAfterVat.toFixed(2),
  ]);

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadCSVFile(filename, csvString);
}

export function exportSalesBillsToCSV(bills: SalesBill[], year: number, month: number) {
  const monthName = NEPALI_MONTHS.find((m) => m.index === month)?.name || month;
  const filename = `Sales_Register_ADO_Transport_${monthName}_${year}.csv`;

  const headers = [
    'S.N.',
    'BS Date',
    'Fiscal Year',
    'Invoice No.',
    'Buyer Name',
    'Party / Consignor',
    'VAT / PAN No.',
    'Category',
    'VAT Type',
    'Payment Method',
    'Before VAT (NPR)',
    'VAT Amount (NPR)',
    'After VAT Total (NPR)',
  ];

  const rows = bills.map((b, idx) => [
    idx + 1,
    escapeCSV(b.dateBS),
    escapeCSV(b.fiscalYear),
    escapeCSV(b.invoiceNo),
    escapeCSV(b.buyerName),
    escapeCSV(b.partyName || ''),
    escapeCSV(b.vatNo),
    escapeCSV(b.category),
    escapeCSV(b.vatType),
    escapeCSV(b.paymentMethod),
    b.beforeVat.toFixed(2),
    b.vat.toFixed(2),
    b.afterVat.toFixed(2),
  ]);

  // Add Totals row
  const totalBeforeVat = bills.reduce((sum, b) => sum + b.beforeVat, 0);
  const totalVat = bills.reduce((sum, b) => sum + b.vat, 0);
  const totalAfterVat = bills.reduce((sum, b) => sum + b.afterVat, 0);

  rows.push([
    'TOTAL',
    '',
    '',
    '',
    `Total Records: ${bills.length}`,
    '',
    '',
    '',
    '',
    '',
    totalBeforeVat.toFixed(2),
    totalVat.toFixed(2),
    totalAfterVat.toFixed(2),
  ]);

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadCSVFile(filename, csvString);
}
