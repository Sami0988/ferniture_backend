import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { proformaUnitEnum } from './enums';
import { projects } from './projects.schema';
import { customers } from './customers.schema';
import { users } from './users.schema';

export const proformas = pgTable(
  'proformas',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    proformaNumber: varchar('proforma_number', { length: 30 }).notNull().unique(),

    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    billedToName: varchar('billed_to_name', { length: 255 }).notNull(),
    billedToAddress: text('billed_to_address'),
    billedToPhone: varchar('billed_to_phone', { length: 20 }),
    billedToTin: varchar('billed_to_tin', { length: 30 }),

    subject: varchar('subject', { length: 500 }),
    notes: text('notes'),

    validityDays: integer('validity_days').notNull().default(7),

    materialSummary: varchar('material_summary', { length: 500 }),

    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
    vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).notNull().default('15.00'),
    vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull().default('draft'),

    pdfUrl: text('pdf_url'),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('proformas_project_idx').on(table.projectId),
    customerIdx: index('proformas_customer_idx').on(table.customerId),
    statusIdx: index('proformas_status_idx').on(table.status),
  }),
);

export const proformaItems = pgTable('proforma_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  proformaId: uuid('proforma_id')
    .notNull()
    .references(() => proformas.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unit: proformaUnitEnum('unit').notNull().default('PCS'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type Proforma = typeof proformas.$inferSelect;
export type NewProforma = typeof proformas.$inferInsert;
export type ProformaItem = typeof proformaItems.$inferSelect;
export type NewProformaItem = typeof proformaItems.$inferInsert;
