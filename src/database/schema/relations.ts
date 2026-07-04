import { relations } from 'drizzle-orm';
import { users, employeeProfiles, refreshTokens } from './users.schema';
import { customers } from './customers.schema';
import {
  projects,
  projectAssignees,
  projectAttachments,
  projectStatusHistory,
} from './projects.schema';
import { materials, projectMaterials } from './materials.schema';
import { invoices, invoiceItems, payments } from './invoices.schema';
import { notifications, fcmTokens } from './notifications.schema';
import {
  testimonials,
  galleryImages,
  products,
} from './website.schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  employeeProfile: one(employeeProfiles, {
    fields: [users.id],
    references: [employeeProfiles.userId],
  }),
  refreshTokens: many(refreshTokens),
  createdProjects: many(projects, { relationName: 'createdBy' }),
  leadProjects: many(projects, { relationName: 'leadEmployee' }),
  assignments: many(projectAssignees),
  notifications: many(notifications),
  fcmTokens: many(fcmTokens),
}));

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [employeeProfiles.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
  projects: many(projects),
  invoices: many(invoices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  leadEmployee: one(users, {
    fields: [projects.leadEmployeeId],
    references: [users.id],
    relationName: 'leadEmployee',
  }),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  assignees: many(projectAssignees),
  attachments: many(projectAttachments),
  statusHistory: many(projectStatusHistory),
  materials: many(projectMaterials),
  invoices: many(invoices),
  galleryImages: many(galleryImages),
  testimonials: many(testimonials),
}));

export const projectAssigneesRelations = relations(projectAssignees, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssignees.projectId],
    references: [projects.id],
  }),
  employee: one(users, {
    fields: [projectAssignees.employeeId],
    references: [users.id],
  }),
}));

export const projectAttachmentsRelations = relations(projectAttachments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAttachments.projectId],
    references: [projects.id],
  }),
  uploadedByUser: one(users, {
    fields: [projectAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const projectStatusHistoryRelations = relations(projectStatusHistory, ({ one }) => ({
  project: one(projects, {
    fields: [projectStatusHistory.projectId],
    references: [projects.id],
  }),
  changedByUser: one(users, {
    fields: [projectStatusHistory.changedBy],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  projectMaterials: many(projectMaterials),
}));

export const projectMaterialsRelations = relations(projectMaterials, ({ one }) => ({
  project: one(projects, {
    fields: [projectMaterials.projectId],
    references: [projects.id],
  }),
  material: one(materials, {
    fields: [projectMaterials.materialId],
    references: [materials.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  verifiedByUser: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedProject: one(projects, {
    fields: [notifications.relatedProjectId],
    references: [projects.id],
  }),
}));

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  user: one(users, {
    fields: [fcmTokens.userId],
    references: [users.id],
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  project: one(projects, {
    fields: [testimonials.projectId],
    references: [projects.id],
  }),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  project: one(projects, {
    fields: [galleryImages.projectId],
    references: [projects.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  material: one(materials, {
    fields: [products.materialId],
    references: [materials.id],
  }),
}));
