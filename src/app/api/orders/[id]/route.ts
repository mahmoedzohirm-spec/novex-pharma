// ============================================
// ملف: src/app/api/orders/[id]/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, pharmacies, products, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // ✅ إذا تم الرفض، نتراجع عن الدين والمخزون
    if (status === "rejected" && currentOrder.status !== "rejected") {
      const orderTotal = parseFloat(String(currentOrder.total));

      const [pharmacy] = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, currentOrder.pharmacyId))
        .limit(1);

      if (pharmacy) {
        const currentDebt = parseFloat(String(pharmacy.totalDebt));
        const newDebt = Math.max(0, currentDebt - orderTotal);
        await db
          .update(pharmacies)
          .set({
            totalDebt: String(newDebt),
            updatedAt: new Date(),
          })
          .where(eq(pharmacies.id, currentOrder.pharmacyId));
      }

      const items = currentOrder.items as Array<{
        productId: number;
        quantity: number;
        bonusQuantity: number;
      }>;

      for (const item of items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product) {
          const newStock = product.stock + item.quantity + (item.bonusQuantity || 0);
          await db
            .update(products)
            .set({
              stock: newStock,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    // ✅ إشعار خاص بالصيدلية
    if (status === "approved" || status === "rejected") {
      await db.insert(notifications).values({
        pharmacyId: updated.pharmacyId,
        title: status === "approved" ? "✅ تم قبول طلبك" : "❌ تم رفض طلبك",
        body:
          status === "approved"
            ? `تم قبول طلبك رقم ${orderId} وهو في طريقه إليك`
            : `تم رفض طلبك رقم ${orderId}، ${notes || "لم يذكر سبب"}`,
        type: status === "approved" ? "success" : "error",
      });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("❌ Order PUT error:", error);
    return NextResponse.json(
      { error: "خطأ في تحديث الطلب" },
      { status: 500 }
    );
  }
}