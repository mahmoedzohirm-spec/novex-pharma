// ============================================
// ملف: src/components/CartModal.tsx (معدل)
// ============================================

"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Gift,
  Package,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";

export default function CartModal() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart, totals } = useCart();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    if (!user || user.role !== "pharmacy") {
      toast.error("يجب تسجيل الدخول كصيدلية لإتمام الطلب");
      return;
    }
    if (items.length === 0) {
      toast.warning("السلة فارغة");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        bonusQuantity: item.bonusQuantity,
        price: item.product.price,
        total: item.lineTotal - item.discountAmount,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId: user.id,
          items: orderItems,
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "خطأ في إرسال الطلب");
      }

      const currentDebt = parseFloat(user.totalDebt || "0");
      updateUser({ totalDebt: String(currentDebt + totals.total) });

      setIsSuccess(true);
      clearCart();
      toast.success("تم إرسال طلبك بنجاح!", "سيتم معالجة طلبك قريباً");

      setTimeout(() => {
        setIsSuccess(false);
        closeCart();
        setNotes("");
      }, 2000);
    } catch (err) {
      toast.error("فشل إرسال الطلب", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCart();
      }}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/30 flex flex-col"
        dir="rtl"
      >
        <div className="bg-linear-to-l from-blue-900 via-blue-700 to-cyan-600 p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">سلة الطلب</h2>
              <p className="text-blue-200 text-sm">
                {totals.totalItems} منتج
                {totals.totalBonusItems > 0 && ` + ${totals.totalBonusItems} مجاني`}
              </p>
            </div>
          </div>
          <button onClick={closeCart} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {isSuccess && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">تم إرسال الطلب بنجاح!</h3>
            <p className="text-gray-500 text-center">سيتم معالجة طلبك من قِبل الإدارة</p>
          </div>
        )}

        {!isSuccess && items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
            <div className="bg-blue-50 rounded-full p-6">
              <Package className="w-16 h-16 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">السلة فارغة</h3>
            <p className="text-gray-500">أضف منتجات من الكتالوج</p>
            <button onClick={closeCart} className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold">
              تصفح المنتجات
            </button>
          </div>
        )}

        {!isSuccess && items.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => {
                const discountedPrice = item.product.price - (item.discountAmount / item.quantity);
                const finalTotal = item.lineTotal - item.discountAmount;

                return (
                  <div
                    key={item.product.id}
                    className="bg-gray-50 rounded-xl p-3 flex items-start gap-3 border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.bonusQuantity > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-xs">
                              {item.product.price.toFixed(2)} ₪
                            </span>
                            <span className="text-green-600 font-bold text-sm">
                              {discountedPrice.toFixed(2)} ₪
                            </span>
                            <span className="text-green-500 text-xs">(وفرت {item.discountAmount.toFixed(2)} ₪)</span>
                          </>
                        ) : (
                          <span className="text-blue-600 font-bold text-sm">
                            {item.product.price.toFixed(2)} ₪
                          </span>
                        )}
                      </div>
                      {item.bonusQuantity > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Gift className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 text-xs font-medium">+{item.bonusQuantity} مجاني</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                          item.quantity >= item.product.stock
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                        )}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">{finalTotal.toFixed(2)} ₪</p>
                      <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {totals.totalBonusItems > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-green-700 font-semibold text-sm">
                      🎁 أنت تحصل على {totals.totalBonusItems} قطعة مجانية!
                    </p>
                    <p className="text-green-600 text-xs">
                      وفرت {totals.savings.toFixed(2)} ₪ بفضل البونص
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ملاحظات (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 space-y-3 flex-shrink-0 bg-gray-50/80">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-semibold">{totals.subtotal.toFixed(2)} ₪</span>
                </div>
                {totals.savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>التوفير (البونص)</span>
                    <span>- {totals.savings.toFixed(2)} ₪</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1">
                  <span>الإجمالي</span>
                  <span className="text-blue-700 text-lg">{totals.total.toFixed(2)} ₪</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={clearCart} className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 font-semibold text-sm">
                  مسح الكل
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !user}
                  className={cn(
                    "flex-[2] py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    isSubmitting || !user
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-linear-to-l from-blue-700 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تأكيد الطلب
                    </>
                  )}
                </button>
              </div>
              {!user && <p className="text-center text-xs text-red-500">يجب تسجيل الدخول لإتمام الطلب</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}