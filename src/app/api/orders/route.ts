import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, pharmacies, products, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { OrderItem } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");

    let result;
    if (pharmacyId) {
      result = await db
        .select()
        .from(orders)
        .where(eq(orders.pharmacyId, parseInt(pharmacyId)))
        .orderBy(desc(orders.createdAt));
    } else {
      result = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "خطأ في جلب الطلبات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, items, subtotal, discount, total, notes } = body;

    if (!pharmacyId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }

    // Check pharmacy exists
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

    // Deduct stock for each item
    for (const item of items as OrderItem[]) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product) {
        const newStock = Math.max(
          0,
          product.stock - item.quantity - item.bonusQuantity
        );
        await db
          .update(products)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }
    }

    // Create the order
    const [order] = await db
      .insert(orders)
      .values({
        pharmacyId,
        items: items as OrderItem[],
        subtotal: String(subtotal),
        discount: String(discount || 0),
        total: String(total),
        notes: notes || "",
      })
      .returning();

    // Update pharmacy debt
    const newDebt = parseFloat(String(pharmacy.totalDebt)) + parseFloat(String(total));
    await db
      .update(pharmacies)
      .set({ totalDebt: String(newDebt), updatedAt: new Date() })
      .where(eq(pharmacies.id, pharmacyId));

    // Create notification
    await db.insert(notifications).values({
      pharmacyId,
      title: "طلب جديد",
      body: `تم استلام طلبك بقيمة ${total} شيكل بنجاح`,
      type: "order",
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { error: "خطأ في إنشاء الطلب" },
      { status: 500 }
    );
  }
}
