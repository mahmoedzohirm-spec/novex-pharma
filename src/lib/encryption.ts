// ============================================
// ملف: src/lib/encryption.ts
// ============================================
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm"; // ✅ تحسين: GCM أكثر أماناً من CTR
const RAW_KEY = process.env.ENCRYPTION_KEY || "my_encryption_key_32chars1234567890";

// استخدام scrypt لاستخلاص مفتاح قوي (32 بايت)
const ENCRYPTION_KEY = crypto.scryptSync(RAW_KEY, "salt", 32);

export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(12); // GCM يحتاج 12 بايت IV
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // التنسيق: iv:authTag:encrypted
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  if (!text || !text.includes(":")) return "";
  try {
    const parts = text.split(":");
    if (parts.length !== 3) return ""; // تنسيق غير صحيح
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}