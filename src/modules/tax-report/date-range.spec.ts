import { resolveDateRange } from './date-range.util';

describe('resolveDateRange — ec-fiscal calendar', () => {
  describe('period=fiscalYear', () => {
    it('should return FY2018 range for a Hamle date', () => {
      // Jul 22, 2026 GC = Hamle 15, 2018 EC
      const result = resolveDateRange({
        period: 'year',
        referenceDate: '2026-07-22',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toBe('FY2018');
      expect(result.from).toBeInstanceOf(Date);
      expect(result.to).toBeInstanceOf(Date);
      const diffDays = Math.round(
        (result.to.getTime() - result.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeGreaterThanOrEqual(358);
      expect(diffDays).toBeLessThanOrEqual(365);
    });

    it('should use explicit fiscalYear when provided', () => {
      const result = resolveDateRange({
        period: 'year',
        fiscalYear: 2020,
        calendar: 'ec-fiscal',
      });
      expect(result.label).toBe('FY2020');
    });
  });

  describe('period=fiscalMonth', () => {
    it('should auto-derive fiscal month from referenceDate', () => {
      // Aug 21, 2026 GC = Nehase 15, 2018 EC → fiscal month 2
      const result = resolveDateRange({
        period: 'month',
        referenceDate: '2026-08-21',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Nehase–Pagume');
      expect(result.label).toContain('FY2018');
    });

    it('should use explicit fiscalMonth when provided', () => {
      const result = resolveDateRange({
        period: 'month',
        fiscalYear: 2018,
        fiscalMonth: 1,
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Hamle');
      expect(result.label).toContain('FY2018');
    });
  });

  describe('period=fiscalQuarter', () => {
    it('should auto-derive quarter from referenceDate', () => {
      // Aug 21, 2026 GC = Nehase 15, 2018 EC → fiscal month 2 → Q1
      const result = resolveDateRange({
        period: 'quarter',
        referenceDate: '2026-08-21',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Q1');
      expect(result.label).toContain('FY2018');
    });

    it('should use explicit quarter when provided', () => {
      const result = resolveDateRange({
        period: 'quarter',
        fiscalYear: 2018,
        quarter: 2,
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Q2');
      expect(result.label).toContain('Tikimt');
      expect(result.label).toContain('FY2018');
    });
  });

  describe('period=fiscalDay', () => {
    it('should return a single day with FY label', () => {
      const result = resolveDateRange({
        period: 'day',
        referenceDate: '2026-07-22',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('FY2018');
    });
  });

  describe('period=fiscalWeek', () => {
    it('should return a week with FY label', () => {
      const result = resolveDateRange({
        period: 'week',
        referenceDate: '2026-07-22',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('FY2018');
    });
  });

  describe('period=custom with ec-fiscal', () => {
    it('should still work with custom dates and ec-fiscal calendar', () => {
      const result = resolveDateRange({
        period: 'custom',
        from: '2026-07-08',
        to: '2026-08-06',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Jul');
    });
  });

  describe('Fiscal month auto-derivation', () => {
    it('should map Jul 22 2026 (Hamle) to fiscal month 1', () => {
      const result = resolveDateRange({
        period: 'month',
        referenceDate: '2026-07-22',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Hamle');
    });

    it('should map Sep 7 2026 (Pagume) to fiscal month 2', () => {
      const result = resolveDateRange({
        period: 'month',
        referenceDate: '2026-09-07',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Nehase–Pagume');
    });

    it('should map Sep 15 2026 (Meskerem) to fiscal month 3', () => {
      const result = resolveDateRange({
        period: 'month',
        referenceDate: '2026-09-15',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Meskerem');
    });

    it('should map Jun 22 2027 (Sene) to fiscal month 12', () => {
      const result = resolveDateRange({
        period: 'month',
        referenceDate: '2027-06-22',
        calendar: 'ec-fiscal',
      });
      expect(result.label).toContain('Sene');
    });
  });
});

describe('resolveDateRange — existing calendars still work', () => {
  it('gc calendar month', () => {
    const result = resolveDateRange({
      period: 'month',
      referenceDate: '2026-07-22',
      calendar: 'gc',
    });
    expect(result.label).toBe('July 2026');
  });

  it('ec calendar month', () => {
    const result = resolveDateRange({
      period: 'month',
      referenceDate: '2026-07-22',
      calendar: 'ec',
    });
    expect(result.label).toContain('Hamle');
  });

  it('no calendar defaults to gc', () => {
    const result = resolveDateRange({
      period: 'month',
      referenceDate: '2026-07-22',
    });
    expect(result.label).toBe('July 2026');
  });
});
