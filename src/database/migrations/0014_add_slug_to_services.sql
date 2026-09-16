-- Add slug column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug varchar(220);
CREATE UNIQUE INDEX IF NOT EXISTS service_slug_idx ON services (slug);
