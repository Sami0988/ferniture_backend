import { pgTable, uuid, varchar, text, smallint, integer, boolean, timestamp, jsonb, numeric, index } from 'drizzle-orm/pg-core';
import { divisionEnum, contactStatusEnum, blogCategoryEnum } from './enums';
import { projects } from './projects.schema';
import { materials } from './materials.schema';

export const testimonials = pgTable(
  'testimonials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerName: varchar('customer_name', { length: 150 }).notNull(),
    company: varchar('company', { length: 200 }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),
    reviewText: text('review_text').notNull(),
    imageUrl: text('image_url'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isApproved: boolean('is_approved').notNull().default(false),
    translations: jsonb('translations').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    approvedIdx: index('testimonial_approved_idx').on(table.isApproved),
  }),
);

export const galleryImages = pgTable(
  'gallery_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 150 }),
    division: divisionEnum('division').notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    roomType: varchar('room_type', { length: 50 }),
    aspect: varchar('aspect', { length: 10 }).default('square'),
    isFeatured: boolean('is_featured').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    divisionIdx: index('gallery_division_idx').on(table.division),
    projectIdx: index('gallery_project_idx').on(table.projectId),
  }),
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    division: divisionEnum('division').notNull(),
    category: varchar('category', { length: 100 }),
    description: text('description'),
    materialId: uuid('material_id').references(() => materials.id),
    price: numeric('price', { precision: 12, scale: 2 }),
    mainImage: text('main_image'),
    featureImages: jsonb('feature_images').$type<string[]>().default([]),
    isFeatured: boolean('is_featured').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('products_active_idx').on(table.isActive),
    divisionIdx: index('products_division_idx').on(table.division),
    createdIdx: index('products_created_idx').on(table.createdAt),
    materialIdx: index('products_material_idx').on(table.materialId),
  }),
);

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 20 }),
  subject: varchar('subject', { length: 250 }),
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
  translations: jsonb('translations').default({}),
}, (table) => ({
  faqActiveIdx: index('faq_active_idx').on(table.isActive),
  faqSortIdx: index('faq_sort_idx').on(table.sortOrder),
}));

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 250 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull().unique(),
    excerpt: varchar('excerpt', { length: 500 }),
    content: text('content').notNull(),
    category: blogCategoryEnum('category').notNull().default('general'),
    coverImage: text('cover_image').notNull(),
    featureImages: jsonb('feature_images').$type<string[]>().default([]),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at'),
    translations: jsonb('translations').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    blogSlugIdx: index('blog_slug_idx').on(table.slug),
    blogCategoryIdx: index('blog_category_idx').on(table.category),
    blogPublishedIdx: index('blog_published_idx').on(table.isPublished),
    blogCreatedIdx: index('blog_created_idx').on(table.publishedAt),
  }),
);

export const aboutPage = pgTable('about_page', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 250 }).notNull().default('About Us'),
  description1: text('description1').notNull().default(''),
  description2: text('description2').notNull().default(''),
  imageUrl: text('image_url'),
  yearsOfExperience: integer('years_of_experience').notNull().default(0),
  projectsCompleted: integer('projects_completed').notNull().default(0),
  countriesServed: integer('countries_served').notNull().default(0),
  skilledArtisans: integer('skilled_artisans').notNull().default(0),
  translations: jsonb('translations').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable(
  'services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    description: text('description').notNull(),
    bulletPoints: jsonb('bullet_points').$type<string[]>().default([]),
    coverImage: text('cover_image').notNull(),
    featureImages: jsonb('feature_images').$type<string[]>().default([]),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    translations: jsonb('translations').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    serviceActiveIdx: index('service_active_idx').on(table.isActive),
    serviceSortIdx: index('service_sort_idx').on(table.sortOrder),
    serviceCategoryIdx: index('service_category_idx').on(table.category),
  }),
);

export const beforeAfter = pgTable(
  'before_after',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 200 }),
    beforeImage: text('before_image').notNull(),
    afterImage: text('after_image').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    translations: jsonb('translations').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    baActiveIdx: index('ba_active_idx').on(table.isActive),
    baSortIdx: index('ba_sort_idx').on(table.sortOrder),
  }),
);

export const contactInfo = pgTable('contact_info', {
  id: uuid('id').defaultRandom().primaryKey(),
  address: varchar('address', { length: 500 }).notNull().default(''),
  phone1: varchar('phone1', { length: 30 }).notNull().default(''),
  phone2: varchar('phone2', { length: 30 }),
  email: varchar('email', { length: 200 }).notNull().default(''),
  weekdayHours: varchar('weekday_hours', { length: 100 }).notNull().default('Mon – Fri: 8:00 AM – 6:00 PM'),
  saturdayHours: varchar('saturday_hours', { length: 100 }).notNull().default('Sat: 8:00 AM – 1:00 PM'),
  mapUrl: text('map_url'),
  latitude: varchar('latitude', { length: 30 }),
  longitude: varchar('longitude', { length: 30 }),
  translations: jsonb('translations').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

