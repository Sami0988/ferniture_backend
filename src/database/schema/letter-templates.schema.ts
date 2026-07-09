import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const letterTemplates = pgTable('letter_templates', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),

  htmlContent: text('html_content').notNull(),
  cssContent: text('css_content'),

  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type LetterTemplate = typeof letterTemplates.$inferSelect;
export type NewLetterTemplate = typeof letterTemplates.$inferInsert;
