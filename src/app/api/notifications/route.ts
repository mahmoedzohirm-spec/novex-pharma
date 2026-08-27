// ============================================
// ملف: src/app/api/notifications/route.ts
// (معدل: التأكد من أن الصيدلية ترى جميع إشعاراتها الخاصة + العامة)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, isNull, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");

    let result;

    if (pharmacyId) {
      // الصيدلية: ترى جميع إشعاراتها الخاصة (طلبات، إيصالات، تذكيرات) + العامة
      result = await db
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.pharmacyId, parseInt(pharmacyId)),
            isNull(notifications.pharmacyId)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    } else {
      // المدير: يرى فقط الإشعارات العامة (بدون pharmacyId)
      result = await db
        .select()
        .from(notifications)
        .where(isNull(notifications.pharmacyId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    return NextResponse.json({ notifications: result });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب الإشعارات" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PUT error:", error);
    return NextResponse.json(
      { error: "خطأ في تحديث الإشعار" },
      { status: 500 }
    );
  }
}