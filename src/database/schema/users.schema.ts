import { pgTable, uuid, varchar, text, boolean, timestamp, date, integer } from 'drizzle-orm/pg-core';
import { userRoleEnum, employeeSpecialtyEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('employee'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  languagePref: varchar('language_pref', { length: 5 }).default('en'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  mfaSecret: text('mfa_secret'),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeProfiles = pgTable('employee_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  specialty: employeeSpecialtyEnum('specialty').notNull(),
  hireDate: date('hire_date'),
  idNumber: varchar('id_number', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  revokedAt: timestamp('revoked_at'),
  replacedByTokenId: uuid('replaced_by_token_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetOtps = pgTable('password_reset_otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mfaBackupCodes = pgTable('mfa_backup_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const authAuditLog = pgTable('auth_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  event: varchar('event', { length: 50 }).notNull(),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: text('metadata'), // JSONB stored as text for Drizzle compat
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
