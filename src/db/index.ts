// ============================================
// ملف: src/db/index.ts
// ============================================
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // ✅ زيادة المهل الزمنية بشكل كبير لمنع انقطاع الاتصال
    connectionTimeoutMillis: 60000, // 60 ثانية (كانت 10)
    idleTimeoutMillis: 120000, // 120 ثانية (كانت 30)
    max: 5, // قللنا العدد لتخفيف الضغط بشكل كبير (كان 20)
    min: 0, // لا تحتفظ باتصالات خاملة
    keepAlive: true,
    // ✅ إعدادات SSL المناسبة لـ Neon
    ssl: {
      rejectUnauthorized: false,
    },
    // ✅ إعدادات إضافية لمنع انقطاع الاتصال
    statement_timeout: 120000, // 120 ثانية للاستعلام
    query_timeout: 120000,
    // ✅ إعدادات خاصة بـ Neon
    application_name: "novex-pharma",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);