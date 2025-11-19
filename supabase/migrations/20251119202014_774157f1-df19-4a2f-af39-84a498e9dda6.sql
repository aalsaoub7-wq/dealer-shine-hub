-- Add processing flag to photos table
ALTER TABLE photos ADD COLUMN is_processing boolean DEFAULT false;