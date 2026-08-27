// ============================================
// ملف: src/components/CatalogPage.tsx (معدل - إعادة الألوان الزرقاء)
// ============================================
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Star,
  Package,
  Gift,
  Filter,
  X,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import type { BonusRule } from "@/db/schema";
import CartBottomSheet from "@/components/CartBottomSheet";
import Image from "next/image";

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

const CATEGORIES = [
  "الكل",
  "مضادات حيوية",
  "مسكنات",
  "هضمية",
  "سكري",
  "حساسية",
  "قلب وأوعية",
  "فيتامينات",
  "عام",
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
      <div className="bg-gray-200 rounded-xl h-40 mb-4" />
      <div className="bg-gray-200 rounded h-4 mb-2" />
      <div className="bg-gray-200 rounded h-3 w-2/3 mb-3" />
      <div className="flex justify-between items-center">
        <div className="bg-gray-200 rounded h-5 w-20" />
        <div className="bg-gray-200 rounded-xl h-8 w-24" />
      </div>
    </div>
  );
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3.5 h-3.5",
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-200 fill-gray-200"
          )}
        />
      ))}
      <span className="text-xs text-gray-500 mr-1">({count})</span>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, qty: number) => void;
  onViewDetails: (product: Product) => void;
}

function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const isOutOfStock = product.stock === 0;
  const bestBonus =
    product.bonusRules && product.bonusRules.length > 0
      ? product.bonusRules[product.bonusRules.length - 1]
      : null;

  const handleAdd = () => {
    if (qty > 0 && !isOutOfStock) {
      onAddToCart(product, qty);
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
        isOutOfStock ? "border-red-100 opacity-75" : "border-gray-100 hover:border-blue-200"
      )}
    >
      <div
        className="relative h-36 cursor-pointer overflow-hidden"
        onClick={() => onViewDetails(product)}
      >
        {product.imageUrl && (product.imageUrl.startsWith("http") || product.imageUrl.startsWith("data:")) ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={200}
            height={150}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-blue-300 mb-1" />
            <span className="text-blue-200 text-xs">{product.category}</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-lg font-semibold">
              نفذ المخزون
            </span>
          )}
        </div>
        {bestBonus && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
              <Gift className="w-3 h-3" />
              {bestBonus.label}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3
          className="font-bold text-gray-900 text-sm mb-0.5 truncate cursor-pointer hover:text-blue-700 transition-colors"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </h3>
        {product.genericName && (
          <p className="text-gray-400 text-xs mb-1 truncate">
            {product.genericName}
          </p>
        )}

        <RatingStars
          rating={parseFloat(product.rating)}
          count={product.reviewCount}
        />

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-blue-700 font-black text-lg">
              {parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-gray-400 text-xs mr-1">₪</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition"
              disabled={isOutOfStock}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={qty}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1) setQty(Math.min(val, product.stock));
              }}
              className="w-12 text-center border-x border-gray-200 py-1.5 text-sm font-semibold focus:outline-none"
              disabled={isOutOfStock}
            />
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition"
              disabled={isOutOfStock || qty >= product.stock}
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-95",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-linear-to-l from-blue-700 to-cyan-600 text-white hover:shadow-lg"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            أضف
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage({
  onViewDetails,
}: {
  onViewDetails: (productId: number) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const { addItem } = useCart();
  const toast = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      toast.error("خطأ في تحميل المنتجات");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 300);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.genericName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search);
    const matchesCategory =
      activeCategory === "الكل" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product, qty: number) => {
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
    toast.success(`تمت الإضافة`, `${qty} × ${product.name} في السلة`);
  };

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stock > 0).length,
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الهيدر العلوي - ألوان زرقاء */}
      <div className="bg-linear-to-l from-blue-900 via-indigo-800 to-cyan-700 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image
                src="/lond.jpg"
                alt="Novex Pharma"
                width={64}
                height={64}
                className="w-16 h-16 rounded-2xl shadow-lg object-cover"
              />
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white">
                  <span className="text-cyan-300">Novex</span>
                  <span className="text-white"> Pharma</span>
                </h1>
                <p className="text-blue-200 text-sm">نظام إدارة الصيدليات</p>
              </div>
            </div>
            <p className="text-blue-200">
              اطلع على جميع منتجاتنا وأضفها لسلة طلبك
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto">
            {[
              {
                label: "إجمالي المنتجات",
                value: stats.total,
                icon: Package,
                color: "from-blue-500 to-cyan-500",
              },
              {
                label: "متوفر",
                value: stats.inStock,
                icon: BarChart3,
                color: "from-green-500 to-emerald-500",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20"
                >
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br mb-1",
                      s.color
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-bold text-xl">{s.value}</p>
                  <p className="text-blue-200 text-xs">{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث باسم الدواء أو المادة الفعالة أو الباركود..."
              className="w-full bg-white rounded-2xl pr-12 pl-10 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xl text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* قسم التصنيفات - ألوان زرقاء */}
      <div className="bg-white shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200",
                  activeCategory === cat
                    ? "bg-linear-to-l from-blue-700 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 text-sm">
              {filtered.length} منتج
              {search && (
                <span className="text-blue-600 mr-1">&quot;{search}&quot;</span>
              )}
            </span>
          </div>
          {(search || activeCategory !== "الكل") && (
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("الكل");
              }}
              className="text-red-500 text-sm hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-gray-400 mb-4">
              {search
                ? `لم يتم العثور على نتائج لـ "${search}"`
                : "لا توجد منتجات في هذه الفئة"}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("الكل");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              عرض الكل
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={(p) => onViewDetails(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CartBottomSheet />
    </div>
  );
}