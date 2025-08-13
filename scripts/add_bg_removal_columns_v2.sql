-- Add columns for background removal functionality
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS has_bg_removed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS url_without_bg TEXT;

-- Create index for better performance when querying images with background removed
CREATE INDEX IF NOT EXISTS idx_images_has_bg_removed ON images(has_bg_removed);

-- Add comment to document the new columns
COMMENT ON COLUMN images.has_bg_removed IS 'Indicates if the background has been removed from this image';
COMMENT ON COLUMN images.url_without_bg IS 'URL of the image with background removed';
