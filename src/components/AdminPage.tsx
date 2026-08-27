// ============================================
// ملف: src/components/AdminPage.tsx
// ============================================
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Users,
  ClipboardList,
  CreditCard,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Eye,
  AlertTriangle,
  BarChart3,
  Loader2,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Gift,
  Upload,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import type { BonusRule } from "@/db/schema";
import PharmacyDetailPage from "@/components/PharmacyDetailPage";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  genericName: string;
  category: string;
  description: string;
  price: string;
  costPrice: string;
  stock: number;
  minStock: number;
  barcode: string;
  manufacturer: string;
  expiryDate: string;
  bonusRules: BonusRule[];
  rating: string;
  reviewCount: number;
  isActive: boolean;
  imageUrl: string;
}

interface Pharmacy {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  totalDebt: string;
  totalPaid: string;
  creditLimit: string;
  isActive: boolean;
  notes: string;
}

interface Order {
  id: number;
  pharmacyId: number;
  items: Array<{
    productName: string;
    quantity: number;
    bonusQuantity: number;
    price: number;
    total: number;
  }>;
  total: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface Receipt {
  id: number;
  pharmacyId: number;
  amount: string;
  imageUrl: string;
  status: string;
  notes: string;
  rejectionReason: string;
  createdAt: string;
}

type AdminTab = "dashboard" | "products" | "pharmacies" | "orders" | "receipts";

interface AdminPageProps {
  initialTab?: AdminTab;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl bg-linear-to-br", gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ProductForm({
  product,
  onSave,
  onClose,
}: {
  product?: Product | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || "");

  const [form, setForm] = useState({
    name: product?.name || "",
    genericName: product?.genericName || "",
    category: product?.category || "عام",
    price: product?.price || "",
    costPrice: product?.costPrice || "",
    stock: product?.stock || 0,
    minStock: product?.minStock || 10,
    barcode: product?.barcode || "",
    manufacturer: product?.manufacturer || "",
    expiryDate: product?.expiryDate || "",
    description: product?.description || "",
  });
  const [bonusRules, setBonusRules] = useState<BonusRule[]>(product?.bonusRules || []);

  const addBonusRule = () => {
    setBonusRules((r) => [...r, { minQty: 12, bonusQty: 1, label: "12+1" }]);
  };

  const updateBonusRule = (idx: number, key: keyof BonusRule, value: number | string) => {
    setBonusRules((rules) =>
      rules.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: value };
        if (key === "minQty" || key === "bonusQty") {
          updated.label = `${updated.minQty}+${updated.bonusQty}`;
        }
        return updated;
      })
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url || "";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.warning("الاسم والسعر مطلوبان");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = product?.imageUrl || "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast.warning("فشل رفع الصورة، سيتم حفظ المنتج بدون صورة");
        }
      }

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bonusRules, imageUrl }),
      });

      if (res.ok) {
        toast.success(product ? "تم تحديث المنتج" : "تم إضافة المنتج");
        onSave();
        onClose();
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err) {
      toast.error("خطأ", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const CATEGORIES = ["مضادات حيوية", "مسكنات", "هضمية", "سكري", "حساسية", "قلب وأوعية", "فيتامينات", "عام"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
        <div className="bg-linear-to-l from-blue-900 to-indigo-800 p-5 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-white font-bold text-lg">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">صورة المنتج</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="معاينة المنتج"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <Package className="w-8 h-8" />
                </div>
              )}
              <label className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 cursor-pointer transition-colors">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">{imagePreview ? "تغيير الصورة" : "اضغط لرفع صورة المنتج"}</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المنتج *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder="اسم الدواء"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم العلمي</label>
              <input
                value={form.genericName}
                onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Generic Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الفئة</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">السعر (₪) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">سعر التكلفة (₪)</label>
              <input
                type="number"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">المخزون الحالي</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الحد الأدنى للمخزون</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: parseInt(e.target.value) || 10 }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الباركود</label>
              <input
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ الانتهاء</label>
              <input
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                placeholder="مثل: 2026-12"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
              placeholder="وصف المنتج..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">قواعد البونص</label>
              <button type="button" onClick={addBonusRule} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
            {bonusRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 text-sm w-12">عند</span>
                <input
                  type="number"
                  value={rule.minQty}
                  onChange={(e) => updateBonusRule(idx, "minQty", parseInt(e.target.value) || 0)}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                />
                <span className="text-gray-500 text-sm">هدية</span>
                <input
                  type="number"
                  value={rule.bonusQty}
                  onChange={(e) => updateBonusRule(idx, "bonusQty", parseInt(e.target.value) || 0)}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center"
                />
                <span className="text-green-600 text-sm font-semibold flex-1">({rule.label})</span>
                <button
                  type="button"
                  onClick={() => setBonusRules((r) => r.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-2 py-2.5 bg-linear-to-l from-blue-700 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {product ? "تحديث" : "إضافة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PharmacyForm({
  onSave,
  onClose,
}: {
  onSave: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    address: "",
    licenseNumber: "",
    email: "",
    password: "",
    creditLimit: "5000",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("تم إضافة الصيدلية بنجاح");
        onSave();
        onClose();
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err) {
      toast.error("خطأ", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
        <div className="bg-linear-to-l from-blue-900 to-indigo-800 p-5 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-white font-bold text-lg">إضافة صيدلية جديدة</h2>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { key: "name", label: "اسم الصيدلية", required: true },
            { key: "ownerName", label: "اسم المالك", required: true },
            { key: "phone", label: "الهاتف", required: true },
            { key: "address", label: "العنوان", required: true },
            { key: "licenseNumber", label: "رقم الترخيص", required: true },
            { key: "email", label: "البريد الإلكتروني", required: true, type: "email" },
            { key: "password", label: "كلمة المرور", required: true, type: "password" },
            { key: "creditLimit", label: "حد الائتمان (₪)" },
            { key: "notes", label: "ملاحظات" },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && "*"}
              </label>
              <input
                type={type || "text"}
                required={required}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-2 py-2.5 bg-linear-to-l from-blue-700 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage({ initialTab = "dashboard" }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [products, setProducts] = useState<Product[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPharmacyForm, setShowPharmacyForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [expandedReceipt, setExpandedReceipt] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const toast = useToast();

  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [showPharmacyDetail, setShowPharmacyDetail] = useState(false);

  const pharmacyMap = useMemo(() => {
    const map = new Map<number, string>();
    pharmacies.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pharmacies]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, pharmaRes, orderRes, receiptRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/pharmacies"),
        fetch("/api/orders"),
        fetch("/api/receipts"),
      ]);
      if (prodRes.ok) setProducts((await prodRes.json()).products || []);
      if (pharmaRes.ok) setPharmacies((await pharmaRes.json()).pharmacies || []);
      if (orderRes.ok) setOrders((await orderRes.json()).orders || []);
      if (receiptRes.ok) setReceipts((await receiptRes.json()).receipts || []);
    } catch {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("تم حذف المنتج");
      fetchAll();
    } catch {
      toast.error("خطأ في حذف المنتج");
    }
  };

  const handleTogglePharmacy = async (pharmacy: Pharmacy) => {
    try {
      await fetch(`/api/pharmacies/${pharmacy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pharmacy.isActive }),
      });
      toast.success(pharmacy.isActive ? "تم تعطيل الصيدلية" : "تم تفعيل الصيدلية");
      fetchAll();
    } catch {
      toast.error("خطأ في تحديث الصيدلية");
    }
  };

  const handleOrderStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success(status === "approved" ? "تم قبول الطلب" : "تم رفض الطلب");
      fetchAll();
    } catch {
      toast.error("خطأ في تحديث الطلب");
    }
  };

  const handleReceiptStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (res.ok) {
        toast.success(status === "approved" ? "✅ تم قبول الإيصال وخصم المبلغ" : "❌ تم رفض الإيصال");
        setRejectionReason("");
        setExpandedReceipt(null);
        await fetchAll();
      } else {
        const data = await res.json();
        toast.error("فشل تحديث الإيصال", data.error);
      }
    } catch (error) {
      toast.error("خطأ", error instanceof Error ? error.message : "خطأ غير متوقع");
    }
  };

  const totalDebt = pharmacies.reduce((s, p) => s + parseFloat(p.totalDebt || "0"), 0);
  const totalPaid = pharmacies.reduce((s, p) => s + parseFloat(p.totalPaid || "0"), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const pendingReceipts = receipts.filter((r) => r.status === "pending").length;

  const filteredProducts = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search)
  );

  const getPharmacyName = (id: number) => pharmacyMap.get(id) || `صيدلية #${id}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-16" dir="rtl">
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSave={fetchAll}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}
      {showPharmacyForm && <PharmacyForm onSave={fetchAll} onClose={() => setShowPharmacyForm(false)} />}

      {showPharmacyDetail && selectedPharmacyId && (
        <PharmacyDetailPage
          pharmacyId={selectedPharmacyId}
          onBack={() => {
            setShowPharmacyDetail(false);
            setSelectedPharmacyId(null);
            fetchAll();
          }}
        />
      )}

      {/* الهيدر بدون تبويبات */}
      <div className="bg-linear-to-l from-blue-900 via-indigo-800 to-blue-800 pt-6 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
              <p className="text-blue-300 text-sm">إدارة Novex Pharma</p>
            </div>
            <button
              onClick={fetchAll}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-colors"
            >
              <RefreshCw className={cn("w-5 h-5 text-white", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="إجمالي المنتجات" value={products.length} icon={Package} gradient="from-blue-500 to-cyan-500" />
              <StatCard title="الصيدليات النشطة" value={pharmacies.filter((p) => p.isActive).length} icon={Users} gradient="from-green-500 to-emerald-500" />
              <StatCard title="إجمالي الديون" value={`${totalDebt.toFixed(0)} ₪`} icon={DollarSign} gradient="from-red-500 to-rose-500" />
              <StatCard title="إجمالي المدفوعات" value={`${totalPaid.toFixed(0)} ₪`} icon={TrendingUp} gradient="from-purple-500 to-violet-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  تنبيهات المخزون
                </h3>
                {products.filter((p) => p.stock <= p.minStock && p.isActive).length === 0 ? (
                  <p className="text-gray-400 text-sm">لا توجد تنبيهات</p>
                ) : (
                  <div className="space-y-2">
                    {products.filter((p) => p.stock <= p.minStock && p.isActive).slice(0, 5).map((p) => (
                      <div key={p.id} className={cn("flex items-center justify-between p-3 rounded-xl text-sm", p.stock === 0 ? "bg-red-50 border border-red-100" : "bg-orange-50 border border-orange-100")}>
                        <span className="font-medium">{p.name}</span>
                        <span className={cn("font-bold", p.stock === 0 ? "text-red-600" : "text-orange-600")}>{p.stock === 0 ? "نفذ" : `${p.stock} وحدة`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  آخر الطلبات
                </h3>
                {orders.length === 0 ? (
                  <p className="text-gray-400 text-sm">لا توجد طلبات</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                        <div>
                          <span className="font-medium">طلب #{o.id}</span>
                          <p className="text-gray-400 text-xs">{getPharmacyName(o.pharmacyId)}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-blue-700">{parseFloat(o.total).toFixed(0)} ₪</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", o.status === "pending" && "bg-yellow-100 text-yellow-700", o.status === "approved" && "bg-green-100 text-green-700", o.status === "rejected" && "bg-red-100 text-red-700")}>
                            {o.status === "pending" ? "قيد المراجعة" : o.status === "approved" ? "مقبول" : "مرفوض"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المنتجات..." className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="flex items-center gap-2 bg-linear-to-l from-blue-700 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" /> منتج جديد
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["صورة", "المنتج", "الفئة", "السعر", "المخزون", "تقييم", "بونص", "إجراءات"].map((h) => (
                        <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300"><Package className="w-5 h-5" /></div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          <p className="text-gray-400 text-xs">{p.genericName}</p>
                        </td>
                        <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-lg">{p.category}</span></td>
                        <td className="px-4 py-3 font-bold text-blue-700 text-sm">{parseFloat(p.price).toFixed(2)} ₪</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-sm font-semibold", p.stock === 0 ? "text-red-600" : p.stock <= p.minStock ? "text-orange-500" : "text-green-600")}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm font-medium">{parseFloat(p.rating).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.bonusRules && p.bonusRules.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {p.bonusRules.slice(0, 2).map((r, i) => (<span key={i} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-lg">{r.label}</span>))}
                            </div>
                          ) : (<span className="text-gray-300 text-xs">-</span>)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>لا توجد منتجات</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "pharmacies" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">الصيدليات ({pharmacies.length})</h2>
              <button onClick={() => setShowPharmacyForm(true)} className="flex items-center gap-2 bg-linear-to-l from-blue-700 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" /> صيدلية جديدة
              </button>
            </div>

            <div className="grid gap-4">
              {pharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{pharmacy.name}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", pharmacy.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                          {pharmacy.isActive ? "نشط" : "معطل"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{pharmacy.ownerName}</p>
                      <p className="text-gray-400 text-xs">{pharmacy.email}</p>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400">الدين</p>
                          <p className="font-bold text-red-600">{parseFloat(pharmacy.totalDebt).toFixed(2)} ₪</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">المدفوع</p>
                          <p className="font-bold text-green-600">{parseFloat(pharmacy.totalPaid).toFixed(2)} ₪</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePharmacy(pharmacy)}
                          className={cn("px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors", pharmacy.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100")}
                        >
                          {pharmacy.isActive ? "تعطيل" : "تفعيل"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPharmacyId(pharmacy.id);
                            setShowPharmacyDetail(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors"
                        >
                          تفاصيل
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pharmacies.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد صيدليات</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900">الطلبات ({orders.length})</h2>
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">طلب #{order.id}</h3>
                    <p className="text-gray-500 text-sm">{getPharmacyName(order.pharmacyId)}</p>
                    <p className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-blue-700 text-lg">{parseFloat(order.total).toFixed(2)} ₪</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", order.status === "pending" && "bg-yellow-100 text-yellow-700", order.status === "approved" && "bg-green-100 text-green-700", order.status === "rejected" && "bg-red-100 text-red-700")}>
                      {order.status === "pending" ? "قيد المراجعة" : order.status === "approved" ? "مقبول" : "مرفوض"}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        {item.bonusQuantity > 0 && <span className="text-green-600 text-xs mr-2">+{item.bonusQuantity} مجاني</span>}
                      </div>
                      <span className="text-gray-500">{item.quantity} × {item.price} ₪</span>
                    </div>
                  ))}
                </div>
                {order.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOrderStatus(order.id, "approved")} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> قبول</button>
                    <button onClick={() => handleOrderStatus(order.id, "rejected")} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 flex items-center justify-center gap-1"><X className="w-4 h-4" /> رفض</button>
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>لا توجد طلبات</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900">الإيصالات ({receipts.length})</h2>
            {receipts.map((receipt) => (
              <div key={receipt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 cursor-pointer flex items-start justify-between" onClick={() => setExpandedReceipt(expandedReceipt === receipt.id ? null : receipt.id)}>
                  <div>
                    <h3 className="font-bold text-gray-900">إيصال #{receipt.id}</h3>
                    <p className="text-gray-500 text-sm">{getPharmacyName(receipt.pharmacyId)}</p>
                    <p className="text-gray-400 text-xs">{new Date(receipt.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="font-black text-green-600 text-lg">{parseFloat(receipt.amount).toFixed(2)} ₪</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", receipt.status === "pending" && "bg-yellow-100 text-yellow-700", receipt.status === "approved" && "bg-green-100 text-green-700", receipt.status === "rejected" && "bg-red-100 text-red-700")}>
                        {receipt.status === "pending" ? "قيد المراجعة" : receipt.status === "approved" ? "مقبول" : "مرفوض"}
                      </span>
                    </div>
                    {expandedReceipt === receipt.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {expandedReceipt === receipt.id && (
                  <div className="border-t border-gray-100 p-5">
                    {receipt.imageUrl && (
                      <div className="mb-4">
                        {receipt.imageUrl.startsWith("data:") || receipt.imageUrl.startsWith("http") ? (
                          <Image src={receipt.imageUrl} alt="الإيصال" width={400} height={300} className="max-w-full max-h-64 rounded-xl object-contain border border-gray-100" />
                        ) : (<p className="text-gray-400 text-sm">لا توجد صورة</p>)}
                      </div>
                    )}
                    {receipt.notes && <p className="text-gray-600 text-sm mb-3">{receipt.notes}</p>}
                    {receipt.status === "pending" && (
                      <div>
                        <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="سبب الرفض (في حال الرفض)" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-blue-400" />
                        <div className="flex gap-2">
                          <button onClick={() => handleReceiptStatus(receipt.id, "approved")} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> قبول وخصم الدين</button>
                          <button onClick={() => handleReceiptStatus(receipt.id, "rejected")} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 flex items-center justify-center gap-1"><X className="w-4 h-4" /> رفض</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {receipts.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>لا توجد إيصالات</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}