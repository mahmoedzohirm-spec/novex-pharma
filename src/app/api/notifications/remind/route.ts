// ============================================
// ملف: src/app/api/notifications/remind/route.ts
// (إرسال تذكير فوري لصيدلية محددة + Push)
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

    // 1️⃣ حفظ الإشعار في قاعدة البيانات (داخل التطبيق)
    await db.insert(notifications).values({
      pharmacyId: pharmacy.id,
      title: "تذكير بالدفع 📢",
      body: reminderMessage,
      type: "reminder",
    });

    // 2️⃣ إرسال Push Notification (خارج التطبيق)
    const pushSubscription = pharmacy.pushSubscription;
    if (pushSubscription) {
      try {
        const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
        const VAPID_EMAIL = process.env.VAPID_EMAIL || "admin@novex.com";

        if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
          const webpush = await import("web-push");
          webpush.default.setVapidDetails(
            `mailto:${VAPID_EMAIL}`,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );

          const payload = JSON.stringify({
            title: "تذكير بالدفع 📢",
            body: reminderMessage,
            pharmacyId: pharmacy.id,
          });

          await webpush.default.sendNotification(
            JSON.parse(pushSubscription),
            payload
          );
          console.log(`✅ تم إرسال Push Notification للصيدلية #${pharmacyId}`);
        }
      } catch (pushError) {
        console.error("❌ فشل إرسال Push Notification:", pushError);
      }
    } else {
      console.log(`⚠️ لا يوجد اشتراك Push للصيدلية #${pharmacyId}`);
    }

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
