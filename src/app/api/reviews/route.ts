import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq, avg } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId مطلوب" }, { status: 400 });
    }

    const result = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, parseInt(productId)));

    return NextResponse.json({ reviews: result });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب التقييمات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, pharmacyId, rating, comment } = body;

    if (!productId || !pharmacyId || !rating) {
      return NextResponse.json(
        { error: "بيانات التقييم غير مكتملة" },
        { status: 400 }
      );
    }

    const [review] = await db
      .insert(reviews)
      .values({
        productId,
        pharmacyId,
        rating,
        comment: comment || "",
      })
      .returning();

    // Recalculate product rating
    const avgResult = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const newRating = avgResult[0]?.avg || "0";

    const countResult = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId));

    await db
      .update(products)
      .set({
        rating: String(parseFloat(String(newRating)).toFixed(2)),
        reviewCount: countResult.length,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json(
      { error: "خطأ في إرسال التقييم" },
      { status: 500 }
    );
  }
}
