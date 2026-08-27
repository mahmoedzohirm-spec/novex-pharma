// ============================================
// ملف: src/app/api/auth/me/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { pharmacies, admins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "رمز غير صالح" }, { status: 401 });
    }

    // 1. البحث في الصيدليات
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, decoded.id))
      .limit(1);

    if (pharmacy) {
      return NextResponse.json({
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
    }

    // 2. البحث في المديرين
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, decoded.id))
      .limit(1);

    if (admin) {
      return NextResponse.json({
        user: {
          id: admin.id,
          username: admin.username,
          role: "admin",
        },
      });
    }

    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  } catch (error) {
    console.error("Me API error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}