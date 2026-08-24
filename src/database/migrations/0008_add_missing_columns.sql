-- Add missing columns to projects table (idempotent)
DO $$ BEGIN
  ALTER TABLE "projects" ADD COLUMN "total_price" double precision;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD COLUMN "price_before_vat" numeric(14, 2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD COLUMN "vat_amount" numeric(14, 2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add missing column to customers table (idempotent)
DO $$ BEGIN
  ALTER TABLE "customers" ADD COLUMN "image_url" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add missing column to materials table
DO $$ BEGIN
  ALTER TABLE "materials" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add missing column to gallery_images table
DO $$ BEGIN
  ALTER TABLE "gallery_images" ADD COLUMN "aspect" varchar(10) DEFAULT 'square';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create mfa_backup_codes table if not exists
CREATE TABLE IF NOT EXISTS "mfa_backup_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "code_hash" text NOT NULL,
  "used" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "mfa_backup_codes" ADD CONSTRAINT "mfa_backup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create auth_audit_log table if not exists
CREATE TABLE IF NOT EXISTS "auth_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "event" varchar(50) NOT NULL,
  "ip" varchar(45),
  "user_agent" text,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create projects_to_sell table if not exists
CREATE TABLE IF NOT EXISTS "projects_to_sell" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "description" text,
  "type" varchar(50),
  "division" "division" NOT NULL,
  "price" numeric(12, 2),
  "image" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create project_payments table if not exists
CREATE TABLE IF NOT EXISTS "project_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "amount" double precision NOT NULL,
  "method" "payment_method" NOT NULL,
  "note" text,
  "recorded_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "project_payments" ADD CONSTRAINT "project_payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "project_payments" ADD CONSTRAINT "project_payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
