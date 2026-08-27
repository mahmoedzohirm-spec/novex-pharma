// ============================================
// ملف: src/app/api/auth/login/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies, admins } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني/الجوال وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    console.log(`🔐 محاولة تسجيل الدخول: ${identifier}`);

    // 1. البحث عن المدير
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, identifier))
      .limit(1);

    if (admin) {
      console.log("✅ تم العثور على مدير");
      if (!admin.passwordHash) {
        console.error("❌ passwordHash فارغ للمدير", admin.id);
        return NextResponse.json(
          { error: "كلمة المرور غير محددة لهذا الحساب" },
          { status: 500 }
        );
      }
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (valid) {
        console.log("✅ كلمة مرور المدير صحيحة");
        const token = generateToken({
          id: admin.id,
          role: "admin",
          email: admin.username,
        });
        return NextResponse.json({
          success: true,
          token,
          user: {
            id: admin.id,
            username: admin.username,
            role: "admin",
          },
        });
      } else {
        console.log("❌ كلمة مرور المدير غير صحيحة");
      }
    }

    // 2. البحث عن الصيدلية
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(
        or(
          eq(pharmacies.email, identifier),
          eq(pharmacies.phone, identifier)
        )
      )
      .limit(1);

    if (pharmacy) {
      console.log("✅ تم العثور على صيدلية");
      if (!pharmacy.isActive) {
        return NextResponse.json(
          { error: "الحساب غير نشط، تواصل مع المدير" },
          { status: 403 }
        );
      }

      // التحقق من وجود passwordHash
      if (!pharmacy.passwordHash) {
        console.error("❌ passwordHash فارغ للصيدلية", pharmacy.id);
        return NextResponse.json(
          { error: "كلمة المرور غير محددة لهذا الحساب" },
          { status: 500 }
        );
      }

      const valid = await bcrypt.compare(password, pharmacy.passwordHash);
      if (valid) {
        console.log("✅ كلمة مرور الصيدلية صحيحة");
        const token = generateToken({
          id: pharmacy.id,
          role: "pharmacy",
          email: pharmacy.email || undefined,
        });

        return NextResponse.json({
          success: true,
          token,
          user: {
            id: pharmacy.id,
            name: pharmacy.name,
            email: pharmacy.email,
            phone: pharmacy.phone,
            ownerName: pharmacy.ownerName,
            totalDebt: pharmacy.totalDebt,
            totalPaid: pharmacy.totalPaid,
            creditLimit: pharmacy.creditLimit,
            isActive: pharmacy.isActive,
            role: "pharmacy",
          },
        });
      } else {
        console.log("❌ كلمة مرور الصيدلية غير صحيحة");
      }
    }

    return NextResponse.json(
      { error: "بيانات تسجيل الدخول غير صحيحة" },
      { status: 401 }
    );
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}