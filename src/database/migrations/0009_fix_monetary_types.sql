-- Fix monetary column types from double precision to numeric(14,2) for consistency
DO $$ BEGIN
  ALTER TABLE "projects" ALTER COLUMN "total_price" TYPE numeric(14, 2) USING round(total_price::numeric, 2);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ALTER COLUMN "paid_now_price" TYPE numeric(14, 2) USING round(paid_now_price::numeric, 2);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "project_payments" ALTER COLUMN "amount" TYPE numeric(14, 2) USING round(amount::numeric, 2);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
