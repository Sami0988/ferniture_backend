import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'super_admin', 'manager', 'viewer', 'employee',
]);

export const employeeSpecialtyEnum = pgEnum('employee_specialty', [
  'carpenter', 'aluminum_fabricator', 'interior_designer', 'delivery', 'other',
]);

export const divisionEnum = pgEnum('division', [
  'furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled',
]);

export const priorityEnum = pgEnum('priority', ['normal', 'urgent', 'vip']);

export const attachmentTypeEnum = pgEnum('attachment_type', [
  'photo', 'drawing', 'document', 'progress_photo', 'completion_photo',
]);

export const materialCategoryEnum = pgEnum('material_category', [
  'wood_species', 'wood_finish', 'aluminum_profile', 'aluminum_color',
  'hardware', 'glass', 'other',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 'bank_transfer', 'telebirr', 'cbe_birr',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid', 'partial', 'paid',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'job_assigned', 'job_completed', 'status_changed', 'overdue',
  'payment_verified', 'message', 'system',
]);

export const platformEnum = pgEnum('platform', ['ios', 'android', 'web']);

export const contactStatusEnum = pgEnum('contact_status', ['new', 'read', 'replied']);

export const customerTypeEnum = pgEnum('customer_type', ['personal', 'business', 'government', 'bank']);
