// ============================================
// ملف: src/app/api/notifications/remind/route.ts
// (إرسال تذكير فوري لصيدلية محددة)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, message } = body;

    if (!pharmacyId) {
      return NextResponse.json(
        { error: "معرف الصيدلية مطلوب" },
        { status: 400 }
      );
    }

    // التحقق من وجود الصيدلية
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacyId))
      .limit(1);

    if (!pharmacy) {
      return NextResponse.json(
        { error: "الصيدلية غير موجودة" },
        { status: 404 }
      );
    }

    const debt = parseFloat(String(pharmacy.totalDebt || "0"));
    const reminderMessage = message?.trim() || `لديك دين مستحق قدره ${debt.toFixed(2)} ₪، يرجى السداد.`;

    // إنشاء إشعار للصيدلية
    await db.insert(notifications).values({
      pharmacyId: pharmacy.id,
      title: "تذكير بالدفع 📢",
      body: reminderMessage,
      type: "reminder",
    });

    return NextResponse.json({
      success: true,
      message: "تم إرسال التذكير بنجاح",
    });
  } catch (error) {
    console.error("❌ Reminder error:", error);
    return NextResponse.json(
      { error: "خطأ في إرسال التذكير" },
      { status: 500 }
    );
  }
}