import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';
import { customers } from './customers.schema';
import { users } from './users.schema';
import { letterTemplates } from './letter-templates.schema';

export const paymentLetters = pgTable(
  'payment_letters',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    letterNumber: varchar('letter_number', { length: 30 }).notNull().unique(),

    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    templateId: uuid('template_id').references(() => letterTemplates.id, {
      onDelete: 'set null',
    }),

    recipientCompanyName: varchar('recipient_company_name', { length: 255 }).notNull(),
    recipientName: varchar('recipient_name', { length: 255 }),
    recipientTitle: varchar('recipient_title', { length: 255 }),
    recipientAddress: text('recipient_address'),

    subject: varchar('subject', { length: 500 }).notNull(),
    body: text('body').notNull(),

    referenceNumber: varchar('reference_number', { length: 100 }),
    dueDate: date('due_date'),

    pdfUrl: text('pdf_url'),

    status: varchar('status', { length: 20 }).notNull().default('draft'),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('payment_letters_project_idx').on(table.projectId),
    customerIdx: index('payment_letters_customer_idx').on(table.customerId),
    statusIdx: index('payment_letters_status_idx').on(table.status),
  }),
);

export type PaymentLetter = typeof paymentLetters.$inferSelect;
export type NewPaymentLetter = typeof paymentLetters.$inferInsert;
