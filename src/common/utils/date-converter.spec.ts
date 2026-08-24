import {
  getFiscalYearForDate,
  getFiscalMonthIndex,
  getEcFiscalMonthRange,
  getEcFiscalQuarterRange,
  getEcFiscalYearRange,
  getEcFiscalPeriodLabel,
  getEcPagumeDays,
  FISCAL_MONTH_MAP,
} from './date-converter.util';

describe('Ethiopian Fiscal Year Utilities', () => {
  describe('FISCAL_MONTH_MAP', () => {
    it('should have 12 entries', () => {
      expect(FISCAL_MONTH_MAP).toHaveLength(12);
    });

    it('should start with Hamle (ecMonth 11)', () => {
      expect(FISCAL_MONTH_MAP[0].ecMonth).toBe(11);
      expect(FISCAL_MONTH_MAP[0].name).toBe('Hamle');
      expect(FISCAL_MONTH_MAP[0].mergePagume).toBe(false);
    });

    it('should have Nehase+Pagume merged as fiscal month 2', () => {
      expect(FISCAL_MONTH_MAP[1].ecMonth).toBe(12);
      expect(FISCAL_MONTH_MAP[1].name).toBe('Nehase–Pagume');
      expect(FISCAL_MONTH_MAP[1].mergePagume).toBe(true);
    });

    it('should end with Sene (ecMonth 10)', () => {
      expect(FISCAL_MONTH_MAP[11].ecMonth).toBe(10);
      expect(FISCAL_MONTH_MAP[11].name).toBe('Sene');
      expect(FISCAL_MONTH_MAP[11].mergePagume).toBe(false);
    });
  });

  describe('getFiscalYearForDate', () => {
    it('should return current EC year for a date in Hamle', () => {
      // Hamle 15, 2018 EC ≈ Jul 22, 2026 GC (Hamle 1 = Jul 8, 2026)
      const gcDate = new Date(2026, 6, 22);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });

    it('should return current EC year for a date in Nehase', () => {
      // Nehase 15, 2018 EC ≈ Aug 21, 2026 GC (Nehase 1 = Aug 7, 2026)
      const gcDate = new Date(2026, 7, 21);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });

    it('should return current EC year for a date in Pagume', () => {
      // Pagume 2, 2018 EC = Sep 7, 2026 GC
      const gcDate = new Date(2026, 8, 7);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });

    it('should return previous EC year for a date in Meskerem', () => {
      // Meskerem 1, 2019 EC = Sep 11, 2026 GC
      const gcDate = new Date(2026, 8, 15);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });

    it('should return previous EC year for a date in Sene', () => {
      // Sene 15, 2019 EC ≈ Jun 22, 2027 GC
      const gcDate = new Date(2027, 5, 22);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });

    it('should return previous EC year for a date in Genbot', () => {
      // Genbot 15, 2019 EC ≈ May 23, 2027 GC
      const gcDate = new Date(2027, 4, 23);
      const fy = getFiscalYearForDate(gcDate);
      expect(fy).toBe(2018);
    });
  });

  describe('getFiscalMonthIndex', () => {
    it('should return 1 for a date in Hamle', () => {
      // Hamle 15, 2018 EC ≈ Jul 22, 2026 GC
      const gcDate = new Date(2026, 6, 22);
      expect(getFiscalMonthIndex(gcDate)).toBe(1);
    });

    it('should return 2 for a date in Nehase', () => {
      // Nehase 15, 2018 EC ≈ Aug 21, 2026 GC
      const gcDate = new Date(2026, 7, 21);
      expect(getFiscalMonthIndex(gcDate)).toBe(2);
    });

    it('should return 2 for a date in Pagume', () => {
      // Pagume 2, 2018 EC = Sep 7, 2026 GC
      const gcDate = new Date(2026, 8, 7);
      expect(getFiscalMonthIndex(gcDate)).toBe(2);
    });

    it('should return 3 for a date in Meskerem', () => {
      // Meskerem 1, 2019 EC = Sep 11, 2026 GC
      const gcDate = new Date(2026, 8, 15);
      expect(getFiscalMonthIndex(gcDate)).toBe(3);
    });

    it('should return 12 for a date in Sene', () => {
      // Sene 15, 2019 EC ≈ Jun 22, 2027 GC
      const gcDate = new Date(2027, 5, 22);
      expect(getFiscalMonthIndex(gcDate)).toBe(12);
    });
  });

  describe('getEcPagumeDays', () => {
    it('should return 5 for all years (matches library behavior)', () => {
      // The ethiopian-calendar-new library treats Pagume as always 5 days.
      // Day 6 wraps to Meskerem 1 of next year.
      expect(getEcPagumeDays(2015)).toBe(5);
      expect(getEcPagumeDays(2016)).toBe(5);
      expect(getEcPagumeDays(2017)).toBe(5);
      expect(getEcPagumeDays(2018)).toBe(5);
      expect(getEcPagumeDays(2019)).toBe(5);
    });
  });

  describe('getEcFiscalMonthRange', () => {
    it('should return Hamle 1 → Hamle 30 for fiscal month 1', () => {
      const range = getEcFiscalMonthRange(2018, 1);
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);
      expect(range.label).toContain('Hamle');
      expect(range.label).toContain('FY2018');

      // Hamle 1, 2018 EC ≈ Jul 8, 2025 GC
      const fromEc = range.from.toISOString().split('T')[0];
      const toEc = range.to.toISOString().split('T')[0];

      // Check the range spans approximately 30 days
      const diffDays = Math.round(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(29); // 30 days inclusive = 29 days difference
    });

    it('should extend through Pagume for fiscal month 2 (Nehase+Pagume)', () => {
      const range = getEcFiscalMonthRange(2018, 2);
      expect(range.label).toContain('Nehase–Pagume');
      expect(range.label).toContain('FY2018');

      // Nehase+Pagume should span 30 + 5 days = 34 days
      const diffDays = Math.round(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(34);
    });

    it('should use fiscalYear + 1 EC year for Meskerem-Sene (fiscal months 3-12)', () => {
      const range = getEcFiscalMonthRange(2018, 3);
      expect(range.label).toContain('Meskerem');
      expect(range.label).toContain('FY2018');
    });

    it('should throw for invalid fiscal month index', () => {
      expect(() => getEcFiscalMonthRange(2018, 0)).toThrow('Invalid fiscal month index');
      expect(() => getEcFiscalMonthRange(2018, 13)).toThrow('Invalid fiscal month index');
    });
  });

  describe('getEcFiscalQuarterRange', () => {
    it('Q1 should span Hamle → end of Nehase+Pagume', () => {
      const range = getEcFiscalQuarterRange(2018, 1);
      expect(range.label).toContain('Q1');
      expect(range.label).toContain('Hamle');
      expect(range.label).toContain('FY2018');

      // Q1 = 3 fiscal months ≈ 30 + 34/35 + 30 = ~94-95 days
      const diffDays = Math.round(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeGreaterThanOrEqual(88);
      expect(diffDays).toBeLessThanOrEqual(95);
    });

    it('Q2 should span Tikimt → Tahsas', () => {
      const range = getEcFiscalQuarterRange(2018, 2);
      expect(range.label).toContain('Q2');
      expect(range.label).toContain('Tikimt');
    });

    it('Q3 should span Ter → Megabit', () => {
      const range = getEcFiscalQuarterRange(2018, 3);
      expect(range.label).toContain('Q3');
      expect(range.label).toContain('Ter');
    });

    it('Q4 should span Miazia → Sene', () => {
      const range = getEcFiscalQuarterRange(2018, 4);
      expect(range.label).toContain('Q4');
      expect(range.label).toContain('Miazia');
    });

    it('should throw for invalid quarter', () => {
      expect(() => getEcFiscalQuarterRange(2018, 0 as any)).toThrow('Invalid quarter');
      expect(() => getEcFiscalQuarterRange(2018, 5 as any)).toThrow('Invalid quarter');
    });
  });

  describe('getEcFiscalYearRange', () => {
    it('should span from Hamle 1 to end of Sene', () => {
      const range = getEcFiscalYearRange(2018);
      expect(range.label).toBe('FY2018');
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);

      // Full fiscal year ≈ 364-365 days
      const diffDays = Math.round(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeGreaterThanOrEqual(358);
      expect(diffDays).toBeLessThanOrEqual(365);
    });
  });

  describe('getEcFiscalPeriodLabel', () => {
    it('should format month label', () => {
      expect(getEcFiscalPeriodLabel(2018, 'month', 1)).toBe('Hamle, FY2018');
      expect(getEcFiscalPeriodLabel(2018, 'month', 2)).toBe('Nehase–Pagume, FY2018');
      expect(getEcFiscalPeriodLabel(2018, 'month', 12)).toBe('Sene, FY2018');
    });

    it('should format quarter label', () => {
      expect(getEcFiscalPeriodLabel(2018, 'quarter', 1)).toContain('Q1');
      expect(getEcFiscalPeriodLabel(2018, 'quarter', 1)).toContain('FY2018');
    });

    it('should format year label', () => {
      expect(getEcFiscalPeriodLabel(2018, 'year')).toBe('FY2018');
    });

    it('should fallback to FY for invalid month', () => {
      expect(getEcFiscalPeriodLabel(2018, 'month', 0)).toBe('FY2018');
      expect(getEcFiscalPeriodLabel(2018, 'month', 13)).toBe('FY2018');
    });
  });

  describe('Fiscal year boundary', () => {
    it('last day of Sene and first day of Hamle should be in different fiscal years', () => {
      // Sene 30, 2019 EC = Jul 7, 2027 GC
      const seneDate = new Date(2027, 6, 7);
      // Hamle 1, 2020 EC = Jul 8, 2027 GC
      const hamleDate = new Date(2027, 6, 8);

      const fySene = getFiscalYearForDate(seneDate);
      const fyHamle = getFiscalYearForDate(hamleDate);

      expect(fyHamle).toBe(fySene + 1);
    });
  });
});
