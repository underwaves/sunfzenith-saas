import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Ensure a safe 32+ character JWT secret is available for all tests
process.env.JWT_SECRET = "test_super_secure_random_jwt_secret_key_minimum_32_characters!";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "shops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shops_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "shop_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SHOP_STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_members_shopId_userId_key" UNIQUE("shopId", "userId"),
    CONSTRAINT "shop_members_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shop_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "plans" (
    "id" TEXT NOT NULL PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL,
    "monthlyPrice" INTEGER NOT NULL, "serviceLimit" INTEGER, "bookingLimit" INTEGER, "staffLimit" INTEGER,
    "features" TEXT NOT NULL DEFAULT '[]', "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY, "shopId" TEXT NOT NULL UNIQUE, "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active', "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS "services" (
    "id" TEXT NOT NULL PRIMARY KEY, "shopId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
    "durationMins" INTEGER NOT NULL DEFAULT 30, "price" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("shopId", "name"), FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY, "shopId" TEXT NOT NULL, "serviceId" TEXT NOT NULL, "createdById" TEXT,
    "customerName" TEXT NOT NULL, "customerEmail" TEXT, "customerPhone" TEXT, "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'confirmed', "mode" TEXT NOT NULL DEFAULT 'appointment',
    "ticketNumber" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("shopId", "ticketNumber"), FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS "queue_counters" (
    "id" TEXT NOT NULL PRIMARY KEY, "shopId" TEXT NOT NULL, "queueDate" TEXT NOT NULL, "lastNumber" INTEGER NOT NULL DEFAULT 0,
    UNIQUE("shopId", "queueDate"), FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "business_hours" (
    "id" TEXT NOT NULL PRIMARY KEY, "shopId" TEXT NOT NULL, "weekday" INTEGER NOT NULL, "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL, "isClosed" BOOLEAN NOT NULL DEFAULT 0, UNIQUE("shopId", "weekday"),
    FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "grantedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "admin_permissions_userId_permissionKey_key" ON "admin_permissions"("userId", "permissionKey")`,

  `CREATE TABLE IF NOT EXISTS "queues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queueNumber" TEXT NOT NULL UNIQUE,
    "queueDate" TEXT NOT NULL,
    "queueOrder" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 1,
    "details" TEXT,
    "internalNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "archivedAt" DATETIME,
    "shopId" TEXT,
    CONSTRAINT "queues_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "queues_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "queue_tracking_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queueId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "token" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "queue_tracking_tokens_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "queues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "queue_sequences" (
    "sequenceDate" TEXT NOT NULL PRIMARY KEY,
    "lastNumber" INTEGER NOT NULL DEFAULT 0
  )`,
];

export async function createTestDatabase(name: string) {
  const dbFileName = `test_${name}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.db`;
  const dbPath = path.join(__dirname, dbFileName);

  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });

  for (const ddl of DDL_STATEMENTS) {
    await testPrisma.$executeRawUnsafe(ddl);
  }

  await testPrisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS "test_profiles_seed_shop" AFTER INSERT ON "profiles" BEGIN
    INSERT INTO "shops" ("id", "ownerId", "name", "slug", "createdAt", "updatedAt")
    SELECT 'test-shop-' || NEW."id", NEW."id", NEW."displayName" || ' Shop', 'test-' || replace(NEW."id", '-', ''), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NEW."role" = 'owner' OR NOT EXISTS (SELECT 1 FROM "shops");
    INSERT INTO "shop_members" ("id", "shopId", "userId", "role", "createdAt")
    SELECT 'test-member-' || NEW."id",
      COALESCE((SELECT "id" FROM "shops" WHERE "ownerId" = NEW."id" LIMIT 1), (SELECT "id" FROM "shops" ORDER BY "createdAt" LIMIT 1)),
      NEW."id", CASE WHEN NEW."role" = 'owner' THEN 'SHOP_OWNER' ELSE 'SHOP_STAFF' END, CURRENT_TIMESTAMP;
  END`);
  await testPrisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS "test_queues_attach_shop" AFTER INSERT ON "queues" WHEN NEW."shopId" IS NULL BEGIN
    UPDATE "queues" SET "shopId" = 'test-shop-' || NEW."createdBy" WHERE "id" = NEW."id";
  END`);

  const cleanup = async () => {
    try {
      await testPrisma.$disconnect();
    } catch {
      // ignore
    }

    const filesToDelete = [
      dbPath,
      `${dbPath}-journal`,
      `${dbPath}-wal`,
      `${dbPath}-shm`,
    ];

    for (const f of filesToDelete) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore lock on windows
        }
      }
    }
  };

  return {
    prisma: testPrisma,
    dbPath,
    cleanup,
  };
}
