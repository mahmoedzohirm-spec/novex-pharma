// ============================================
// ملف: src/app/api/receipts/[id]/route.ts
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, pharmacies, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = parseInt(id);
    if (isNaN(receiptId)) {
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    }

    const body = await req.json();
    const { status, rejectionReason } = body;

    // جلب الإيصال أولاً
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return NextResponse.json(
        { error: "الإيصال غير موجود" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "approved") {
      updateData.approvedAt = new Date();
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason || "";
    }

    // تحديث حالة الإيصال
    const [updated] = await db
      .update(receipts)
      .set(updateData)
      .where(eq(receipts.id, receiptId))
      .returning();

    // ✅ إذا تم قبول الإيصال، خصم المبلغ من دين الصيدلية
    if (status === "approved") {
      const [pharmacy] = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, receipt.pharmacyId))
        .limit(1);

      if (pharmacy) {
        const receiptAmount = parseFloat(String(receipt.amount));
        const currentDebt = parseFloat(String(pharmacy.totalDebt));
        const currentPaid = parseFloat(String(pharmacy.totalPaid));

        // المبلغ الذي سيتم خصمه = أقل قيمة بين مبلغ الإيصال والدين الحالي
        const maxDeductible = Math.min(receiptAmount, currentDebt);
        const newDebt = Math.max(0, currentDebt - maxDeductible);
        const newPaid = currentPaid + maxDeductible;

        console.log(`💰 خصم الإيصال #${receiptId}:`, {
          receiptAmount,
          currentDebt,
          maxDeductible,
          newDebt,
          newPaid,
        });

        // تحديث دين الصيدلية
        await db
          .update(pharmacies)
          .set({
            totalDebt: String(newDebt),
            totalPaid: String(newPaid),
            updatedAt: new Date(),
          })
          .where(eq(pharmacies.id, receipt.pharmacyId));

        // إشعار للصيدلية
        await db.insert(notifications).values({
          pharmacyId: receipt.pharmacyId,
          title: "تم قبول إيصال الدفع ✅",
          body: `تم قبول إيصالك بقيمة ${receipt.amount} ₪ وخصمه من دينك. الدين المتبقي: ${newDebt.toFixed(2)} ₪`,
          type: "success",
        });
      }
    } else if (status === "rejected") {
      // إشعار بالرفض
      await db.insert(notifications).values({
        pharmacyId: receipt.pharmacyId,
        title: "تم رفض إيصال الدفع ❌",
        body: `تم رفض إيصالك بقيمة ${receipt.amount} ₪. السبب: ${rejectionReason || "لم يذكر"}`,
        type: "error",
      });
    }

    return NextResponse.json({ receipt: updated });
  } catch (error) {
    console.error("❌ Receipt PUT error:", error);
    return NextResponse.json(
      { error: "خطأ في تحديث الإيصال" },
      { status: 500 }
    );
  }
}