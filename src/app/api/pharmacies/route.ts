// ============================================
// ملف: src/app/api/pharmacies/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET() {
  try {
    const result = await db
      .select({
        id: pharmacies.id,
        name: pharmacies.name,
        ownerName: pharmacies.ownerName,
        phone: pharmacies.phone,
        email: pharmacies.email,
        encryptedPassword: pharmacies.encryptedPassword,
        totalDebt: pharmacies.totalDebt,
        totalPaid: pharmacies.totalPaid,
        creditLimit: pharmacies.creditLimit,
        isActive: pharmacies.isActive,
        notes: pharmacies.notes,
        createdAt: pharmacies.createdAt,
      })
      .from(pharmacies)
      .orderBy(desc(pharmacies.createdAt));

    const pharmaciesWithDecryptedPassword = result.map((p) => ({
      ...p,
      password: p.encryptedPassword ? decrypt(p.encryptedPassword) : "",
    }));

    return NextResponse.json({ pharmacies: pharmaciesWithDecryptedPassword });
  } catch (error) {
    console.error("Pharmacies GET error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب الصيدليات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      ownerName,
      phone,
      email,
      password,
      creditLimit,
      notes,
    } = body;

    if (!name || !ownerName || !phone || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة يجب ملؤها" },
        { status: 400 }
      );
    }

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

    const passwordHash = await bcrypt.hash(password, 12);
    const encryptedPassword = encrypt(password);

    const [pharmacy] = await db
      .insert(pharmacies)
      .values({
        name,
        ownerName,
        phone,
        email,
        passwordHash,
        encryptedPassword,
        creditLimit: String(creditLimit || 5000),
        notes: notes || "",
      })
      .returning({
        id: pharmacies.id,
        name: pharmacies.name,
        ownerName: pharmacies.ownerName,
        phone: pharmacies.phone,
        email: pharmacies.email,
        totalDebt: pharmacies.totalDebt,
        totalPaid: pharmacies.totalPaid,
        creditLimit: pharmacies.creditLimit,
        isActive: pharmacies.isActive,
        notes: pharmacies.notes,
        createdAt: pharmacies.createdAt,
      });

    return NextResponse.json({ pharmacy });
  } catch (error) {
    console.error("Pharmacies POST error:", error);
    return NextResponse.json(
      { error: "خطأ في إضافة الصيدلية" },
      { status: 500 }
    );
  }
}