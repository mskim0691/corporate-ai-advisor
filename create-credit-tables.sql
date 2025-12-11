-- Add credits column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 0;

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "related_id" TEXT,
    "admin_id" TEXT,
    "balance_after" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "credit_transactions_user_id_fkey";
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at" DESC);

-- Create credit_prices table
CREATE TABLE IF NOT EXISTS "credit_prices" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_prices_pkey" PRIMARY KEY ("id")
);

-- Create unique index on type
CREATE UNIQUE INDEX IF NOT EXISTS "credit_prices_type_key" ON "credit_prices"("type");

-- Insert default credit prices
INSERT INTO "credit_prices" ("id", "type", "name", "credits", "description", "is_active", "updated_at", "created_at")
VALUES
    (gen_random_uuid()::text, 'basic_analysis', '기본 분석', 10, '프로젝트 생성 시 소진되는 크레딧', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'premium_presentation', '고급 프레젠테이션', 50, '고급 프레젠테이션 제작 시 소진되는 크레딧', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO UPDATE SET
    "name" = EXCLUDED."name",
    "credits" = EXCLUDED."credits",
    "description" = EXCLUDED."description",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = CURRENT_TIMESTAMP;
