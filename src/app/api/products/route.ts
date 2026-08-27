// ============================================
// ملف: src/app/api/products/route.ts
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    let query = db.select().from(products).where(eq(products.isActive, true)).$dynamic();

    if (search) {
      query = query.where(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.genericName, `%${search}%`),
          ilike(products.barcode, `%${search}%`)
        )
      );
    }

    if (category && category !== "all") {
      query = query.where(eq(products.category, category));
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "خطأ في جلب المنتجات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      genericName,
      category,
      description,
      price,
      costPrice,
      stock,
      minStock,
      barcode,
      imageUrl,
      manufacturer,
      expiryDate,
      bonusRules,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "اسم المنتج والسعر مطلوبان" },
        { status: 400 }
      );
    }

    // تحويل الباركود الفارغ إلى null
    const barcodeValue = barcode?.trim() === "" ? null : barcode?.trim() || null;

    const [product] = await db
      .insert(products)
      .values({
        name,
        genericName: genericName || "",
        category: category || "عام",
        description: description || "",
        price: String(price),
        costPrice: String(costPrice || 0),
        stock: stock || 0,
        minStock: minStock || 10,
        barcode: barcodeValue,
        imageUrl: imageUrl || "",
        manufacturer: manufacturer || "",
        expiryDate: expiryDate || "",
        bonusRules: bonusRules || [],
      })
      .returning();

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "خطأ في إضافة المنتج" }, { status: 500 });
  }
}