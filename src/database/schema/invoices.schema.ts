import { pgTable, uuid, varchar, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, paymentMethodEnum } from './enums';
import { projects } from './projects.schema';
import { customers } from './customers.schema';
import { users } from './users.schema';

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 30 }).notNull().unique(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).notNull().default('15.00'),
  vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
  pdfUrl: text('pdf_url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 200 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  paidAt: timestamp('paid_at').notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
