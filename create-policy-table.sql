-- Create group_policies table
CREATE TABLE IF NOT EXISTS "group_policies" (
    "id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "monthly_project_limit" INTEGER NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_policies_pkey" PRIMARY KEY ("id")
);

-- Create unique index on group_name
CREATE UNIQUE INDEX IF NOT EXISTS "group_policies_group_name_key" ON "group_policies"("group_name");

-- Insert default policies
INSERT INTO "group_policies" ("id", "group_name", "monthly_project_limit", "description", "updated_at", "created_at")
VALUES
    (gen_random_uuid()::text, 'admin', 999999, '관리자 그룹 - 무제한 프로젝트 생성', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'pro', 10, 'Pro 그룹 - 월 10개 프로젝트', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'free', 3, 'Free 그룹 - 월 3개 프로젝트', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("group_name") DO UPDATE SET
    "monthly_project_limit" = EXCLUDED."monthly_project_limit",
    "description" = EXCLUDED."description",
    "updated_at" = CURRENT_TIMESTAMP;
