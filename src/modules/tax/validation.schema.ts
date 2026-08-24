import { z } from 'zod';

// --- Suppliers ---
export const createSupplierSchema = z.object({
  companyName: z.string().min(2).max(255),
  tinNumber: z.string().regex(/^\d{10}$/, 'TIN must be exactly 10 digits'),
  bankAccountNumber: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// --- Purchases ---
export const purchaseItemSchema = z.object({
  materialName: z.string().min(1).max(255),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  fsNumber: z.string().min(1).max(100),
  bankTransactionNumber: z.string().max(100).optional(),
  purchaseDate: z.string().date('Invalid date format (YYYY-MM-DD)'),
  items: z
    .array(purchaseItemSchema)
    .min(1, 'At least one item is required'),
});

export const updatePurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  fsNumber: z.string().min(1).max(100).optional(),
  bankTransactionNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().date().optional(),
  items: z.array(purchaseItemSchema).min(1).optional(),
});

// --- Work Projects (VAT fields) ---
export const projectVatFields = z.object({
  priceBeforeVat: z.number().nonnegative('Price before VAT must be non-negative'),
});

// --- Tax Report ---
export const taxReportQuerySchema = z
  .object({
    period: z
      .enum(['day', 'week', 'month', 'quarter', 'year', 'custom'])
      .optional(),
    referenceDate: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    calendar: z.enum(['gc', 'ec', 'ec-fiscal']).optional(),
    fiscalYear: z.coerce.number().int().min(2000).max(3000).optional(),
    fiscalMonth: z.coerce.number().int().min(1).max(12).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
  })
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return !!data.from && !!data.to;
      }
      return !!data.period;
    },
    {
      message:
        'period=custom requires both "from" and "to"; other periods require "period"',
    },
  )
  .refine(
    (data) => {
      // fiscalMonth only valid with calendar=ec-fiscal and period=month
      if (data.fiscalMonth !== undefined) {
        return data.calendar === 'ec-fiscal' && data.period === 'month';
      }
      return true;
    },
    {
      message: 'fiscalMonth is only valid with calendar=ec-fiscal and period=month',
    },
  )
  .refine(
    (data) => {
      // quarter only valid with period=quarter
      if (data.quarter !== undefined) {
        return data.period === 'quarter';
      }
      return true;
    },
    {
      message: 'quarter param is only valid with period=quarter',
    },
  );

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type TaxReportQueryInput = z.infer<typeof taxReportQuerySchema>;
