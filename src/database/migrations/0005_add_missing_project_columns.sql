-- Add missing columns to projects table
ALTER TABLE "projects" ADD COLUMN "cover_image" text;
ALTER TABLE "projects" ADD COLUMN "paid_now_price" double precision DEFAULT 0;
ALTER TABLE "projects" ADD COLUMN "branch_name" varchar(200);
ALTER TABLE "projects" ADD COLUMN "city" varchar(100);
