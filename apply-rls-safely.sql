-- ============================================================================
-- Safe RLS Application Script
-- ============================================================================
-- This script safely applies RLS policies by dropping existing ones first
-- Execute in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Admins can update any user" ON users FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription creation" ON subscriptions;

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Allow subscription creation" ON subscriptions FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 3. USAGE_LOGS TABLE
-- ============================================================================
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Service can insert usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Service can update usage logs" ON usage_logs;

CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Service can insert usage logs" ON usage_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Service can update usage logs" ON usage_logs FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 4. PROJECTS TABLE
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage all projects" ON projects FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 5. FILES TABLE
-- ============================================================================
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project files" ON files;
DROP POLICY IF EXISTS "Users can upload files to own projects" ON files;
DROP POLICY IF EXISTS "Users can delete own project files" ON files;

CREATE POLICY "Users can view own project files" ON files FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()::text) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Users can upload files to own projects" ON files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()::text));
CREATE POLICY "Users can delete own project files" ON files FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid()::text));

-- ============================================================================
-- 6. REPORTS TABLE
-- ============================================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project reports" ON reports;
DROP POLICY IF EXISTS "Public can view shared reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports for own projects" ON reports;
DROP POLICY IF EXISTS "Users can update own project reports" ON reports;

CREATE POLICY "Users can view own project reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()::text) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Public can view shared reports" ON reports FOR SELECT USING (share_token IS NOT NULL);
CREATE POLICY "Users can create reports for own projects" ON reports FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()::text));
CREATE POLICY "Users can update own project reports" ON reports FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()::text));

-- ============================================================================
-- 7. PROMPTS TABLE
-- ============================================================================
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;
DROP POLICY IF EXISTS "Service can read prompts" ON prompts;

CREATE POLICY "Admins can manage prompts" ON prompts FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Service can read prompts" ON prompts FOR SELECT USING (true);

-- ============================================================================
-- 8. PAYMENT_LOGS TABLE
-- ============================================================================
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment logs" ON payment_logs;
DROP POLICY IF EXISTS "Service can create payment logs" ON payment_logs;
DROP POLICY IF EXISTS "Admins can update payment logs" ON payment_logs;

CREATE POLICY "Users can view own payment logs" ON payment_logs FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Service can create payment logs" ON payment_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Admins can update payment logs" ON payment_logs FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 9. GROUP_POLICIES TABLE
-- ============================================================================
ALTER TABLE group_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view group policies" ON group_policies;
DROP POLICY IF EXISTS "Admins can manage group policies" ON group_policies;

CREATE POLICY "Anyone can view group policies" ON group_policies FOR SELECT USING (true);
CREATE POLICY "Admins can manage group policies" ON group_policies FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 10. ANNOUNCEMENTS TABLE
-- ============================================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;

CREATE POLICY "Anyone can view active announcements" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all announcements" ON announcements FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admins can create announcements" ON announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admins can update announcements" ON announcements FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admins can delete announcements" ON announcements FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 11. PRICING_PLANS TABLE
-- ============================================================================
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active pricing plans" ON pricing_plans;
DROP POLICY IF EXISTS "Admins can view all pricing plans" ON pricing_plans;
DROP POLICY IF EXISTS "Admins can manage pricing plans" ON pricing_plans;

CREATE POLICY "Anyone can view active pricing plans" ON pricing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all pricing plans" ON pricing_plans FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));
CREATE POLICY "Admins can manage pricing plans" ON pricing_plans FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 12. CREDIT_TRANSACTIONS TABLE (DEPRECATED)
-- ============================================================================
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;

CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 13. CREDIT_PRICES TABLE (DEPRECATED)
-- ============================================================================
ALTER TABLE credit_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view credit prices" ON credit_prices;
DROP POLICY IF EXISTS "Admins can manage credit prices" ON credit_prices;

CREATE POLICY "Anyone can view credit prices" ON credit_prices FOR SELECT USING (true);
CREATE POLICY "Admins can manage credit prices" ON credit_prices FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 14. SAMPLE_REPORTS TABLE
-- ============================================================================
ALTER TABLE sample_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view sample reports" ON sample_reports;
DROP POLICY IF EXISTS "Admins can manage sample reports" ON sample_reports;

CREATE POLICY "Anyone can view sample reports" ON sample_reports FOR SELECT USING (true);
CREATE POLICY "Admins can manage sample reports" ON sample_reports FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- 15. INITIAL_CREDIT_POLICIES TABLE (DEPRECATED)
-- ============================================================================
ALTER TABLE initial_credit_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view initial credit policies" ON initial_credit_policies;
DROP POLICY IF EXISTS "Admins can manage initial credit policies" ON initial_credit_policies;

CREATE POLICY "Anyone can view initial credit policies" ON initial_credit_policies FOR SELECT USING (true);
CREATE POLICY "Admins can manage initial credit policies" ON initial_credit_policies FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'));

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should show rowsecurity = true for all tables
