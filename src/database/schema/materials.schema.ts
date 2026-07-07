import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { materialCategoryEnum } from './enums';
import { projects } from './projects.schema';

export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  category: materialCategoryEnum('category').notNull(),
  swatchImageUrl: text('swatch_image_url'),
  images: jsonb('images').$type<string[]>().default([]),
  description: text('description'),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }),
  unit: varchar('unit', { length: 20 }),
  supplier: varchar('supplier', { length: 150 }),
  isPublicVisible: boolean('is_public_visible').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectMaterials = pgTable('project_materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').notNull().references(() => materials.id),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  clientApproved: boolean('client_approved').notNull().default(false),
  approvedAt: timestamp('approved_at'),
  samplePhotoUrl: text('sample_photo_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
