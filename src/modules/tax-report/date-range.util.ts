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
import {
  getEcMonthRange,
  getEcYearRange,
  getEcQuarterRange,
  getEcPeriodLabel,
} from '../../common/utils/date-converter.util';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
type Calendar = 'gc' | 'ec';

interface DateRangeInput {
  period?: Period;
  referenceDate?: string;
  from?: string;
  to?: string;
  calendar?: Calendar;
}

export function resolveDateRange(input: DateRangeInput): {
  from: Date;
  to: Date;
  label: string;
} {
  const { period, referenceDate, from: customFrom, to: customTo, calendar } = input;
  const cal = calendar || 'gc';

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

  if (cal === 'ec') {
    return resolveEcDateRange(ref, period);
  }

  return resolveGcDateRange(ref, period);
}

function resolveGcDateRange(ref: Date, period: Period): {
  from: Date;
  to: Date;
  label: string;
} {
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

function resolveEcDateRange(ref: Date, period: Period): {
  from: Date;
  to: Date;
  label: string;
} {
  switch (period) {
    case 'day': {
      const dayStart = startOfDay(ref);
      const dayEnd = endOfDay(ref);
      return { from: dayStart, to: dayEnd, label: getEcPeriodLabel(ref, 'day') };
    }
    case 'week': {
      const weekFrom = startOfWeek(ref, { weekStartsOn: 1 });
      const weekTo = endOfWeek(ref, { weekStartsOn: 1 });
      return { from: weekFrom, to: weekTo, label: getEcPeriodLabel(ref, 'week') };
    }
    case 'month': {
      const { from, to } = getEcMonthRange(ref);
      return { from, to, label: getEcPeriodLabel(ref, 'month') };
    }
    case 'quarter': {
      const { from, to } = getEcQuarterRange(ref);
      return { from, to, label: getEcPeriodLabel(ref, 'quarter') };
    }
    case 'year': {
      const { from, to } = getEcYearRange(ref);
      return { from, to, label: getEcPeriodLabel(ref, 'year') };
    }
    default:
      throw new BadRequestException(
        `Invalid period "${period}". Must be one of: day, week, month, quarter, year, custom`,
      );
  }
}
