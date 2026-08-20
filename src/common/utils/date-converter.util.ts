import { toEthiopian, toGregorian } from 'ethiopian-calendar-new';

const EC_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Ter', 'Yekatit',
  'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehasa', 'Pagume',
];

export function isGcLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getEcPagumeDays(ecYear: number): number {
  return ecYear % 4 === 3 ? 6 : 5;
}

export function toEC(gcDate: Date | string): {
  year: number;
  month: number;
  day: number;
  monthName: string;
  formatted: string;
} {
  const date = typeof gcDate === 'string' ? new Date(gcDate) : new Date(gcDate);
  const gcYear = date.getFullYear();
  const gcMonth = date.getMonth() + 1;
  const gcDay = date.getDate();

  const ec = toEthiopian(gcYear, gcMonth, gcDay);
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

  const gc = toGregorian(ecYear, ecMonth, ecDay);
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
  calendar: 'gc' | 'ec' = 'gc',
): string | null {
  if (!dateString) return null;

  const dateStr = typeof dateString === 'string'
    ? dateString
    : dateString instanceof Date
      ? dateString.toISOString()
      : String(dateString);

  if (calendar === 'ec') {
    return formatToEC(dateStr);
  }

  return dateStr.split('T')[0];
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
