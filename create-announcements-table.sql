-- Create announcements table
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_author_id_fkey";
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "announcements_is_active_idx" ON "announcements"("is_active");
CREATE INDEX IF NOT EXISTS "announcements_priority_idx" ON "announcements"("priority" DESC);
CREATE INDEX IF NOT EXISTS "announcements_created_at_idx" ON "announcements"("created_at" DESC);
