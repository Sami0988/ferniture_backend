import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { divisionEnum } from './enums';

export const projectsToSell = pgTable(
  'projects_to_sell',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),
    division: divisionEnum('division').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    image: text('image'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('pts_active_idx').on(table.isActive),
    divisionIdx: index('pts_division_idx').on(table.division),
    typeIdx: index('pts_type_idx').on(table.type),
  }),
);
