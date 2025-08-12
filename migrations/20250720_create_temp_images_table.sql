-- Create temp_images table for storing temporary image data
CREATE TABLE IF NOT EXISTS temp_images (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_temp_images_expires_at ON temp_images(expires_at);

-- Create index for id lookups
CREATE INDEX IF NOT EXISTS idx_temp_images_id ON temp_images(id);
