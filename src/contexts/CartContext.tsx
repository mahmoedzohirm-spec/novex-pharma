// ============================================
// ملف: src/contexts/CartContext.tsx (معدل)
// ============================================

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { BonusRule } from "@/db/schema";

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  bonusRules: BonusRule[];
  imageUrl?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  bonusQuantity: number;
  lineTotal: number;
  discountAmount: number; // جديد: قيمة الخصم من هذا البند
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: CartProduct, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  totals: {
    subtotal: number;
    discount: number;
    total: number;
    totalItems: number;
    totalBonusItems: number;
    savings: number;
  };
}

// دالة حساب البونص والخصم
function calculateBonusAndDiscount(qty: number, rules: BonusRule[]): { bonusQty: number; discountAmount: number } {
  if (!rules || rules.length === 0) {
    return { bonusQty: 0, discountAmount: 0 };
  }

  // نفرز القواعد من الأكبر إلى الأصغر (لنختار أفضل عرض)
  const sorted = [...rules].sort((a, b) => b.minQty - a.minQty);

  let bonusQty = 0;
  let discountAmount = 0;

  for (const rule of sorted) {
    if (qty >= rule.minQty) {
      const sets = Math.floor(qty / rule.minQty);
      bonusQty = sets * rule.bonusQty;
      // قيمة الخصم = عدد القطع المجانية × سعر القطعة (سيتم حسابه لاحقاً)
      // discountAmount سيتم حسابه في وقت الإضافة بناءً على السعر
      break;
    }
  }

  return { bonusQty, discountAmount: 0 }; // discountAmount سيتم حسابه خارجياً
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: CartProduct, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const newQty = existing ? Math.min(existing.quantity + qty, product.stock) : Math.min(qty, product.stock);
      const { bonusQty } = calculateBonusAndDiscount(newQty, product.bonusRules);
      const discountAmount = bonusQty * product.price; // قيمة الخصم = عدد القطع المجانية × السعر

      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: newQty,
                bonusQuantity: bonusQty,
                lineTotal: newQty * product.price,
                discountAmount,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: newQty,
          bonusQuantity: bonusQty,
          lineTotal: newQty * product.price,
          discountAmount,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const newQty = Math.min(qty, i.product.stock);
        const { bonusQty } = calculateBonusAndDiscount(newQty, i.product.bonusRules);
        const discountAmount = bonusQty * i.product.price;
        return {
          ...i,
          quantity: newQty,
          bonusQuantity: bonusQty,
          lineTotal: newQty * i.product.price,
          discountAmount,
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = React.useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const totalDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
    const totalBonusItems = items.reduce((s, i) => s + i.bonusQuantity, 0);
    const total = Math.max(0, subtotal - totalDiscount);
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const savings = totalDiscount;

    return { subtotal, discount: totalDiscount, total, totalItems, totalBonusItems, savings };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}