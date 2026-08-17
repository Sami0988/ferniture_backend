-- Create suppliers table
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_name" varchar(255) NOT NULL,
  "tin_number" varchar(50) NOT NULL UNIQUE,
  "bank_account_number" varchar(100),
  "phone" varchar(50),
  "address" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_tin ON suppliers(tin_number);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);

-- Create purchases table
CREATE TABLE IF NOT EXISTS "purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
  "fs_number" varchar(100) NOT NULL,
  "bank_transaction_number" varchar(100),
  "purchase_date" date NOT NULL,
  "amount_before_vat" numeric(14, 2) NOT NULL,
  "vat_amount" numeric(14, 2) NOT NULL,
  "withholding_amount" numeric(14, 2) NOT NULL DEFAULT '0',
  "total_amount" numeric(14, 2) NOT NULL,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "purchase_id" uuid NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "material_name" varchar(255) NOT NULL,
  "quantity" numeric(12, 2) NOT NULL,
  "unit_price" numeric(14, 2) NOT NULL,
  "line_total" numeric(14, 2) NOT NULL
);

-- Indexes for purchase_items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);

-- Add VAT columns to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "price_before_vat" numeric(14, 2);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(14, 2);

-- Index for projects date filtering (used by tax report)
CREATE INDEX IF NOT EXISTS idx_projects_order_date ON projects(order_date);
