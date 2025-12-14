-- ============================================================================
-- Supabase Setup - Step by Step
-- ============================================================================
-- IMPORTANT: Execute each section separately in Supabase SQL Editor
-- Don't run the entire file at once - run one section at a time
-- ============================================================================

-- ============================================================================
-- STEP 1: Create sample_reports table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sample_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sample_reports_order_idx ON sample_reports("order");

-- Verify
SELECT 'sample_reports table created' as status;

-- ============================================================================
-- STEP 2: Create Storage bucket (if not exists)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM storage.buckets WHERE id = 'project-files';

-- ============================================================================
-- STEP 3: Enable RLS on storage.objects (if not already enabled)
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create Storage RLS Policies
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read project-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to project-files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from project-files" ON storage.objects;

-- Public read policy
CREATE POLICY "Public can read project-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

-- Authenticated upload policy
CREATE POLICY "Authenticated users can upload to project-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND auth.role() = 'authenticated'
);

-- Admin delete policy
CREATE POLICY "Admins can delete from project-files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
  )
);

-- Verify
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================================
-- STEP 5: Enable RLS on sample_reports table
-- ============================================================================

ALTER TABLE sample_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create sample_reports RLS Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view sample reports" ON sample_reports;
DROP POLICY IF EXISTS "Admins can manage sample reports" ON sample_reports;

-- Public read policy
CREATE POLICY "Anyone can view sample reports"
ON sample_reports FOR SELECT
USING (true);

-- Admin management policy
CREATE POLICY "Admins can manage sample reports"
ON sample_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Verify
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'sample_reports'
ORDER BY policyname;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'sample_reports'
) as table_exists;

-- Check if bucket exists
SELECT EXISTS (
  SELECT FROM storage.buckets
  WHERE id = 'project-files'
) as bucket_exists;

-- Check RLS status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'sample_reports';

-- Check storage policies count
SELECT COUNT(*) as storage_policies_count
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%project-files%';

-- ============================================================================
-- DONE!
-- ============================================================================
