import ExcelJS from 'exceljs';
import { PurchaseBill, SalesBill, PartyRecord } from '../types';
import { COMPANY_INFO } from './storage';
import { NEPALI_MONTHS, getFiscalYear } from './nepaliCalendar';

function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

// Styling Constants for modern, attractive Excel design
const THEME = {
  headerBg: '0F766E', // Modern Deep Teal (HEX without # for ExcelJS ARGB)
  headerFg: 'FFFFFF',
  titleBg: '134E4A', // Darker Teal for Title Banner
  titleFg: 'FFFFFF',
  metaBg: 'F0FDFA', // Light Teal accent
  metaFg: '134E4A',
  totalBg: 'CCFBF1', // Highlighted Mint/Teal for Total row
  totalFg: '0F766E',
  zebraEven: 'F8FAFC',
  zebraOdd: 'FFFFFF',
  borderColor: 'CBD5E1', // Slate 300
};

const borderThin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: THEME.borderColor } },
  left: { style: 'thin', color: { argb: THEME.borderColor } },
  bottom: { style: 'thin', color: { argb: THEME.borderColor } },
  right: { style: 'thin', color: { argb: THEME.borderColor } },
};

const borderTotal: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: '0F766E' } },
  left: { style: 'thin', color: { argb: THEME.borderColor } },
  bottom: { style: 'double', color: { argb: '0F766E' } },
  right: { style: 'thin', color: { argb: THEME.borderColor } },
};

// Center alignment for ALL data cells as strictly requested:
// "All the data must be centered aligned ."
const centerAlignment: Partial<ExcelJS.Alignment> = {
  vertical: 'middle',
  horizontal: 'center',
  wrapText: true,
};

/**
 * Export Purchase Bills to an attractive, modern, styled Excel file (.xlsx)
 */
export async function exportPurchaseBillsToExcel(
  bills: PurchaseBill[],
  year: number,
  month: number,
  period: 'monthly' | 'yearly' = 'monthly',
  partyNameFilter?: string
) {
  const monthName = NEPALI_MONTHS.find((m) => m.index === month)?.name || `Month ${month}`;
  const fy = getFiscalYear(year, month);
  const periodTitle =
    period === 'yearly'
      ? `FULL FISCAL YEAR ${fy} (B.S. ${year})`
      : `MONTH OF ${monthName.toUpperCase()} ${year} B.S. (FY ${fy})`;

  const partySubtitle = partyNameFilter ? `PARTY: ${partyNameFilter.toUpperCase()}` : '';
  const filename = `Purchase_Register_ADO_Transport_${period === 'yearly' ? `Year_${year}` : `${monthName}_${year}`}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_INFO.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Purchase Register', {
    views: [{ showGridLines: true }],
  });

  // 1. Company Header Banner (Row 1)
  worksheet.mergeCells('A1:I1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `${COMPANY_INFO.name.toUpperCase()} — PURCHASE REGISTER (खरीद खाता)`;
  titleRow.font = { name: 'Calibri', size: 16, bold: true, color: { argb: THEME.titleFg } };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.titleBg },
  };
  titleRow.alignment = centerAlignment;
  worksheet.getRow(1).height = 36;

  // 2. Sub-Header Info Banner (Row 2)
  worksheet.mergeCells('A2:I2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `${COMPANY_INFO.address.toUpperCase()} | VAT/PAN NO: ${COMPANY_INFO.panVatNo} | PHONE: ${COMPANY_INFO.phone}`;
  subRow.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FFFFFF' } };
  subRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.headerBg },
  };
  subRow.alignment = centerAlignment;
  worksheet.getRow(2).height = 22;

  // 3. Metadata Banner (Row 3)
  worksheet.mergeCells('A3:I3');
  const metaRow = worksheet.getCell('A3');
  metaRow.value = `ACCOUNTING PERIOD: ${periodTitle} ${partySubtitle ? `| ${partySubtitle}` : ''} | TOTAL BILLS: ${bills.length}`;
  metaRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.metaFg } };
  metaRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.metaBg },
  };
  metaRow.alignment = centerAlignment;
  worksheet.getRow(3).height = 24;

  // Empty spacer row (Row 4)
  worksheet.getRow(4).height = 8;

  // 4. Column Headers (Row 5) - "The heading must look attractive and bold and highlight"
  const headers = [
    'S.N.',
    'BS DATE',
    'INVOICE NO.',
    'PARTY / SUPPLIER NAME',
    'VAT NO.',
    'PAN / REF.',
    'BEFORE VAT (NPR)',
    'VAT 13% (NPR)',
    'AFTER VAT TOTAL (NPR)',
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.values = headers;
  headerRow.height = 32;

  for (let col = 1; col <= headers.length; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.headerFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.headerBg },
    };
    cell.alignment = centerAlignment;
    cell.border = {
      top: { style: 'medium', color: { argb: '042F2E' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      bottom: { style: 'medium', color: { argb: '042F2E' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  }

  // 5. Data Rows - "All the data must be centered aligned ."
  let currentRowIndex = 6;
  bills.forEach((bill, index) => {
    const row = worksheet.getRow(currentRowIndex);
    row.values = [
      index + 1,
      bill.dateBS,
      bill.invoiceNo,
      bill.partyName,
      bill.vatNo || '-',
      bill.pan || bill.billsDescription || '-',
      bill.beforeVat,
      bill.vat,
      bill.afterVat,
    ];
    row.height = 26;

    const isEven = index % 2 === 0;
    const bg = isEven ? THEME.zebraEven : THEME.zebraOdd;

    for (let col = 1; col <= headers.length; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bg },
      };
      // Centered aligned for ALL data cells
      cell.alignment = centerAlignment;
      cell.border = borderThin;

      // Currency / Number formatting for amount columns
      if (col === 7 || col === 8 || col === 9) {
        cell.numFmt = '#,##0.00';
      }
    }

    currentRowIndex++;
  });

  // 6. Total Row - Highlighted and Centered
  const totalBeforeVat = bills.reduce((sum, b) => sum + b.beforeVat, 0);
  const totalVat = bills.reduce((sum, b) => sum + b.vat, 0);
  const totalAfterVat = bills.reduce((sum, b) => sum + b.afterVat, 0);

  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.values = [
    'TOTAL',
    '',
    '',
    `Total Records: ${bills.length}`,
    '',
    '',
    totalBeforeVat,
    totalVat,
    totalAfterVat,
  ];
  totalRow.height = 30;

  for (let col = 1; col <= headers.length; col++) {
    const cell = totalRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.totalFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.totalBg },
    };
    cell.alignment = centerAlignment;
    cell.border = borderTotal;

    if (col === 7 || col === 8 || col === 9) {
      cell.numFmt = '#,##0.00';
    }
  }

  // 7. Auto-fit column widths with pleasant padding
  const colWidths = [8, 14, 16, 32, 16, 22, 20, 18, 22];
  colWidths.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width;
  });

  await downloadWorkbook(workbook, filename);
}

/**
 * Export Sales Bills to an attractive, modern, styled Excel file (.xlsx)
 */
export async function exportSalesBillsToExcel(
  bills: SalesBill[],
  year: number,
  month: number,
  period: 'monthly' | 'yearly' = 'monthly',
  partyNameFilter?: string
) {
  const monthName = NEPALI_MONTHS.find((m) => m.index === month)?.name || `Month ${month}`;
  const fy = getFiscalYear(year, month);
  const periodTitle =
    period === 'yearly'
      ? `FULL FISCAL YEAR ${fy} (B.S. ${year})`
      : `MONTH OF ${monthName.toUpperCase()} ${year} B.S. (FY ${fy})`;

  const partySubtitle = partyNameFilter ? `PARTY / BUYER: ${partyNameFilter.toUpperCase()}` : '';
  const filename = `Sales_Register_ADO_Transport_${period === 'yearly' ? `Year_${year}` : `${monthName}_${year}`}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_INFO.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Sales Register', {
    views: [{ showGridLines: true }],
  });

  // 1. Company Header Banner (Row 1)
  worksheet.mergeCells('A1:J1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `${COMPANY_INFO.name.toUpperCase()} — SALES REGISTER (बिक्री खाता)`;
  titleRow.font = { name: 'Calibri', size: 16, bold: true, color: { argb: THEME.titleFg } };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.titleBg },
  };
  titleRow.alignment = centerAlignment;
  worksheet.getRow(1).height = 36;

  // 2. Sub-Header Info Banner (Row 2)
  worksheet.mergeCells('A2:J2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `${COMPANY_INFO.address.toUpperCase()} | VAT/PAN NO: ${COMPANY_INFO.panVatNo} | PHONE: ${COMPANY_INFO.phone}`;
  subRow.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FFFFFF' } };
  subRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.headerBg },
  };
  subRow.alignment = centerAlignment;
  worksheet.getRow(2).height = 22;

  // 3. Metadata Banner (Row 3)
  worksheet.mergeCells('A3:J3');
  const metaRow = worksheet.getCell('A3');
  metaRow.value = `ACCOUNTING PERIOD: ${periodTitle} ${partySubtitle ? `| ${partySubtitle}` : ''} | TOTAL INVOICES: ${bills.length}`;
  metaRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.metaFg } };
  metaRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.metaBg },
  };
  metaRow.alignment = centerAlignment;
  worksheet.getRow(3).height = 24;

  // Spacer row (Row 4)
  worksheet.getRow(4).height = 8;

  // 4. Column Headers (Row 5) - "The heading must look attractive and bold and highlight"
  const headers = [
    'S.N.',
    'BS DATE',
    'INVOICE NO.',
    "BUYER'S / PARTY NAME",
    'VAT / PAN NO.',
    'CATEGORY',
    'VAT TYPE',
    'BEFORE VAT (NPR)',
    'VAT (NPR)',
    'AFTER VAT TOTAL (NPR)',
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.values = headers;
  headerRow.height = 32;

  for (let col = 1; col <= headers.length; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.headerFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.headerBg },
    };
    cell.alignment = centerAlignment;
    cell.border = {
      top: { style: 'medium', color: { argb: '042F2E' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      bottom: { style: 'medium', color: { argb: '042F2E' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  }

  // 5. Data Rows - "All the data must be centered aligned ."
  let currentRowIndex = 6;
  bills.forEach((bill, index) => {
    const row = worksheet.getRow(currentRowIndex);
    row.values = [
      index + 1,
      bill.dateBS,
      bill.invoiceNo,
      bill.buyerName,
      bill.vatNo || '-',
      bill.category || '-',
      bill.vatType || '13%',
      bill.beforeVat,
      bill.vat,
      bill.afterVat,
    ];
    row.height = 26;

    const isEven = index % 2 === 0;
    const bg = isEven ? THEME.zebraEven : THEME.zebraOdd;

    for (let col = 1; col <= headers.length; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bg },
      };
      // Centered aligned for ALL data cells
      cell.alignment = centerAlignment;
      cell.border = borderThin;

      // Currency / Number formatting for amount columns
      if (col === 8 || col === 9 || col === 10) {
        cell.numFmt = '#,##0.00';
      }
    }

    currentRowIndex++;
  });

  // 6. Total Row - Highlighted and Centered
  const totalBeforeVat = bills.reduce((sum, b) => sum + b.beforeVat, 0);
  const totalVat = bills.reduce((sum, b) => sum + b.vat, 0);
  const totalAfterVat = bills.reduce((sum, b) => sum + b.afterVat, 0);

  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.values = [
    'TOTAL',
    '',
    '',
    `Total Invoices: ${bills.length}`,
    '',
    '',
    '',
    totalBeforeVat,
    totalVat,
    totalAfterVat,
  ];
  totalRow.height = 30;

  for (let col = 1; col <= headers.length; col++) {
    const cell = totalRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.totalFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.totalBg },
    };
    cell.alignment = centerAlignment;
    cell.border = borderTotal;

    if (col === 8 || col === 9 || col === 10) {
      cell.numFmt = '#,##0.00';
    }
  }

  // 7. Auto-fit column widths with pleasant padding
  const colWidths = [8, 14, 16, 32, 16, 20, 14, 20, 18, 22];
  colWidths.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width;
  });

  await downloadWorkbook(workbook, filename);
}

/**
 * Export Party Statement / Ledger to an attractive, modern, styled Excel file (.xlsx)
 */
export async function exportPartyLedgerToExcel(
  partyName: string,
  partyInfo: PartyRecord | undefined,
  transactions: Array<{
    dateBS: string;
    invoiceNo: string;
    type: 'purchase' | 'sales';
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>
) {
  const filename = `Party_Ledger_${partyName.replace(/\s+/g, '_')}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_INFO.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Party Ledger', {
    views: [{ showGridLines: true }],
  });

  // 1. Company Banner
  worksheet.mergeCells('A1:G1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `${COMPANY_INFO.name.toUpperCase()} — STATEMENT OF ACCOUNT`;
  titleRow.font = { name: 'Calibri', size: 16, bold: true, color: { argb: THEME.titleFg } };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.titleBg },
  };
  titleRow.alignment = centerAlignment;
  worksheet.getRow(1).height = 36;

  // 2. Party Information Banner
  worksheet.mergeCells('A2:G2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `PARTY: ${partyName.toUpperCase()} | PAN/VAT: ${partyInfo?.panOrVat || '-'} | PHONE: ${partyInfo?.phone || '-'} | ADDRESS: ${partyInfo?.address || '-'}`;
  subRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  subRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME.headerBg },
  };
  subRow.alignment = centerAlignment;
  worksheet.getRow(2).height = 24;

  // Spacer row
  worksheet.getRow(3).height = 8;

  // Headers
  const headers = [
    'S.N.',
    'DATE (BS)',
    'INVOICE / VOUCHER NO.',
    'PARTICULARS / DESCRIPTION',
    'DEBIT (NPR)',
    'CREDIT (NPR)',
    'BALANCE (NPR)',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 30;

  for (let col = 1; col <= headers.length; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.headerFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.headerBg },
    };
    cell.alignment = centerAlignment;
    cell.border = {
      top: { style: 'medium', color: { argb: '042F2E' } },
      left: { style: 'thin', color: { argb: '14B8A6' } },
      bottom: { style: 'medium', color: { argb: '042F2E' } },
      right: { style: 'thin', color: { argb: '14B8A6' } },
    };
  }

  // Rows
  let currentRowIndex = 5;
  let totalDebit = 0;
  let totalCredit = 0;

  transactions.forEach((tx, index) => {
    totalDebit += tx.debit;
    totalCredit += tx.credit;

    const row = worksheet.getRow(currentRowIndex);
    row.values = [
      index + 1,
      tx.dateBS,
      tx.invoiceNo,
      tx.description,
      tx.debit > 0 ? tx.debit : '-',
      tx.credit > 0 ? tx.credit : '-',
      tx.balance,
    ];
    row.height = 25;

    const bg = index % 2 === 0 ? THEME.zebraEven : THEME.zebraOdd;

    for (let col = 1; col <= headers.length; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Calibri', size: 10.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bg },
      };
      // All data centered aligned
      cell.alignment = centerAlignment;
      cell.border = borderThin;

      if ((col === 5 || col === 6) && typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
      if (col === 7) {
        cell.numFmt = '#,##0.00';
      }
    }

    currentRowIndex++;
  });

  // Total Row
  const totalRow = worksheet.getRow(currentRowIndex);
  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
  totalRow.values = [
    'TOTAL',
    '',
    '',
    `Total Transactions: ${transactions.length}`,
    totalDebit,
    totalCredit,
    closingBalance,
  ];
  totalRow.height = 30;

  for (let col = 1; col <= headers.length; col++) {
    const cell = totalRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.totalFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME.totalBg },
    };
    cell.alignment = centerAlignment;
    cell.border = borderTotal;

    if (col === 5 || col === 6 || col === 7) {
      cell.numFmt = '#,##0.00';
    }
  }

  const colWidths = [8, 14, 22, 34, 18, 18, 20];
  colWidths.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width;
  });

  await downloadWorkbook(workbook, filename);
}
