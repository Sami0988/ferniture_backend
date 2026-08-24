-- Add paid_at timestamp to projects table (idempotent)
DO $$ BEGIN
  ALTER TABLE "projects" ADD COLUMN "paid_at" timestamp;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
