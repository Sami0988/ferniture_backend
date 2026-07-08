import { pgTable, uuid, varchar, text, timestamp, date, doublePrecision } from 'drizzle-orm/pg-core';
import { divisionEnum, projectStatusEnum, priorityEnum, attachmentTypeEnum, paymentMethodEnum } from './enums';
import { users } from './users.schema';
import { customers } from './customers.schema';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectNumber: varchar('project_number', { length: 30 }).notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  division: divisionEnum('division').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('new'),
  priority: priorityEnum('priority').notNull().default('normal'),
  totalPrice: doublePrecision('total_price'),
  paidNowPrice: doublePrecision('paid_now_price').default(0),
  orderDate: date('order_date').notNull(),
  deliveryDate: date('delivery_date'),
  completedAt: timestamp('completed_at'),
  deliveredAt: timestamp('delivered_at'),
  leadEmployeeId: uuid('lead_employee_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectAssignees = pgTable('project_assignees', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => users.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const projectAttachments = pgTable('project_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileType: attachmentTypeEnum('file_type').notNull(),
  caption: varchar('caption', { length: 200 }),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectStatusHistory = pgTable('project_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  oldStatus: projectStatusEnum('old_status'),
  newStatus: projectStatusEnum('new_status').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  notes: text('notes'),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

export const projectPayments = pgTable('project_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  method: paymentMethodEnum('method').notNull(),
  note: text('note'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
