// ============================================
// ملف: src/app/api/auth/register/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phone,
      password,
      name,
      ownerName,
      email,
    } = body;

    if (!phone || !password || !name || !ownerName) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة يجب ملؤها (الهاتف، كلمة المرور، الاسم، اسم المالك)" },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الجوال
    const existingPhone = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.phone, phone))
      .limit(1);

    if (existingPhone.length > 0) {
      return NextResponse.json(
        { error: "رقم الجوال مسجل مسبقاً" },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار البريد الإلكتروني (إذا وجد)
    if (email) {
      const existingEmail = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.email, email))
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 400 }
        );
      }
    }

    // تشفير كلمة المرور بطريقتين
    const passwordHash = await bcrypt.hash(password, 12);
    const encryptedPassword = encrypt(password);

    const [newPharmacy] = await db
      .insert(pharmacies)
      .values({
        phone,
        passwordHash,
        encryptedPassword,
        name,
        ownerName,
        email: email || null, // ✅ نضع null إذا لم يوجد
        creditLimit: "5000",
        isActive: true,
        notes: "تم إنشاء الحساب عبر التسجيل الذاتي",
      })
      .returning({
        id: pharmacies.id,
        name: pharmacies.name,
        ownerName: pharmacies.ownerName,
        phone: pharmacies.phone,
        email: pharmacies.email,
        creditLimit: pharmacies.creditLimit,
        totalDebt: pharmacies.totalDebt,
        totalPaid: pharmacies.totalPaid,
        isActive: pharmacies.isActive,
      });

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح!",
      user: {
        id: newPharmacy.id,
        name: newPharmacy.name,
        ownerName: newPharmacy.ownerName,
        phone: newPharmacy.phone,
        email: newPharmacy.email,
        creditLimit: newPharmacy.creditLimit,
        totalDebt: newPharmacy.totalDebt,
        totalPaid: newPharmacy.totalPaid,
        isActive: newPharmacy.isActive,
        role: "pharmacy",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}