import { pgTable, uuid, varchar, date, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { suppliers } from './suppliers.schema';
import { users } from './users.schema';

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    fsNumber: varchar('fs_number', { length: 100 }).notNull(),
    bankTransactionNumber: varchar('bank_transaction_number', { length: 100 }),
    purchaseDate: date('purchase_date').notNull(),
    amountBeforeVat: numeric('amount_before_vat', { precision: 14, scale: 2 }).notNull(),
    vatAmount: numeric('vat_amount', { precision: 14, scale: 2 }).notNull(),
    withholdingAmount: numeric('withholding_amount', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    supplierIdIdx: index('idx_purchases_supplier_id').on(table.supplierId),
    purchaseDateIdx: index('idx_purchases_purchase_date').on(table.purchaseDate),
    createdAtIdx: index('idx_purchases_created_at').on(table.createdAt),
  }),
);

export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => purchases.id, { onDelete: 'cascade' }),
    materialName: varchar('material_name', { length: 255 }).notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
  },
  (table) => ({
    purchaseIdIdx: index('idx_purchase_items_purchase_id').on(table.purchaseId),
  }),
);
