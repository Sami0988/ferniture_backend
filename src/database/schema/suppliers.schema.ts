import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    tinNumber: varchar('tin_number', { length: 50 }).notNull().unique(),
    bankAccountNumber: varchar('bank_account_number', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tinIdx: index('idx_suppliers_tin').on(table.tinNumber),
    companyNameIdx: index('idx_suppliers_company_name').on(table.companyName),
  }),
);
