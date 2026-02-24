-- Add archived column to contact_submissions table
ALTER TABLE contact_submissions
ADD COLUMN archived boolean DEFAULT false;
