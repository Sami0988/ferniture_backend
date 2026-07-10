-- Add template field columns to letter_templates
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "recipient_company_name" varchar(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "recipient_title" varchar(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "recipient_address" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "subject" varchar(500);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "body" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "reference_number" varchar(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "letter_templates" ADD COLUMN "due_date" varchar(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
