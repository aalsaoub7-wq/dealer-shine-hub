-- Add column for storing unlocked background template IDs
ALTER TABLE ai_settings 
ADD COLUMN unlocked_backgrounds TEXT[] DEFAULT '{}';