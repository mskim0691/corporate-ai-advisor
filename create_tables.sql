-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT DEFAULT 'user' NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT UNIQUE NOT NULL,
  "plan" TEXT DEFAULT 'free' NOT NULL,
  "status" TEXT DEFAULT 'active' NOT NULL,
  "stripe_subscription_id" TEXT,
  "current_period_start" TIMESTAMP,
  "current_period_end" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS "usage_logs" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "year_month" TEXT NOT NULL,
  "count" INTEGER DEFAULT 0 NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE ("user_id", "year_month")
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "company_name" TEXT NOT NULL,
  "business_number" TEXT NOT NULL,
  "representative" TEXT NOT NULL,
  "industry" TEXT,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS "files" (
  "id" TEXT PRIMARY KEY,
  "project_id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_type" TEXT,
  "file_size" INTEGER,
  "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS "reports" (
  "id" TEXT PRIMARY KEY,
  "project_id" TEXT UNIQUE NOT NULL,
  "initial_risk_analysis" TEXT,
  "additional_request" TEXT,
  "text_analysis" TEXT,
  "analysis_data" TEXT,
  "pdf_url" TEXT,
  "share_token" TEXT UNIQUE,
  "share_password" TEXT,
  "share_expires_at" TIMESTAMP,
  "view_count" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS "prompts" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "content" TEXT NOT NULL,
  "description" TEXT,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS "payment_logs" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'KRW' NOT NULL,
  "payment_method" TEXT,
  "status" TEXT NOT NULL,
  "transaction_id" TEXT UNIQUE,
  "description" TEXT,
  "paid_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_usage_logs_user_id" ON "usage_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_projects_user_id" ON "projects"("user_id");
CREATE INDEX IF NOT EXISTS "idx_files_project_id" ON "files"("project_id");
CREATE INDEX IF NOT EXISTS "idx_reports_project_id" ON "reports"("project_id");
CREATE INDEX IF NOT EXISTS "idx_payment_logs_user_id" ON "payment_logs"("user_id");
