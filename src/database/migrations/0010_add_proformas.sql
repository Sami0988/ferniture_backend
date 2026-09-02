-- Migration 0010: Add proformas and proforma_items tables

-- Create custom enum for proforma units
CREATE TYPE "proforma_unit" AS ENUM ('PCS', 'M2', 'ML', 'SET', 'LOT', 'KG');

-- Create proformas table
CREATE TABLE "proformas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proforma_number" varchar(30) NOT NULL,
	"project_id" uuid,
	"customer_id" uuid,
	"billed_to_name" varchar(255) NOT NULL,
	"billed_to_address" text,
	"billed_to_phone" varchar(20),
	"billed_to_tin" varchar(30),
	"subject" varchar(500),
	"notes" text,
	"validity_days" integer DEFAULT 7 NOT NULL,
	"material_summary" varchar(500),
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"vat_rate" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"vat_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"pdf_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proformas_proforma_number_unique" UNIQUE ("proforma_number")
);
--> statement-breakpoint
CREATE INDEX "proformas_project_idx" ON "proformas" ("project_id");
CREATE INDEX "proformas_customer_idx" ON "proformas" ("customer_id");
CREATE INDEX "proformas_status_idx" ON "proformas" ("status");
--> statement-breakpoint
-- Create proforma_items table
CREATE TABLE "proforma_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proforma_id" uuid NOT NULL,
	"description" varchar(200) NOT NULL,
	"category" varchar(100),
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" "proforma_unit" DEFAULT 'PCS' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "proformas" ADD CONSTRAINT "proformas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "proforma_items" ADD CONSTRAINT "proforma_items_proforma_id_proformas_id_fk" FOREIGN KEY ("proforma_id") REFERENCES "proformas"("id") ON DELETE cascade ON UPDATE no action;
