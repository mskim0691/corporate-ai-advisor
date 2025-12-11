-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS "pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "original_price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "monthly_analysis" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "badge_text" TEXT,
    "badge_color" TEXT,
    "button_text" TEXT NOT NULL DEFAULT '시작하기',
    "button_variant" TEXT NOT NULL DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_name_key" ON "pricing_plans"("name");

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "pricing_plans_is_active_idx" ON "pricing_plans"("is_active");
CREATE INDEX IF NOT EXISTS "pricing_plans_display_order_idx" ON "pricing_plans"("display_order" ASC);

-- Insert default pricing plans
INSERT INTO "pricing_plans" (
    "id",
    "name",
    "display_name",
    "price",
    "original_price",
    "currency",
    "monthly_analysis",
    "features",
    "is_popular",
    "is_active",
    "display_order",
    "badge_text",
    "badge_color",
    "button_text",
    "button_variant",
    "updated_at",
    "created_at"
)
VALUES
    (
        gen_random_uuid()::text,
        'free',
        'Free',
        0,
        NULL,
        'KRW',
        4,
        '["월 4회 분석","PDF 다운로드","기본 지원"]',
        false,
        true,
        0,
        NULL,
        NULL,
        '무료로 시작하기',
        'outline',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'standard',
        'Standard',
        15000,
        30000,
        'KRW',
        30,
        '["월 30회 분석","PDF 다운로드","우선 지원","프리미엄 기능"]',
        true,
        true,
        1,
        '50% 할인 이벤트',
        'red',
        '지금 시작하기',
        'default',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("name") DO UPDATE SET
    "display_name" = EXCLUDED."display_name",
    "price" = EXCLUDED."price",
    "original_price" = EXCLUDED."original_price",
    "currency" = EXCLUDED."currency",
    "monthly_analysis" = EXCLUDED."monthly_analysis",
    "features" = EXCLUDED."features",
    "is_popular" = EXCLUDED."is_popular",
    "is_active" = EXCLUDED."is_active",
    "display_order" = EXCLUDED."display_order",
    "badge_text" = EXCLUDED."badge_text",
    "badge_color" = EXCLUDED."badge_color",
    "button_text" = EXCLUDED."button_text",
    "button_variant" = EXCLUDED."button_variant",
    "updated_at" = CURRENT_TIMESTAMP;
