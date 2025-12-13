-- Create initial_credit_policies table
CREATE TABLE IF NOT EXISTS initial_credit_policies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  credits INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default policy
INSERT INTO initial_credit_policies (id, credits, description, is_active)
VALUES (gen_random_uuid()::text, 1000, '신규 회원 웰컴 크레딧', true)
ON CONFLICT DO NOTHING;
