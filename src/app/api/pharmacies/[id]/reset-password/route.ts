// ============================================
// ملف: src/app/api/pharmacies/[id]/reset-password/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/encryption";
import { verifyToken } from "@/lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pharmacyId = parseInt(id);

    if (isNaN(pharmacyId)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    }

    // 1. التحقق من أن المستخدم مسؤول
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح - مطلوب صلاحية مدير" }, { status: 403 });
    }

    // 2. جلب البيانات من الطلب
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // 3. التحقق من وجود الصيدلية
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!pharmacy) {
      return NextResponse.json({ error: "الصيدلية غير موجودة" }, { status: 404 });
    }

    // 4. تشفير كلمة المرور الجديدة
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const encryptedPassword = encrypt(newPassword);

    // 5. تحديث قاعدة البيانات
    await db
      .update(pharmacies)
      .set({
        passwordHash,
        encryptedPassword,
        updatedAt: new Date(),
      })
      .where(eq(pharmacies.id, pharmacyId));

    return NextResponse.json({
      success: true,
      message: "تم تغيير كلمة مرور الصيدلية بنجاح",
    });
  } catch (error) {
    console.error("❌ Reset pharmacy password error:", error);
    return NextResponse.json(
      { error: "خطأ في تغيير كلمة المرور" },
      { status: 500 }
    );
  }
}