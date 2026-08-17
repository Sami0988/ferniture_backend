import { BadRequestException } from '@nestjs/common';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  parseISO,
  format,
} from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRangeInput {
  period?: Period;
  referenceDate?: string;
  from?: string;
  to?: string;
}

export function resolveDateRange(input: DateRangeInput): {
  from: Date;
  to: Date;
  label: string;
} {
  const { period, referenceDate, from: customFrom, to: customTo } = input;

  if (period === 'custom') {
    if (!customFrom || !customTo) {
      throw new BadRequestException(
        'period=custom requires both "from" and "to" query params',
      );
    }
    const fromDate = parseISO(customFrom);
    const toDate = parseISO(customTo);
    if (fromDate > toDate) {
      throw new BadRequestException('"from" date must be before or equal to "to" date');
    }
    return {
      from: startOfDay(fromDate),
      to: endOfDay(toDate),
      label: `${format(fromDate, 'MMM d, yyyy')} – ${format(toDate, 'MMM d, yyyy')}`,
    };
  }

  if (!period) {
    throw new BadRequestException(
      'Either "period" or "period=custom" with "from"/"to" is required',
    );
  }

  const ref = referenceDate ? parseISO(referenceDate) : new Date();
  let rangeFrom: Date;
  let rangeTo: Date;
  let label: string;

  switch (period) {
    case 'day':
      rangeFrom = startOfDay(ref);
      rangeTo = endOfDay(ref);
      label = format(ref, 'MMMM d, yyyy');
      break;
    case 'week':
      rangeFrom = startOfWeek(ref, { weekStartsOn: 1 });
      rangeTo = endOfWeek(ref, { weekStartsOn: 1 });
      label = `Week of ${format(rangeFrom, 'MMM d, yyyy')}`;
      break;
    case 'month':
      rangeFrom = startOfMonth(ref);
      rangeTo = endOfMonth(ref);
      label = format(ref, 'MMMM yyyy');
      break;
    case 'quarter':
      rangeFrom = startOfQuarter(ref);
      rangeTo = endOfQuarter(ref);
      label = `Q${Math.floor(ref.getMonth() / 3) + 1} ${format(ref, 'yyyy')}`;
      break;
    case 'year':
      rangeFrom = startOfYear(ref);
      rangeTo = endOfYear(ref);
      label = format(ref, 'yyyy');
      break;
    default:
      throw new BadRequestException(
        `Invalid period "${period}". Must be one of: day, week, month, quarter, year, custom`,
      );
  }

  return { from: rangeFrom, to: rangeTo, label };
}
