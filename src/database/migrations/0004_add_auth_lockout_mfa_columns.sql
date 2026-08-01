-- Add auth lockout and MFA columns to users table
DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "mfa_secret" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "mfa_enabled" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add revoked and replaced_by_token_id to refresh_tokens table
DO $$ BEGIN
  ALTER TABLE "refresh_tokens" ADD COLUMN "revoked" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "refresh_tokens" ADD COLUMN "replaced_by_token_id" uuid;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
