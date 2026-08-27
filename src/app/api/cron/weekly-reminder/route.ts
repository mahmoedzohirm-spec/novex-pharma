import { NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies, notifications } from "@/db/schema";
import { gt, and, isNotNull } from "drizzle-orm";

export async function GET() {
  try {
    // جلب الصيدليات التي لديها دين > 0
    const pharmaciesWithDebt = await db
      .select()
      .from(pharmacies)
      .where(
        and(
          gt(pharmacies.totalDebt, "0"),
          isNotNull(pharmacies.pushSubscription)
        )
      );

    let sentCount = 0;

    for (const pharmacy of pharmaciesWithDebt) {
      const debt = parseFloat(String(pharmacy.totalDebt || "0"));

      // إرسال تذكير
      await db.insert(notifications).values({
        pharmacyId: pharmacy.id,
        title: "تذكير أسبوعي بالدفع 📅",
        body: `لديك دين مستحق قدره ${debt.toFixed(2)} ₪. يرجى تسوية المبلغ في أقرب وقت.`,
        type: "reminder",
      });

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${sentCount} تذكير أسبوعي`,
    });
  } catch (error) {
    console.error("Weekly reminder error:", error);
    return NextResponse.json(
      { error: "خطأ في إرسال التذكيرات الأسبوعية" },
      { status: 500 }
    );
  }
}