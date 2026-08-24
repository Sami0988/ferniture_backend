import Kenat from 'kenat';

const EC_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Ter', 'Yekatit',
  'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehasa', 'Pagume',
];

// ─── Fiscal Year Constants ───────────────────────────────────────────────────────
// Ethiopian fiscal year: Hamle 1 → Sene 30
// 12 fiscal periods, Nehase + Pagume merged as one period

interface FiscalMonthDef {
  index: number;
  ecMonth: number;
  name: string;
  mergePagume: boolean;
}

export const FISCAL_MONTH_MAP: FiscalMonthDef[] = [
  { index: 1,  ecMonth: 11, name: 'Hamle',             mergePagume: false },
  { index: 2,  ecMonth: 12, name: 'Nehase–Pagume',    mergePagume: true  },
  { index: 3,  ecMonth: 1,  name: 'Meskerem',          mergePagume: false },
  { index: 4,  ecMonth: 2,  name: 'Tikimt',            mergePagume: false },
  { index: 5,  ecMonth: 3,  name: 'Hidar',             mergePagume: false },
  { index: 6,  ecMonth: 4,  name: 'Tahsas',            mergePagume: false },
  { index: 7,  ecMonth: 5,  name: 'Ter',               mergePagume: false },
  { index: 8,  ecMonth: 6,  name: 'Yekatit',           mergePagume: false },
  { index: 9,  ecMonth: 7,  name: 'Megabit',           mergePagume: false },
  { index: 10, ecMonth: 8,  name: 'Miazia',            mergePagume: false },
  { index: 11, ecMonth: 9,  name: 'Genbot',            mergePagume: false },
  { index: 12, ecMonth: 10, name: 'Sene',              mergePagume: false },
];

function isGcLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getEcPagumeDays(ecYear: number): number {
  // Ethiopian leap year: year % 4 === 3 → Pagume has 6 days
  // Regular year → Pagume has 5 days
  const kenat = new Kenat(`${ecYear}/1/1`);
  return kenat.isLeapYear() ? 6 : 5;
}

export function toEC(gcDate: Date | string): {
  year: number;
  month: number;
  day: number;
  monthName: string;
  formatted: string;
} {
  const date = typeof gcDate === 'string' ? new Date(gcDate) : new Date(gcDate);
  const kenat = new Kenat(date);
  const ec = kenat.getEthiopian();
  const monthName = EC_MONTHS[ec.month - 1];
  const formatted = `${String(ec.day).padStart(2, '0')}/${String(ec.month).padStart(2, '0')}/${ec.year}`;

  return { year: ec.year, month: ec.month, day: ec.day, monthName, formatted };
}

export function toGC(
  ecInput: { year: number; month: number; day: number } | string,
): Date {
  let ecYear: number;
  let ecMonth: number;
  let ecDay: number;

  if (typeof ecInput === 'string') {
    const [d, m, y] = ecInput.split('/').map(Number);
    ecDay = d;
    ecMonth = m;
    ecYear = y;
  } else {
    ecYear = ecInput.year;
    ecMonth = ecInput.month;
    ecDay = ecInput.day;
  }

  const kenat = new Kenat(`${ecYear}/${ecMonth}/${ecDay}`);
  const gc = kenat.getGregorian();
  return new Date(gc.year, gc.month - 1, gc.day);
}

export function formatToEC(gcDateString: string): string {
  if (!gcDateString) return '';
  return toEC(gcDateString).formatted;
}

export function formatToGC(ecDateString: string): string {
  if (!ecDateString) return '';
  const gcDate = toGC(ecDateString);
  const y = gcDate.getFullYear();
  const m = String(gcDate.getMonth() + 1).padStart(2, '0');
  const d = String(gcDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function convertDate(
  dateString: string | Date | null | undefined,
  calendar: 'gc' | 'ec' | 'ec-fiscal' = 'gc',
): string | null {
  if (!dateString) return null;

  const dateStr = typeof dateString === 'string'
    ? dateString
    : dateString instanceof Date
      ? dateString.toISOString()
      : String(dateString);

  if (calendar === 'ec' || calendar === 'ec-fiscal') {
    return formatToEC(dateStr);
  }

  return dateStr.split('T')[0];
}

export function getEcMonthRange(gcDate: Date): { from: Date; to: Date } {
  const ec = toEC(gcDate);
  const from = toGC({ year: ec.year, month: ec.month, day: 1 });
  const lastDay = ec.month === 13 ? getEcPagumeDays(ec.year) : 30;
  const to = toGC({ year: ec.year, month: ec.month, day: lastDay });
  return { from, to };
}

export function getEcYearRange(gcDate: Date): { from: Date; to: Date } {
  const ec = toEC(gcDate);
  const from = toGC({ year: ec.year, month: 1, day: 1 });
  const lastDay = getEcPagumeDays(ec.year);
  const to = toGC({ year: ec.year, month: 13, day: lastDay });
  return { from, to };
}

export function getEcQuarterRange(gcDate: Date): { from: Date; to: Date } {
  const ec = toEC(gcDate);
  // Pagume (month 13) folds into Q4 (months 10-12)
  const effectiveMonth = ec.month === 13 ? 12 : ec.month;
  const quarterStartMonth = (Math.floor((effectiveMonth - 1) / 3) * 3) + 1;
  const from = toGC({ year: ec.year, month: quarterStartMonth, day: 1 });
  const quarterEndMonth = quarterStartMonth + 2;
  const lastDay = quarterEndMonth === 13 ? getEcPagumeDays(ec.year) : 30;
  const to = toGC({ year: ec.year, month: quarterEndMonth, day: lastDay });
  return { from, to };
}

export function getEcPeriodLabel(
  gcDate: Date,
  period: 'day' | 'week' | 'month' | 'quarter' | 'year',
): string {
  const ec = toEC(gcDate);
  switch (period) {
    case 'day':
      return `${ec.day} ${EC_MONTHS[ec.month - 1]} ${ec.year}`;
    case 'week':
      return `Week of ${ec.day} ${EC_MONTHS[ec.month - 1]} ${ec.year}`;
    case 'month':
      return `${EC_MONTHS[ec.month - 1]} ${ec.year}`;
    case 'quarter': {
      const quarter = Math.floor((ec.month - 1) / 3) + 1;
      return `Q${quarter} ${ec.year}`;
    }
    case 'year':
      return `${ec.year}`;
    default:
      return `${EC_MONTHS[ec.month - 1]} ${ec.year}`;
  }
}

// ─── Fiscal Year Functions ────────────────────────────────────────────────────────

/**
 * Given any GC date, return the EC fiscal year it falls in.
 * Fiscal year is named after its starting Hamle (e.g., FY2018 = Hamle 2018 → Sene 2019).
 * - Hamle (ecMonth 11), Nehase (12), Pagume (13) → belong to current EC year
 * - Meskerem (1) through Sene (10) → belong to previous EC year
 */
export function getFiscalYearForDate(gcDate: Date): number {
  const ec = toEC(gcDate);
  if (ec.month >= 11) {
    return ec.year;
  }
  return ec.year - 1;
}

/**
 * Get the GC date range for a specific fiscal month.
 * Fiscal month 1 = Hamle, 2 = Nehase+Pagume (merged), 3 = Meskerem, ..., 12 = Sene.
 *
 * Hamle(11) and Nehase(12) belong to `fiscalYear` (EC year).
 * Meskerem(1)...Sene(10) belong to `fiscalYear + 1` (next EC year).
 *
 * When mergePagume is true (fiscal month 2), `to` extends through the last day of Pagume.
 */
export function getEcFiscalMonthRange(
  fiscalYear: number,
  fiscalMonthIndex: number,
): { from: Date; to: Date; label: string } {
  if (fiscalMonthIndex < 1 || fiscalMonthIndex > 12) {
    throw new Error(`Invalid fiscal month index: ${fiscalMonthIndex}. Must be 1-12.`);
  }

  const def = FISCAL_MONTH_MAP[fiscalMonthIndex - 1];

  // Determine which EC year this fiscal month belongs to
  const ecYear = def.ecMonth >= 11 ? fiscalYear : fiscalYear + 1;

  const from = toGC({ year: ecYear, month: def.ecMonth, day: 1 });

  let to: Date;
  if (def.mergePagume) {
    // Nehase + Pagume: extend to last day of Pagume
    const lastDay = getEcPagumeDays(ecYear);
    to = toGC({ year: ecYear, month: 13, day: lastDay });
  } else {
    // Standard 30-day month
    to = toGC({ year: ecYear, month: def.ecMonth, day: 30 });
  }

  const label = getEcFiscalPeriodLabel(fiscalYear, 'month', fiscalMonthIndex);

  return { from, to, label };
}

/**
 * Get the GC date range for a fiscal quarter.
 * Q1 = Hamle, Nehase+Pagume, Meskerem
 * Q2 = Tikimt, Hidar, Tahsas
 * Q3 = Ter, Yekatit, Megabit
 * Q4 = Miazia, Genbot, Sene
 */
export function getEcFiscalQuarterRange(
  fiscalYear: number,
  quarter: 1 | 2 | 3 | 4,
): { from: Date; to: Date; label: string } {
  if (quarter < 1 || quarter > 4) {
    throw new Error(`Invalid quarter: ${quarter}. Must be 1-4.`);
  }

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;

  const startRange = getEcFiscalMonthRange(fiscalYear, startMonth);
  const endRange = getEcFiscalMonthRange(fiscalYear, endMonth);

  const label = getEcFiscalPeriodLabel(fiscalYear, 'quarter', quarter);

  return { from: startRange.from, to: endRange.to, label };
}

/**
 * Get the GC date range for a full fiscal year (Hamle 1 → Sene 30).
 */
export function getEcFiscalYearRange(
  fiscalYear: number,
): { from: Date; to: Date; label: string } {
  const startRange = getEcFiscalMonthRange(fiscalYear, 1);
  const endRange = getEcFiscalMonthRange(fiscalYear, 12);

  const label = getEcFiscalPeriodLabel(fiscalYear, 'year');

  return { from: startRange.from, to: endRange.to, label };
}

/**
 * Human-readable labels for fiscal periods.
 */
export function getEcFiscalPeriodLabel(
  fiscalYear: number,
  period: 'month' | 'quarter' | 'year',
  value?: number,
): string {
  switch (period) {
    case 'month': {
      if (!value || value < 1 || value > 12) return `FY${fiscalYear}`;
      const def = FISCAL_MONTH_MAP[value - 1];
      return `${def.name}, FY${fiscalYear}`;
    }
    case 'quarter': {
      if (!value || value < 1 || value > 4) return `FY${fiscalYear}`;
      const startMonth = (value - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const startName = FISCAL_MONTH_MAP[startMonth - 1].name;
      const endName = FISCAL_MONTH_MAP[endMonth - 1].name;
      return `Q${value} (${startName}–${endName}), FY${fiscalYear}`;
    }
    case 'year':
      return `FY${fiscalYear}`;
    default:
      return `FY${fiscalYear}`;
  }
}

/**
 * Given any GC date, return which fiscal month index (1-12) it falls in.
 * Used to auto-derive fiscal month when not explicitly provided.
 */
export function getFiscalMonthIndex(gcDate: Date): number {
  const ec = toEC(gcDate);
  if (ec.month === 13) {
    // Pagume merges into fiscal month 2 (Nehase+Pagume)
    return 2;
  }
  if (ec.month >= 11) {
    // Hamle(11) → fiscal month 1, Nehase(12) → fiscal month 2
    return ec.month - 10;
  }
  // Meskerem(1)...Sene(10) → fiscal months 3...12
  return ec.month + 2;
}

export function getAmharicMonthName(month: number): string {
  const amharicMonths = [
    'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታหሱስ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ',
  ];
  return amharicMonths[month - 1] || '';
}

const DATE_FIELDS = [
  'orderDate', 'deliveryDate', 'purchaseDate', 'paidAt', 'dueDate',
  'hireDate', 'completedAt', 'deliveredAt', 'createdAt',
  'updatedAt', 'from', 'to', 'startDate', 'endDate', 'projectDate',
  'purchaseDateGC', 'paidAtGC', 'fromGC', 'toGC',
];

function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

export function convertDatesInObject<T extends Record<string, any>>(
  obj: T,
  calendar: 'gc' | 'ec',
  dateFields?: string[],
): T {
  if (!obj || calendar === 'gc') return obj;

  const fields = dateFields || DATE_FIELDS;
  const result: any = { ...obj };

  for (const key of Object.keys(result)) {
    if (fields.includes(key) && result[key] != null) {
      const dateStr = result[key] instanceof Date
        ? result[key].toISOString()
        : typeof result[key] === 'string'
          ? result[key]
          : null;
      if (dateStr && isDateString(dateStr)) {
        result[key] = convertDate(dateStr, calendar);
      }
    }
  }

  return result;
}

export function convertDatesInArray<T extends Record<string, any>>(
  arr: T[],
  calendar: 'gc' | 'ec',
  dateFields?: string[],
): T[] {
  if (!arr || calendar === 'gc') return arr;
  return arr.map((item) => convertDatesInObject(item, calendar, dateFields));
}

export function ecToGcString(ecDateString: string): string {
  if (!ecDateString) return ecDateString;
  if (/^\d{4}-\d{2}-\d{2}/.test(ecDateString)) return ecDateString;
  return formatToGC(ecDateString);
}

export function convertInputDates<T extends Record<string, any>>(
  body: T,
  calendar: 'gc' | 'ec' = 'gc',
  dateFields?: string[],
): T {
  if (!body || calendar === 'gc') return body;

  const fields = dateFields || DATE_FIELDS;
  const result: any = { ...body };

  for (const key of Object.keys(result)) {
    if (fields.includes(key) && typeof result[key] === 'string') {
      result[key] = ecToGcString(result[key]);
    }
  }

  return result;
}
