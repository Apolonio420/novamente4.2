-- Create temp_images table for storing temporary image data
CREATE TABLE IF NOT EXISTS temp_images (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient cleanup of expired images
CREATE INDEX IF NOT EXISTS idx_temp_images_expires_at ON temp_images(expires_at);

-- Enable Row Level Security
ALTER TABLE temp_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on temp_images" ON temp_images
FOR ALL USING (true);

-- Optional: Create a function to clean up expired images
CREATE OR REPLACE FUNCTION cleanup_expired_temp_images()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_images WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
