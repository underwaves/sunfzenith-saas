import path from "path";
import { PrismaClient } from "@prisma/client";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool as PgPool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Creates a PrismaClient instance appropriate for the current runtime.
 * - In Cloudflare Workers (workerd runtime): uses Neon serverless driver adapter (@prisma/adapter-neon)
 *   or PostgreSQL adapter (@prisma/adapter-pg if Hyperdrive is active).
 * - In standard Node.js (local dev, Render, test runners): uses standard PrismaClient or test mock.
 */
function resolveDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.startsWith("file:")) {
    const filePart = rawUrl.slice("file:".length);
    if (!path.isAbsolute(filePart)) {
      return `file:${path.resolve(process.cwd(), "prisma", filePart)}`;
    }
  }
  return rawUrl;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

  // Cloudflare Workers runtime detection:
  // In Cloudflare Workers (workerd), WebSocketPair is globally defined.
  const isCloudflare = typeof (globalThis as any).WebSocketPair !== "undefined";

  if (isCloudflare) {
    // If running in Cloudflare Workers and Hyperdrive is bound:
    let hyperdriveUrl: string | undefined = process.env.HYPERDRIVE_URL;
    try {
      const cfContext = getCloudflareContext();
      if ((cfContext?.env as any)?.HYPERDRIVE?.connectionString) {
        hyperdriveUrl = (cfContext.env as any).HYPERDRIVE.connectionString;
      }
    } catch {
      // Outside OpenNext request context or Hyperdrive not bound
    }

    if (hyperdriveUrl || process.env.USE_HYPERDRIVE === "true") {
      const targetUrl = hyperdriveUrl || dbUrl;
      if (!targetUrl) {
        throw new Error("[Prisma Config] HYPERDRIVE or DATABASE_URL is not set in Cloudflare environment.");
      }
      const pool = new PgPool({ connectionString: targetUrl });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({
        adapter,
        log: ["error"],
      });
    }

    // Default connection to Neon via Neon Serverless Driver Adapter
    if (!dbUrl) {
      throw new Error("[Prisma Config] DATABASE_URL secret is not set in Cloudflare Workers environment.");
    }
    const pool = new NeonPool({ connectionString: dbUrl });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // Standard Node.js environment (local `npm run dev`, Render production, test runs)
  return new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

let cachedPrisma: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  // If a test or isolated context has set global.prisma, always respect it
  if (global.prisma) {
    return global.prisma;
  }
  if (!cachedPrisma) {
    cachedPrisma = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.prisma = cachedPrisma;
    }
  }
  return cachedPrisma;
}

/**
 * Proxy wrapper ensuring any override on global.prisma (such as isolated test databases)
 * is immediately reflected across all application modules without stale references,
 * and defers PrismaClient creation until first query execution.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const active = getPrismaInstance();
    const value = Reflect.get(active, prop, receiver);
    if (typeof value === "function") {
      return value.bind(active);
    }
    return value;
  },
});
