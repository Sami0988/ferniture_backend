import { pgTable, uuid, varchar, text, smallint, integer, boolean, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';
import { divisionEnum, contactStatusEnum } from './enums';
import { projects } from './projects.schema';
import { materials } from './materials.schema';

export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 150 }).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  rating: smallint('rating').notNull(),
  reviewText: text('review_text').notNull(),
  imageUrl: text('image_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const galleryImages = pgTable('gallery_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 150 }),
  division: divisionEnum('division').notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  imageUrl: text('image_url').notNull(),
  roomType: varchar('room_type', { length: 50 }),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  division: divisionEnum('division').notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  materialId: uuid('material_id').references(() => materials.id),
  priceRangeMin: numeric('price_range_min', { precision: 12, scale: 2 }),
  priceRangeMax: numeric('price_range_max', { precision: 12, scale: 2 }),
  imageUrls: jsonb('image_urls').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 20 }),
  message: text('message').notNull(),
  status: contactStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  division: divisionEnum('division'),
  description: text('description').notNull(),
  budgetRange: varchar('budget_range', { length: 50 }),
  status: contactStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const faqs = pgTable('faqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  question: varchar('question', { length: 250 }).notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').notNull().default(true),
});

