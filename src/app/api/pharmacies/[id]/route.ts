// ============================================
// ملف: src/app/api/pharmacies/[id]/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pharmacyId = parseInt(id);

    if (isNaN(pharmacyId)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    }

    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!pharmacy) {
      return NextResponse.json({ error: "الصيدلية غير موجودة" }, { status: 404 });
    }

    let password = "";
    if (pharmacy.encryptedPassword) {
      try {
        password = decrypt(pharmacy.encryptedPassword);
      } catch (error) {
        console.error("❌ فشل فك تشفير كلمة المرور:", error);
        password = "";
      }
    }

    const { encryptedPassword, ...safePharmacy } = pharmacy;
    return NextResponse.json({
      pharmacy: {
        ...safePharmacy,
        password,
      },
    });
  } catch (error) {
    console.error("❌ Pharmacy GET error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب بيانات الصيدلية" },
      { status: 500 }
    );
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pharmacyId = parseInt(id);

    if (isNaN(pharmacyId)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    }

    const body = await req.json();

    // الحقول المسموح بتحديثها
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "name",
      "ownerName",
      "phone",
      "email",
      "address",
      "licenseNumber",
      "creditLimit",
      "isActive",
      "notes",
      "totalDebt",
      "totalPaid",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // إذا تم إرسال كلمة مرور جديدة، نقوم بتشفيرها
    if (body.password) {
      const bcrypt = (await import("bcryptjs")).default;
      const { encrypt } = await import("@/lib/encryption");
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
      updateData.encryptedPassword = encrypt(body.password);
    }

    // التأكد من أن الصيدلية موجودة قبل التحديث
    const [existing] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "الصيدلية غير موجودة" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(pharmacies)
      .set(updateData)
      .where(eq(pharmacies.id, pharmacyId))
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
        updatedAt: pharmacies.updatedAt,
      });

    return NextResponse.json({ pharmacy: updated });
  } catch (error) {
    console.error("❌ Pharmacy PUT error:", error);
    return NextResponse.json(
      { error: "خطأ في تحديث الصيدلية" },
      { status: 500 }
    );
  }
}