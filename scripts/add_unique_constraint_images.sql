-- Add unique constraint to prevent duplicate images
-- This will prevent the same URL+prompt combination from being saved twice

-- First, remove existing duplicates by keeping only the most recent one for each URL+prompt combination
DELETE FROM images 
WHERE id NOT IN (
    SELECT DISTINCT ON (url, prompt) id 
    FROM images 
    ORDER BY url, prompt, created_at DESC
);

-- Add unique constraint on url and prompt combination
ALTER TABLE images 
ADD CONSTRAINT unique_url_prompt 
UNIQUE (url, prompt);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_images_url_prompt ON images(url, prompt);
