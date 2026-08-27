  // ============================================
  // ملف: src/components/CartBottomSheet.tsx
  // (مع عرض عدد المنتجات بشكل بارز)
  // ============================================

  "use client";

  import React, { useState } from "react";
  import {
    ShoppingCart,
    X,
    Trash2,
    Plus,
    Minus,
    Gift,
    Package,
    CheckCircle,
    Loader2,
    ChevronUp,
    ChevronDown,
  } from "lucide-react";
  import { useCart } from "@/contexts/CartContext";
  import { useAuth } from "@/contexts/AuthContext";
  import { useToast } from "@/contexts/ToastContext";
  import { cn } from "@/lib/cn";

  export default function CartBottomSheet() {
    const { items, removeItem, updateQty, clearCart, totals } = useCart();
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // حالة السلة فارغة - مع عرض العدد 0 بشكل بارز
    if (items.length === 0 && !isExpanded) {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 border-t border-blue-700 shadow-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                0
              </span>
            </div>
            <span className="text-white text-sm font-medium">السلة فارغة</span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-white text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-xl transition-colors"
          >
            تصفح المنتجات
          </button>
        </div>
      );
    }

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
          setNotes("");
          setIsExpanded(false);
        }, 2000);
      } catch (err) {
        toast.error("فشل إرسال الطلب", err instanceof Error ? err.message : "خطأ غير متوقع");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-all duration-300",
          isExpanded ? "max-h-[80vh] overflow-y-auto" : "max-h-16 overflow-hidden"
        )}
        dir="rtl"
      >
        {/* رأس السلة - مع عرض عدد المنتجات بشكل بارز */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer bg-linear-to-l from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              {/* عرض عدد المنتجات بشكل بارز مع خلفية حمراء وخط عريض */}
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                {totals.totalItems}
              </span>
            </div>
            <div>
              <span className="font-bold text-white text-base">
                {totals.totalItems} منتج
                {totals.totalBonusItems > 0 && (
                  <span className="text-yellow-300 mr-1">+ {totals.totalBonusItems} مجاني</span>
                )}
              </span>
              <span className="text-sm text-blue-200 mr-2 block">
                الإجمالي: {totals.total.toFixed(2)} ₪
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {isExpanded ? "إغلاق" : "فتح السلة"}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-white" />
            ) : (
              <ChevronUp className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* المحتوى الموسع */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">تم إرسال الطلب بنجاح!</h3>
                <p className="text-gray-500 text-sm">سيتم معالجة طلبك من قِبل الإدارة</p>
              </div>
            ) : (
              <>
                {/* عناصر السلة */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((item) => {
                    const discountedPrice = item.product.price - (item.discountAmount / item.quantity);
                    const finalTotal = item.lineTotal - item.discountAmount;

                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-100 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {item.product.name}
                          </p>
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
                            <div className="flex items-center gap-1">
                              <Gift className="w-3 h-3 text-green-500" />
                              <span className="text-green-600 text-xs font-medium">
                                +{item.bonusQuantity} مجاني
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-gray-900 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                              item.quantity >= item.product.stock
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                            )}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {totals.totalBonusItems > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-2 my-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500 shrink-0" />
                    <div>
                      <p className="text-green-700 font-semibold text-sm">
                        🎁 تحصل على {totals.totalBonusItems} قطعة مجانية!
                      </p>
                      <p className="text-green-600 text-xs">
                        وفرت {totals.savings.toFixed(2)} ₪ بفضل البونص
                      </p>
                    </div>
                  </div>
                )}

                <div className="my-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl p-2 text-sm resize-none focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="border-t border-gray-200 pt-2 space-y-1">
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
                  <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
                    <span>الإجمالي</span>
                    <span className="text-blue-700">{totals.total.toFixed(2)} ₪</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 font-semibold text-sm"
                  >
                    مسح الكل
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || !user}
                    className={cn(
                      "flex-2 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      isSubmitting || !user
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-linear-to-l from-blue-700 to-cyan-600 text-white hover:shadow-lg active:scale-95"
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
                {!user && (
                  <p className="text-center text-xs text-red-500 mt-1">
                    يجب تسجيل الدخول لإتمام الطلب
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }