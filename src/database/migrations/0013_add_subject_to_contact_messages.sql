-- Add subject column to contact_messages table
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS subject varchar(250);
