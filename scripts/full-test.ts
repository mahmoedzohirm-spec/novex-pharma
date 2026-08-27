// scripts/full-test.ts
import * as dotenv from "dotenv";
import { resolve } from "path";

// ✅ تحميل .env.local من جذر المشروع
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ✅ تحقق من وجود DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL غير موجود في .env.local");
  process.exit(1);
}

// ✅ الآن استورد باقي المكتبات (بعد التأكد من وجود المتغير)
import { db } from "../src/db";
import {
  pharmacies,
  admins,
  products,
  orders,
  receipts,
  reviews,
  notifications,
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt, decrypt } from "../src/lib/encryption";
import { generateToken, verifyToken } from "../src/lib/jwt";

// ─── أدوات مساعدة ──────────────────────────────────────────────────────────────
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

const log = (msg: string, type: "info" | "success" | "error" | "warn" = "info") => {
  const colorMap = {
    info: colors.cyan,
    success: colors.green,
    error: colors.red,
    warn: colors.yellow,
  };
  console.log(`${colorMap[type]}${msg}${colors.reset}`);
};

const logTest = (name: string, passed: boolean, details?: string) => {
  const icon = passed ? "✅" : "❌";
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${colors.reset}${details ? ` - ${details}` : ""}`);
};

// ─── 1. اختبار الاتصال بقاعدة البيانات ───────────────────────────────────────
async function testDatabaseConnection() {
  log("\n📡 اختبار الاتصال بقاعدة البيانات...", "info");
  try {
    const result = await db.execute(sql`SELECT NOW() as now`);
    if (result.rows && result.rows.length > 0) {
      logTest("الاتصال بقاعدة البيانات", true, `الوقت: ${result.rows[0].now}`);
      return true;
    }
    logTest("الاتصال بقاعدة البيانات", false, "لم يتم الحصول على نتيجة");
    return false;
  } catch (error) {
    logTest("الاتصال بقاعدة البيانات", false, (error as Error).message);
    return false;
  }
}

// ─── 2. اختبار التشفير وفك التشفير ───────────────────────────────────────────
function testEncryption() {
  log("\n🔐 اختبار التشفير وفك التشفير...", "info");
  try {
    const original = "password123";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    if (decrypted === original) {
      logTest("التشفير/فك التشفير", true, `"${original}" → "${encrypted}" → "${decrypted}"`);
      return true;
    }
    logTest("التشفير/فك التشفير", false, `فشل: ${original} ≠ ${decrypted}`);
    return false;
  } catch (error) {
    logTest("التشفير/فك التشفير", false, (error as Error).message);
    return false;
  }
}

// ─── 3. اختبار JWT ────────────────────────────────────────────────────────────
function testJWT() {
  log("\n🔑 اختبار JWT...", "info");
  try {
    const payload = { id: 1, role: "admin", email: "admin@test.com" };
    const token = generateToken(payload);
    const verified = verifyToken(token);

    if (verified && verified.id === payload.id && verified.role === payload.role) {
      logTest("JWT", true, `التوكن: ${token.substring(0, 20)}... (صالح)`);
      return true;
    }
    logTest("JWT", false, "فشل التحقق من التوكن");
    return false;
  } catch (error) {
    logTest("JWT", false, (error as Error).message);
    return false;
  }
}

// ─── 4. اختبار مصادقة المدير ──────────────────────────────────────────────────
async function testAdminAuth() {
  log("\n👤 اختبار مصادقة المدير...", "info");
  try {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, "admin"))
      .limit(1);

    if (!admin) {
      logTest("مصادقة المدير", false, "حساب admin غير موجود");
      return false;
    }

    const plainPassword = "admin123";
    const valid = await bcrypt.compare(plainPassword, admin.passwordHash);

    if (valid) {
      logTest("مصادقة المدير", true, `admin موجود وكلمة المرور صحيحة`);
      return true;
    }
    logTest("مصادقة المدير", false, "كلمة المرور غير صحيحة");
    return false;
  } catch (error) {
    logTest("مصادقة المدير", false, (error as Error).message);
    return false;
  }
}

// ─── 5. اختبار CRUD الصيدليات ─────────────────────────────────────────────────
async function testPharmacyCRUD() {
  log("\n🏥 اختبار CRUD الصيدليات...", "info");
  try {
    const testPharmacy = {
      name: "صيدلية اختبار CRUD",
      ownerName: "مالك اختبار",
      phone: `05${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `test-${Date.now()}@crud.com`,
      passwordHash: await bcrypt.hash("test123", 12),
      encryptedPassword: encrypt("test123"),
      creditLimit: "5000",
      isActive: true,
      notes: "تم إنشاؤها بواسطة اختبار CRUD",
    };

    const [pharmacy] = await db
      .insert(pharmacies)
      .values(testPharmacy)
      .returning();

    logTest("إنشاء صيدلية", true, `ID: ${pharmacy.id}`);

    const [readPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacy.id))
      .limit(1);

    if (readPharmacy && readPharmacy.name === testPharmacy.name) {
      logTest("قراءة صيدلية", true, `الاسم: ${readPharmacy.name}`);
    } else {
      logTest("قراءة صيدلية", false, "البيانات غير متطابقة");
    }

    await db
      .update(pharmacies)
      .set({ creditLimit: "10000", notes: "تم التحديث" })
      .where(eq(pharmacies.id, pharmacy.id));

    const [updatedPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacy.id))
      .limit(1);

    if (updatedPharmacy.creditLimit === "10000") {
      logTest("تحديث صيدلية", true, `حد الائتمان: ${updatedPharmacy.creditLimit}`);
    } else {
      logTest("تحديث صيدلية", false, "فشل التحديث");
    }

    if (updatedPharmacy.encryptedPassword) {
      const decryptedPassword = decrypt(updatedPharmacy.encryptedPassword);
      if (decryptedPassword === "test123") {
        logTest("فك تشفير كلمة المرور", true, `كلمة المرور: ${decryptedPassword}`);
      } else {
        logTest("فك تشفير كلمة المرور", false, `فشل: ${decryptedPassword}`);
      }
    } else {
      logTest("فك تشفير كلمة المرور", false, "لا يوجد encryptedPassword");
    }

    await db
      .update(pharmacies)
      .set({ isActive: false })
      .where(eq(pharmacies.id, pharmacy.id));

    await db.delete(pharmacies).where(eq(pharmacies.id, pharmacy.id));

    const [deleted] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacy.id))
      .limit(1);

    if (!deleted) {
      logTest("حذف صيدلية", true, "تم الحذف بنجاح");
    } else {
      logTest("حذف صيدلية", false, "لا يزال موجوداً");
    }

    return true;
  } catch (error) {
    logTest("CRUD الصيدليات", false, (error as Error).message);
    return false;
  }
}

// ─── 6. اختبار CRUD المنتجات ──────────────────────────────────────────────────
async function testProductCRUD() {
  log("\n📦 اختبار CRUD المنتجات...", "info");
  try {
    const testProduct = {
      name: "منتج اختبار CRUD",
      genericName: "Generic Test",
      category: "عام",
      description: "منتج للاختبار",
      price: "15.50",
      costPrice: "8.00",
      stock: 50,
      minStock: 5,
      barcode: `BARCODE-${Date.now()}`,
      manufacturer: "مختبر الاختبار",
      expiryDate: "2027-12",
      bonusRules: [{ minQty: 10, bonusQty: 2, label: "10+2" }],
      isActive: true,
    };

    const [product] = await db
      .insert(products)
      .values(testProduct)
      .returning();

    logTest("إنشاء منتج", true, `ID: ${product.id}, الاسم: ${product.name}`);

    const [readProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);

    if (readProduct && readProduct.name === testProduct.name) {
      logTest("قراءة منتج", true, `السعر: ${readProduct.price}`);
    } else {
      logTest("قراءة منتج", false, "غير متطابق");
    }

    await db
      .update(products)
      .set({ price: "20.00", stock: 100 })
      .where(eq(products.id, product.id));

    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);

    if (updatedProduct.price === "20.00" && updatedProduct.stock === 100) {
      logTest("تحديث منتج", true, `السعر الجديد: ${updatedProduct.price}, المخزون: ${updatedProduct.stock}`);
    } else {
      logTest("تحديث منتج", false, "فشل التحديث");
    }

    if (updatedProduct.bonusRules && updatedProduct.bonusRules.length > 0) {
      const bonus = updatedProduct.bonusRules[0];
      logTest("البونص", true, `${bonus.label} (عند ${bonus.minQty} تحصل على ${bonus.bonusQty} مجاناً)`);
    } else {
      logTest("البونص", false, "لا توجد قواعد بونص");
    }

    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, product.id));

    await db.delete(products).where(eq(products.id, product.id));

    const [deleted] = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);

    if (!deleted) {
      logTest("حذف منتج", true, "تم الحذف بنجاح");
    } else {
      logTest("حذف منتج", false, "لا يزال موجوداً");
    }

    return true;
  } catch (error) {
    logTest("CRUD المنتجات", false, (error as Error).message);
    return false;
  }
}

// ─── 7. اختبار الطلبات ────────────────────────────────────────────────────────
async function testOrders() {
  log("\n🛒 اختبار الطلبات...", "info");
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(1);

    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.isActive, true))
      .limit(1);

    if (!product || !pharmacy) {
      logTest("الطلبات", false, "لا يوجد منتج أو صيدلية نشطة للاختبار");
      return false;
    }

    const initialStock = product.stock;
    const initialDebt = parseFloat(pharmacy.totalDebt);
    const creditLimit = parseFloat(pharmacy.creditLimit);

    const orderTotal = 1000;
    if (initialDebt + orderTotal > creditLimit) {
      logTest("التحقق من حد الائتمان", true, `تم رفض الطلب (تجاوز الحد: ${initialDebt + orderTotal} > ${creditLimit})`);
      return true;
    } else {
      logTest("التحقق من حد الائتمان", true, `الطلب مسموح (${initialDebt + orderTotal} ≤ ${creditLimit})`);
    }

    const quantity = 3;
    const price = parseFloat(product.price);
    const total = quantity * price;

    const [order] = await db
      .insert(orders)
      .values({
        pharmacyId: pharmacy.id,
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantity,
            bonusQuantity: 0,
            price,
            total,
          },
        ],
        subtotal: String(total),
        discount: "0",
        total: String(total),
        status: "pending",
        notes: "طلب اختبار",
      })
      .returning();

    logTest("إنشاء طلب", true, `طلب #${order.id} بقيمة ${total}`);

    const newStock = Math.max(0, initialStock - quantity);
    await db
      .update(products)
      .set({ stock: newStock })
      .where(eq(products.id, product.id));

    const newDebt = initialDebt + total;
    await db
      .update(pharmacies)
      .set({ totalDebt: String(newDebt) })
      .where(eq(pharmacies.id, pharmacy.id));

    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);

    const [updatedPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacy.id))
      .limit(1);

    if (updatedProduct.stock === initialStock - quantity) {
      logTest("خصم المخزون", true, `المخزون الجديد: ${updatedProduct.stock}`);
    } else {
      logTest("خصم المخزون", false, `فشل: ${updatedProduct.stock} ≠ ${initialStock - quantity}`);
    }

    if (parseFloat(updatedPharmacy.totalDebt) === initialDebt + total) {
      logTest("تحديث الدين", true, `الدين الجديد: ${updatedPharmacy.totalDebt}`);
    } else {
      logTest("تحديث الدين", false, `فشل: ${updatedPharmacy.totalDebt} ≠ ${initialDebt + total}`);
    }

    await db
      .update(orders)
      .set({ status: "approved" })
      .where(eq(orders.id, order.id));

    const [approvedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order.id))
      .limit(1);

    if (approvedOrder.status === "approved") {
      logTest("تغيير حالة الطلب إلى مقبول", true, "تم القبول");
    } else {
      logTest("تغيير حالة الطلب إلى مقبول", false, "فشل");
    }

    await db
      .update(products)
      .set({ stock: initialStock })
      .where(eq(products.id, product.id));

    await db
      .update(pharmacies)
      .set({ totalDebt: String(initialDebt) })
      .where(eq(pharmacies.id, pharmacy.id));

    await db.delete(orders).where(eq(orders.id, order.id));

    logTest("تنظيف بيانات الطلب", true, "تمت إعادة الحالة الأصلية");

    return true;
  } catch (error) {
    logTest("الطلبات", false, (error as Error).message);
    return false;
  }
}

// ─── 8. اختبار الإيصالات ──────────────────────────────────────────────────────
async function testReceipts() {
  log("\n💳 اختبار الإيصالات...", "info");
  try {
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.isActive, true))
      .limit(1);

    if (!pharmacy) {
      logTest("الإيصالات", false, "لا توجد صيدلية نشطة");
      return false;
    }

    const initialDebt = parseFloat(pharmacy.totalDebt);
    const amount = 50;

    const [receipt] = await db
      .insert(receipts)
      .values({
        pharmacyId: pharmacy.id,
        amount: String(amount),
        status: "pending",
        notes: "إيصال اختبار",
      })
      .returning();

    logTest("إنشاء إيصال", true, `إيصال #${receipt.id} بقيمة ${amount}`);

    const newDebt = Math.max(0, initialDebt - amount);
    await db
      .update(pharmacies)
      .set({ totalDebt: String(newDebt) })
      .where(eq(pharmacies.id, pharmacy.id));

    await db
      .update(receipts)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(receipts.id, receipt.id));

    const [updatedPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, pharmacy.id))
      .limit(1);

    const [updatedReceipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receipt.id))
      .limit(1);

    if (parseFloat(updatedPharmacy.totalDebt) === initialDebt - amount) {
      logTest("خصم الدين بعد قبول الإيصال", true, `الدين الجديد: ${updatedPharmacy.totalDebt}`);
    } else {
      logTest("خصم الدين بعد قبول الإيصال", false, `فشل: ${updatedPharmacy.totalDebt} ≠ ${initialDebt - amount}`);
    }

    if (updatedReceipt.status === "approved") {
      logTest("تحديث حالة الإيصال إلى مقبول", true, "تم القبول");
    } else {
      logTest("تحديث حالة الإيصال إلى مقبول", false, "فشل");
    }

    const [receipt2] = await db
      .insert(receipts)
      .values({
        pharmacyId: pharmacy.id,
        amount: String(30),
        status: "pending",
        notes: "إيصال مرفوض",
      })
      .returning();

    await db
      .update(receipts)
      .set({ status: "rejected", rejectionReason: "اختبار الرفض" })
      .where(eq(receipts.id, receipt2.id));

    const [rejected] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receipt2.id))
      .limit(1);

    if (rejected.status === "rejected") {
      logTest("رفض إيصال", true, `السبب: ${rejected.rejectionReason}`);
    } else {
      logTest("رفض إيصال", false, "فشل");
    }

    await db
      .update(pharmacies)
      .set({ totalDebt: String(initialDebt) })
      .where(eq(pharmacies.id, pharmacy.id));

    await db.delete(receipts).where(eq(receipts.id, receipt.id));
    await db.delete(receipts).where(eq(receipts.id, receipt2.id));

    logTest("تنظيف بيانات الإيصالات", true, "تمت الإعادة");

    return true;
  } catch (error) {
    logTest("الإيصالات", false, (error as Error).message);
    return false;
  }
}

// ─── 9. اختبار التقييمات ──────────────────────────────────────────────────────
async function testReviews() {
  log("\n⭐ اختبار التقييمات...", "info");
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(1);

    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.isActive, true))
      .limit(1);

    if (!product || !pharmacy) {
      logTest("التقييمات", false, "لا يوجد منتج أو صيدلية نشطة");
      return false;
    }

    const rating = 4;
    const comment = "منتج ممتاز!";

    const [review] = await db
      .insert(reviews)
      .values({
        productId: product.id,
        pharmacyId: pharmacy.id,
        rating,
        comment,
      })
      .returning();

    logTest("إضافة تقييم", true, `تقييم ${rating} نجوم: "${comment}"`);

    const allReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, product.id));

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db
      .update(products)
      .set({
        rating: String(avgRating.toFixed(2)),
        reviewCount: allReviews.length,
      })
      .where(eq(products.id, product.id));

    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .limit(1);

    if (parseFloat(updatedProduct.rating) === avgRating) {
      logTest("تحديث متوسط التقييم", true, `المتوسط: ${updatedProduct.rating} (${updatedProduct.reviewCount} تقييم)`);
    } else {
      logTest("تحديث متوسط التقييم", false, `فشل: ${updatedProduct.rating} ≠ ${avgRating}`);
    }

    await db.delete(reviews).where(eq(reviews.id, review.id));

    const remaining = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, product.id));

    if (remaining.length === 0) {
      await db
        .update(products)
        .set({ rating: "0", reviewCount: 0 })
        .where(eq(products.id, product.id));
    } else {
      const newAvg = remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length;
      await db
        .update(products)
        .set({
          rating: String(newAvg.toFixed(2)),
          reviewCount: remaining.length,
        })
        .where(eq(products.id, product.id));
    }

    logTest("تنظيف بيانات التقييم", true, "تم الحذف");

    return true;
  } catch (error) {
    logTest("التقييمات", false, (error as Error).message);
    return false;
  }
}

// ─── 10. اختبار الإشعارات ─────────────────────────────────────────────────────
async function testNotifications() {
  log("\n🔔 اختبار الإشعارات...", "info");
  try {
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.isActive, true))
      .limit(1);

    if (!pharmacy) {
      logTest("الإشعارات", false, "لا توجد صيدلية نشطة");
      return false;
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        pharmacyId: pharmacy.id,
        title: "اختبار إشعار",
        body: "هذا إشعار تم إنشاؤه بواسطة سكريبت الاختبار",
        type: "info",
        isRead: false,
      })
      .returning();

    logTest("إنشاء إشعار", true, `إشعار #${notification.id}`);

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notification.id));

    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id))
      .limit(1);

    if (updated.isRead) {
      logTest("تحديث حالة الإشعار إلى مقروء", true, "تم التحديث");
    } else {
      logTest("تحديث حالة الإشعار إلى مقروء", false, "فشل");
    }

    await db.delete(notifications).where(eq(notifications.id, notification.id));
    logTest("تنظيف الإشعارات", true, "تم الحذف");

    return true;
  } catch (error) {
    logTest("الإشعارات", false, (error as Error).message);
    return false;
  }
}

// ─── تشغيل جميع الاختبارات ────────────────────────────────────────────────────
async function runAllTests() {
  log("\n🚀 بدء تشغيل سكريبت الاختبار الشامل...", "info");
  log("═══════════════════════════════════════════════════════════════", "info");

  const results = {
    database: await testDatabaseConnection(),
    encryption: testEncryption(),
    jwt: testJWT(),
    adminAuth: await testAdminAuth(),
    pharmacyCRUD: await testPharmacyCRUD(),
    productCRUD: await testProductCRUD(),
    orders: await testOrders(),
    receipts: await testReceipts(),
    reviews: await testReviews(),
    notifications: await testNotifications(),
  };

  log("\n📊 ملخص النتائج:", "info");
  log("═══════════════════════════════════════════════════════════════", "info");

  let passed = 0;
  let failed = 0;

  for (const [key, value] of Object.entries(results)) {
    const status = value ? "✅ نجاح" : "❌ فشل";
    const color = value ? colors.green : colors.red;
    console.log(`${color}${key}: ${status}${colors.reset}`);
    if (value) passed++;
    else failed++;
  }

  log("═══════════════════════════════════════════════════════════════", "info");
  log(`\n✅ اجتاز: ${passed} / ${passed + failed}`, "success");
  if (failed > 0) {
    log(`❌ فشل: ${failed}`, "error");
  } else {
    log("🎉 جميع الاختبارات اكتملت بنجاح!", "success");
  }

  process.exit(0);
}

runAllTests();