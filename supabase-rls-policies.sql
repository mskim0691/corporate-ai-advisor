-- ============================================================================
-- Supabase Row Level Security (RLS) Policies
-- ============================================================================
-- This script enables RLS and creates appropriate policies for all tables
-- Generated: 2025-12-14
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire script
-- 4. Run the script
-- 5. Verify in Table Editor that RLS is enabled for all tables
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Users can read their own data, admins can read all users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Users can update their own data (name, etc.)
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Allow user registration (insert)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================
-- Users can read their own subscription, admins can read all
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Allow subscription creation"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 3. USAGE_LOGS TABLE
-- ============================================================================
-- Users can read their own usage logs, admins can read all
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON usage_logs
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Service can insert usage logs"
  ON usage_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service can update usage logs"
  ON usage_logs
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 4. PROJECTS TABLE
-- ============================================================================
-- Users can access their own projects, admins can access all
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all projects"
  ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. FILES TABLE
-- ============================================================================
-- Users can access files from their own projects
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project files"
  ON files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.user_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload files to own projects"
  ON files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own project files"
  ON files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- 6. REPORTS TABLE
-- ============================================================================
-- Users can access reports from their own projects
-- Public can view shared reports with valid token
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project reports"
  ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = reports.project_id
      AND projects.user_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Allow public access to shared reports (share token will be validated in application)
CREATE POLICY "Public can view shared reports"
  ON reports
  FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can create reports for own projects"
  ON reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = reports.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own project reports"
  ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = reports.project_id
      AND projects.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = reports.project_id
      AND projects.user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- 7. PROMPTS TABLE
-- ============================================================================
-- Only admins can manage prompts
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prompts"
  ON prompts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- Allow service to read prompts (for AI processing)
CREATE POLICY "Service can read prompts"
  ON prompts
  FOR SELECT
  USING (true);

-- ============================================================================
-- 8. PAYMENT_LOGS TABLE
-- ============================================================================
-- Users can view their own payment logs, admins can view all
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment logs"
  ON payment_logs
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Service can create payment logs"
  ON payment_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can update payment logs"
  ON payment_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. GROUP_POLICIES TABLE
-- ============================================================================
-- Everyone can read policies, only admins can modify
ALTER TABLE group_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group policies"
  ON group_policies
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage group policies"
  ON group_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 10. ANNOUNCEMENTS TABLE
-- ============================================================================
-- Everyone can read active announcements, only admins can manage
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON announcements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all announcements"
  ON announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create announcements"
  ON announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcements"
  ON announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete announcements"
  ON announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 11. PRICING_PLANS TABLE
-- ============================================================================
-- Everyone can read active plans, only admins can modify
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all pricing plans"
  ON pricing_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage pricing plans"
  ON pricing_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 12. CREDIT_TRANSACTIONS TABLE (DEPRECATED)
-- ============================================================================
-- Users can view their own transactions, admins can view all
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 13. CREDIT_PRICES TABLE (DEPRECATED)
-- ============================================================================
-- Everyone can read, only admins can modify
ALTER TABLE credit_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credit prices"
  ON credit_prices
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage credit prices"
  ON credit_prices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 14. SAMPLE_REPORTS TABLE
-- ============================================================================
-- Everyone can read sample reports, only admins can manage
ALTER TABLE sample_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sample reports"
  ON sample_reports
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sample reports"
  ON sample_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- 15. INITIAL_CREDIT_POLICIES TABLE (DEPRECATED)
-- ============================================================================
-- Everyone can read, only admins can modify
ALTER TABLE initial_credit_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view initial credit policies"
  ON initial_credit_policies
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage initial credit policies"
  ON initial_credit_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify RLS is enabled on all tables:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Expected: rowsecurity = true for all tables
--
-- To view all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- ============================================================================
