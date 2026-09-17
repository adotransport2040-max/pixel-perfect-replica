// Bikram Sambat (BS) Calendar utilities and Nepal VAT helpers

// BS Years range up to 2100 B.S. as required
export const BS_YEARS: number[] = Array.from({ length: 2100 - 2075 + 1 }, (_, i) => 2075 + i);

export interface NepaliMonthInfo {
  index: number; // 1-12
  name: string;
  nepaliName: string;
}

export const NEPALI_MONTHS: NepaliMonthInfo[] = [
  { index: 1, name: 'Baishakh', nepaliName: 'वैशाख' },
  { index: 2, name: 'Jestha', nepaliName: 'जेठ' },
  { index: 3, name: 'Ashadh', nepaliName: 'असार' },
  { index: 4, name: 'Shrawan', nepaliName: 'साउन' },
  { index: 5, name: 'Bhadra', nepaliName: 'भाद्र' },
  { index: 6, name: 'Ashwin', nepaliName: 'असोज' },
  { index: 7, name: 'Kartik', nepaliName: 'कार्तिक' },
  { index: 8, name: 'Mangsir', nepaliName: 'मंसिर' },
  { index: 9, name: 'Poush', nepaliName: 'पुष' },
  { index: 10, name: 'Magh', nepaliName: 'माघ' },
  { index: 11, name: 'Falgun', nepaliName: 'फागुन' },
  { index: 12, name: 'Chaitra', nepaliName: 'चैत' },
];

export const SALES_CATEGORIES = [
  'Full Truck Load (FTL)',
  'Less than Truckload (LTL)',
  'Container Haulage',
  'Machinery Transport',
  'Inter-City Cargo',
  'Warehousing & Handling',
  'Fleet Logistics Support',
];

/**
 * Calculates current Nepali BS Year and Month from Gregorian calendar date
 */
export function getCurrentNepaliYearMonth(now: Date = new Date()): { year: number; month: number } {
  const gYear = now.getFullYear();
  const gMonth = now.getMonth() + 1; // 1-12
  const gDate = now.getDate();

  // Bikram Sambat is approximately +56 years, 8.5 months ahead of Gregorian
  let bsYear = gYear + 57;
  let bsMonth = 1;

  if (gMonth === 1) {
    bsYear = gYear + 56;
    bsMonth = gDate < 15 ? 9 : 10;
  } else if (gMonth === 2) {
    bsYear = gYear + 56;
    bsMonth = gDate < 13 ? 10 : 11;
  } else if (gMonth === 3) {
    bsYear = gYear + 56;
    bsMonth = gDate < 15 ? 11 : 12;
  } else if (gMonth === 4) {
    if (gDate < 14) {
      bsYear = gYear + 56;
      bsMonth = 12;
    } else {
      bsYear = gYear + 57;
      bsMonth = 1;
    }
  } else if (gMonth === 5) {
    bsMonth = gDate < 15 ? 1 : 2;
  } else if (gMonth === 6) {
    bsMonth = gDate < 15 ? 2 : 3;
  } else if (gMonth === 7) {
    bsMonth = gDate < 17 ? 3 : 4;
  } else if (gMonth === 8) {
    bsMonth = gDate < 17 ? 4 : 5;
  } else if (gMonth === 9) {
    bsMonth = gDate < 17 ? 5 : 6;
  } else if (gMonth === 10) {
    bsMonth = gDate < 18 ? 6 : 7;
  } else if (gMonth === 11) {
    bsMonth = gDate < 17 ? 7 : 8;
  } else if (gMonth === 12) {
    bsMonth = gDate < 16 ? 8 : 9;
  }

  // Bound to configured BS_YEARS
  if (bsYear < 2075) bsYear = 2075;
  if (bsYear > 2100) bsYear = 2100;
  if (bsMonth < 1) bsMonth = 1;
  if (bsMonth > 12) bsMonth = 12;

  return { year: bsYear, month: bsMonth };
}

/**
 * Calculates the Nepali Fiscal Year string from BS Year and BS Month.
 * In Nepal, Fiscal Year runs from Shrawan (Month 4) to Ashadh (Month 3).
 * e.g., 2081 Month 4 (Shrawan) -> "2081/82"
 * e.g., 2082 Month 2 (Jestha)  -> "2081/82"
 */
export function getFiscalYear(bsYear: number, bsMonth: number): string {
  if (bsMonth >= 4) {
    const nextYearShort = (bsYear + 1).toString().slice(-2);
    return `${bsYear}/${nextYearShort}`;
  } else {
    const prevYear = bsYear - 1;
    const currYearShort = bsYear.toString().slice(-2);
    return `${prevYear}/${currYearShort}`;
  }
}

/**
 * Calculates Nepali Fiscal Year in hyphen format as shown in Excel reports (e.g. 2083-84)
 */
export function getFiscalYearHyphen(bsYear: number, bsMonth: number): string {
  if (bsMonth >= 4) {
    const nextYearShort = (bsYear + 1).toString().slice(-2);
    return `${bsYear}-${nextYearShort}`;
  } else {
    const prevYear = bsYear - 1;
    const currYearShort = bsYear.toString().slice(-2);
    return `${prevYear}-${currYearShort}`;
  }
}

/**
 * Returns available Fiscal Years in the system up to 2100 B.S.
 */
export const FISCAL_YEARS: string[] = BS_YEARS.map((y) => `${y}/${(y + 1).toString().slice(-2)}`);

/**
 * Format currency in Nepali Rupees format (NPR #,##,###.##)
 */
export function formatNPR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rs. 0.00';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer with South Asian numbering system (e.g. 12,34,567)
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOthers + ',' + lastThree;
  }

  return `${isNegative ? '-' : ''}Rs. ${integerPart}.${decimalPart}`;
}

/**
 * Validates Nepali PAN/VAT Number (must be exactly 9 numeric digits)
 */
export function isValidPanVat(val: string): boolean {
  if (!val) return true; // optional unless entered
  const cleaned = val.trim();
  return /^\d{9}$/.test(cleaned);
}

/**
 * Get next month name and 25th deadline for VAT filing
 */
export function getVatFilingDeadlineInfo(bsYear: number, bsMonth: number) {
  // In Nepal, VAT filing is due by 25th of the following Nepali month
  let nextMonthIndex = bsMonth + 1;
  let nextYear = bsYear;
  if (nextMonthIndex > 12) {
    nextMonthIndex = 1;
    nextYear = bsYear + 1;
  }
  const nextMonth = NEPALI_MONTHS.find((m) => m.index === nextMonthIndex);
  const currentMonth = NEPALI_MONTHS.find((m) => m.index === bsMonth);

  return {
    filingMonth: currentMonth?.name || '',
    deadlineDay: 25,
    dueMonth: nextMonth?.name || '',
    dueYear: nextYear,
    deadlineFormatted: `25th ${nextMonth?.name} ${nextYear} B.S.`,
  };
}

/**
 * Generates next auto-incremented invoice number for a given fiscal year
 * Format: ADO-81/82-001 or similar prefix
 */
export function getNextInvoiceNo(fiscalYear: string, existingInvoices: string[]): string {
  const fyClean = fiscalYear.replace('/', '');
  const prefix = `ADO-${fyClean}-`;
  
  let maxSeq = 0;
  for (const inv of existingInvoices) {
    if (inv && inv.startsWith(prefix)) {
      const seqStr = inv.slice(prefix.length);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    } else if (inv && /^\d+$/.test(inv)) {
      const parsed = parseInt(inv, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = nextSeq.toString().padStart(3, '0');
  return `${prefix}${padded}`;
}

/**
 * Converts a numeric amount to words in Nepali/English financial format
 */
export function numberToWordsRupees(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return `${tens[ten]}${one ? ' ' + ones[one] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${ones[hundred]} Hundred`;
      if (rem > 0) res += ' and ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res;
  }

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paisa = Math.round((absAmount - rupees) * 100);

  // South Asian scale: Crore (1,00,00,000), Lakh (1,00,000), Thousand (1,000), Hundred
  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundreds = rem;

  const parts: string[] = [];

  if (crore > 0) parts.push(`${convertThreeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
  if (hundreds > 0) parts.push(convertThreeDigits(hundreds));

  const words = parts.join(' ') || 'Zero';
  let finalStr = `Rupees ${words}`;
  if (paisa > 0) {
    finalStr += ` and ${convertTwoDigits(paisa)} Paisa`;
  }
  finalStr += ' Only';

  return finalStr;
}
