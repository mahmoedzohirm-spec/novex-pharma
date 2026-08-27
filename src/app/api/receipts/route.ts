import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, pharmacies, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");

    let result;
    if (pharmacyId) {
      result = await db
        .select()
        .from(receipts)
        .where(eq(receipts.pharmacyId, parseInt(pharmacyId)))
        .orderBy(desc(receipts.createdAt));
    } else {
      result = await db
        .select()
        .from(receipts)
        .orderBy(desc(receipts.createdAt));
    }

    return NextResponse.json({ receipts: result });
  } catch (error) {
    console.error("Receipts GET error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب الإيصالات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, amount, imageUrl, notes } = body;

    if (!pharmacyId || !amount) {
      return NextResponse.json(
        { error: "بيانات الإيصال غير مكتملة" },
        { status: 400 }
      );
    }

    const [receipt] = await db
      .insert(receipts)
      .values({
        pharmacyId,
        amount: String(amount),
        imageUrl: imageUrl || "",
        notes: notes || "",
      })
      .returning();

    // Notify admin (general notification)
    await db.insert(notifications).values({
      pharmacyId: null,
      title: "إيصال جديد",
      body: `تم إرسال إيصال دفع بقيمة ${amount} شيكل من صيدلية ${pharmacyId}`,
      type: "receipt",
    });

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error("Receipts POST error:", error);
    return NextResponse.json(
      { error: "خطأ في إرسال الإيصال" },
      { status: 500 }
    );
  }
}
