-- Create sample_reports table
CREATE TABLE IF NOT EXISTS sample_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on order column
CREATE INDEX IF NOT EXISTS sample_reports_order_idx ON sample_reports("order");

-- Verify table creation
SELECT * FROM sample_reports LIMIT 1;
