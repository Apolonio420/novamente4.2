-- Add columns for background removal functionality
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS url_without_bg TEXT,
ADD COLUMN IF NOT EXISTS has_bg_removed BOOLEAN DEFAULT FALSE;

-- Create index for better performance when querying background-removed images
CREATE INDEX IF NOT EXISTS idx_images_has_bg_removed ON images(has_bg_removed);

-- Update existing records to have default values
UPDATE images 
SET has_bg_removed = FALSE 
WHERE has_bg_removed IS NULL;
