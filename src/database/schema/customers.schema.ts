import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { customerTypeEnum } from './enums';
import { users } from './users.schema';

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 150 }),
  type: customerTypeEnum('type').notNull().default('personal'),
  imageUrl: text('image_url'),
  address: text('address'),
  tinNumber: varchar('tin_number', { length: 30 }),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
