// ============================================
// ملف: src/lib/jwt.ts
// ============================================
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "my_jwt_secret_1234567890";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET; // اختياري

// ✅ نحافظ على نفس الدوال الموجودة
export function generateToken(payload: { id: number; role: string; email?: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" }); // نفس المدة
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string; email?: string };
  } catch {
    return null;
  }
}

// ✅ دالة جديدة اختيارية (لا تؤثر على أي شيء)
export function generateRefreshToken(payload: { id: number; role: string }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}