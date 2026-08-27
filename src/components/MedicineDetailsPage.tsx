// ============================================
// ملف: src/components/MedicineDetailsPage.tsx
// ============================================

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Star,
  ShoppingCart,
  Package,
  Gift,
  Building,
  Calendar,
  Barcode,
  Send,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import type { BonusRule } from "@/db/schema";

interface Product {
  id: number;
  name: string;
  genericName: string;
  category: string;
  description: string;
  price: string;
  stock: number;
  minStock: number;
  barcode: string;
  imageUrl: string;
  manufacturer: string;
  expiryDate: string;
  bonusRules: BonusRule[];
  rating: string;
  reviewCount: number;
}

interface Review {
  id: number;
  pharmacyId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productId: number;
  onBack: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-7 h-7 transition-colors",
              star <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 fill-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function MedicineDetailsPage({ productId, onBack }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addItem, openCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, revRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch(`/api/reviews?productId=${productId}`),
        ]);
        if (prodRes.ok) {
          const d = await prodRes.json();
          setProduct(d.product);
        }
        if (revRes.ok) {
          const d = await revRes.json();
          setReviews(d.reviews || []);
        }
      } catch {
        toast.error("خطأ في تحميل تفاصيل المنتج");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productId, toast]);

  const calculateBonus = (quantity: number): number => {
    if (!product?.bonusRules?.length) return 0;
    const sorted = [...product.bonusRules].sort((a, b) => b.minQty - a.minQty);
    for (const rule of sorted) {
      if (quantity >= rule.minQty) {
        return Math.floor(quantity / rule.minQty) * rule.bonusQty;
      }
    }
    return 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        stock: product.stock,
        bonusRules: product.bonusRules || [],
        imageUrl: product.imageUrl,
      },
      qty
    );
    toast.success("تمت الإضافة للسلة", `${qty} × ${product.name}`);
    openCart();
  };

  const handleSubmitReview = async () => {
    if (!user || user.role !== "pharmacy") {
      toast.warning("يجب تسجيل الدخول كصيدلية لإرسال تقييم");
      return;
    }
    if (!reviewRating) {
      toast.warning("يرجى اختيار تقييم");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, pharmacyId: user.id, rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) {
        toast.success("تم إرسال تقييمك بنجاح!");
        setReviewRating(0);
        setReviewComment("");
        const revRes = await fetch(`/api/reviews?productId=${productId}`);
        if (revRes.ok) {
          const d = await revRes.json();
          setReviews(d.reviews || []);
        }
      } else {
        throw new Error("فشل إرسال التقييم");
      }
    } catch {
      toast.error("فشل إرسال التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const bonus = product ? calculateBonus(qty) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500">المنتج غير موجود</p>
        <button onClick={onBack} className="px-6 py-2 bg-blue-600 text-white rounded-xl">
          العودة
        </button>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const lineTotal = qty * price;

  return (
    <div className="min-h-screen bg-gray-50 pt-16" dir="rtl">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold">
          <ArrowRight className="w-5 h-5" />
          العودة للكتالوج
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 text-sm truncate">{product.name}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - image & quick info */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl h-64 flex items-center justify-center mb-4 shadow-inner">
              {product.imageUrl && (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("data:")) ? (
                <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <Package className="w-20 h-20 text-blue-300 mx-auto mb-2" />
                  <p className="text-blue-400 font-medium">{product.category}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Building, label: "المصنع", value: product.manufacturer || "-" },
                { icon: Barcode, label: "الباركود", value: product.barcode || "-" },
                // تم إزالة المخزون وتاريخ الانتهاء من هنا
              ].map((info) => {
                const Icon = info.icon;
                return (
                  <div key={info.label} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-500 text-xs">{info.label}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{info.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column - details & cart */}
          <div className="space-y-4">
            <div>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-lg font-medium">
                {product.category}
              </span>
              <h1 className="text-2xl font-black text-gray-900 mt-2">{product.name}</h1>
              {product.genericName && <p className="text-gray-500 text-sm">{product.genericName}</p>}
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-4 h-4",
                      s <= Math.round(parseFloat(product.rating)) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
                    )}
                  />
                ))}
                <span className="text-sm text-gray-500">
                  {parseFloat(product.rating).toFixed(1)} ({product.reviewCount} تقييم)
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-l from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-700">{price.toFixed(2)}</span>
                <span className="text-gray-500">₪ / وحدة</span>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1">الوصف</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.bonusRules && product.bonusRules.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <h3 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5" />
                  عروض البونص
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.bonusRules.map((rule, idx) => (
                    <span key={idx} className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-xl font-semibold">
                      {rule.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Cart */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-gray-900">الكمية</label>
                {bonus > 0 && (
                  <span className="bg-green-100 text-green-700 text-sm px-3 py-0.5 rounded-xl font-semibold flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    +{bonus} مجاني
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center border border-gray-200 rounded-xl py-2 font-bold text-lg focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    qty >= product.stock ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>الإجمالي</span>
                <span className="font-bold text-blue-700 text-base">{lineTotal.toFixed(2)} ₪</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={cn(
                  "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95",
                  product.stock === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-linear-to-l from-blue-700 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/30"
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? "غير متوفر" : "أضف للسلة"}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">التقييمات ({reviews.length})</h2>
          {user?.role === "pharmacy" && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
              <h3 className="font-bold text-gray-900 mb-3">أضف تقييمك</h3>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا (اختياري)..."
                rows={3}
                className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewRating}
                className={cn(
                  "mt-3 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200",
                  isSubmittingReview || !reviewRating
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                )}
              >
                {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال التقييم
              </button>
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-4 h-4",
                          s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
                        )}
                      />
                    ))}
                    <span className="text-xs text-gray-400 mr-2">صيدلية #{review.pharmacyId}</span>
                  </div>
                  {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}