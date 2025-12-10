-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payment_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "payment_method" TEXT,
    "status" TEXT NOT NULL,
    "transaction_id" TEXT,
    "description" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payment_logs" ("amount", "created_at", "currency", "description", "id", "paid_at", "payment_method", "status", "transaction_id", "user_id") SELECT "amount", "created_at", "currency", "description", "id", "paid_at", "payment_method", "status", "transaction_id", "user_id" FROM "payment_logs";
DROP TABLE "payment_logs";
ALTER TABLE "new_payment_logs" RENAME TO "payment_logs";
CREATE UNIQUE INDEX "payment_logs_transaction_id_key" ON "payment_logs"("transaction_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
