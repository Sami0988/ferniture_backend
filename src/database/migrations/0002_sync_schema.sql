-- Add new enum values (safe with IF NOT EXISTS)
DO $$ BEGIN
  ALTER TYPE "public"."division" ADD VALUE IF NOT EXISTS 'custom_orders';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE "public"."division" ADD VALUE IF NOT EXISTS 'accessories';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create customer_type enum if not exists
DO $$ BEGIN
  CREATE TYPE "public"."customer_type" AS ENUM('personal', 'business', 'government', 'bank');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add customer_type column to customers if not exists
DO $$ BEGIN
  ALTER TABLE "customers" ADD COLUMN "type" "customer_type" DEFAULT 'personal' NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Drop old columns from products if they exist
ALTER TABLE "products" DROP COLUMN IF EXISTS "price_range_min";
ALTER TABLE "products" DROP COLUMN IF EXISTS "price_range_max";
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_urls";

-- Add new columns to products if not exist
DO $$ BEGIN
  ALTER TABLE "products" ADD COLUMN "price" numeric(12, 2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "products" ADD COLUMN "main_image" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "products" ADD COLUMN "feature_images" jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create letter_templates table if not exists
CREATE TABLE IF NOT EXISTS "letter_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"html_content" text NOT NULL,
	"css_content" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD CONSTRAINT "letter_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create payment_letters table if not exists
CREATE TABLE IF NOT EXISTS "payment_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"letter_number" varchar(30) NOT NULL,
	"project_id" uuid NOT NULL,
	"customer_id" uuid,
	"template_id" uuid,
	"recipient_company_name" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"recipient_title" varchar(255),
	"recipient_address" text,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"reference_number" varchar(100),
	"due_date" date,
	"pdf_url" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_letters_letter_number_unique" UNIQUE("letter_number")
);
DO $$ BEGIN
  ALTER TABLE "payment_letters" ADD CONSTRAINT "payment_letters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "payment_letters" ADD CONSTRAINT "payment_letters_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "payment_letters" ADD CONSTRAINT "payment_letters_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "payment_letters" ADD CONSTRAINT "payment_letters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "payment_letters_project_idx" ON "payment_letters" ("project_id");
CREATE INDEX IF NOT EXISTS "payment_letters_customer_idx" ON "payment_letters" ("customer_id");
CREATE INDEX IF NOT EXISTS "payment_letters_status_idx" ON "payment_letters" ("status");
