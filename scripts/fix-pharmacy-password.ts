// scripts/fix-pharmacy-password.ts
import * as dotenv from "dotenv";
import { resolve } from "path";

// ✅ تحميل .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ✅ تأكد من وجود DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL غير موجود في .env.local");
  process.exit(1);
}

import { db } from "../src/db";
import { pharmacies } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "../src/lib/encryption";

async function fixPassword() {
  const pharmacyId = 6;
  const newPassword = "pharmacy123";

  const hashed = await bcrypt.hash(newPassword, 12);
  const encrypted = encrypt(newPassword);

  await db
    .update(pharmacies)
    .set({
      passwordHash: hashed,
      encryptedPassword: encrypted,
    })
    .where(eq(pharmacies.id, pharmacyId));

  console.log(`✅ تم تحديث كلمة مرور الصيدلية ${pharmacyId} إلى "${newPassword}"`);
  process.exit(0);
}

fixPassword().catch((err) => {
  console.error("❌ خطأ:", err);
  process.exit(1);
});