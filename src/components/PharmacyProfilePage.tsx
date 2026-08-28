// ============================================
// ملف: src/components/PharmacyProfilePage.tsx (معدل - إضافة الإشعارات التلقائية)
// ============================================
"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  CreditCard,
  Upload,
  Loader2,
  CheckCircle,
  Package,
  Clock,
  X,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useServiceWorker } from "@/hooks/usePWA";

interface Order {
  id: number;
  total: string;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

interface Receipt {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  imageUrl: string;
}

type TabType = "profile" | "orders" | "receipts";

interface PharmacyProfilePageProps {
  initialTab?: TabType;
}

export default function PharmacyProfilePage({ initialTab = "profile" }: PharmacyProfilePageProps) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { subscribeToPush } = useServiceWorker();
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"default" | "granted" | "denied">("default");
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // ✅ تفعيل الإشعارات تلقائياً عند تسجيل الدخول
  useEffect(() => {
    if (!user || user.role !== "pharmacy") return;

    // تحديث حالة الإذن
    if ("Notification" in window) {
      setNotificationStatus(Notification.permission as "default" | "granted" | "denied");
    }

    // إذا كان الإذن غير محدد (default)، اطلب الإذن تلقائياً
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(async (permission) => {
        setNotificationStatus(permission as "default" | "granted" | "denied");
        if (permission === "granted") {
          console.log("✅ تم منح إذن الإشعارات تلقائياً");
          // بعد الموافقة، سجل الاشتراك
          const subscription = await subscribeToPush();
          if (subscription) {
            try {
              await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscription,
                  pharmacyId: user.id,
                  title: "✅ تم تفعيل الإشعارات",
                  message: "ستصلك الآن إشعارات التطبيق حتى عندما يكون مغلقاً",
                }),
              });
              console.log("✅ تم حفظ الاشتراك في قاعدة البيانات");
              toast.success("تم تفعيل الإشعارات", "ستصلك التنبيهات حتى خارج التطبيق");
            } catch (error) {
              console.error("❌ فشل حفظ الاشتراك:", error);
            }
          }
        } else if (permission === "denied") {
          toast.warning("الإشعارات معطلة", "يمكنك تفعيلها من إعدادات المتصفح");
        }
      });
    }

    // إذا كان الإذن ممنوحاً مسبقاً، سجل الاشتراك مباشرة (بدون طلب)
    if ("Notification" in window && Notification.permission === "granted") {
      subscribeToPush().then(async (subscription) => {
        if (subscription) {
          try {
            // تحقق إذا كان الاشتراك موجوداً بالفعل في قاعدة البيانات
            await fetch("/api/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription,
                pharmacyId: user.id,
              }),
            });
            console.log("✅ تم تحديث الاشتراك للمستخدم");
          } catch (error) {
            console.error("❌ فشل تحديث الاشتراك:", error);
          }
        }
      });
    }
  }, [user, subscribeToPush, toast]);

  // جلب الطلبات والإيصالات
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, receiptsRes] = await Promise.all([
          fetch(`/api/orders?pharmacyId=${user.id}`),
          fetch(`/api/receipts?pharmacyId=${user.id}`),
        ]);
        if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
        if (receiptsRes.ok)
          setReceipts((await receiptsRes.json()).receipts || []);
      } catch {
        toast.error("خطأ في تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setReceiptImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitReceipt = async () => {
    if (!receiptAmount || parseFloat(receiptAmount) <= 0) {
      toast.warning("يرجى إدخال المبلغ");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (receiptImage) {
        const formData = new FormData();
        formData.append("file", receiptImage);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url || "";
        }
      }

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId: user!.id,
          amount: parseFloat(receiptAmount),
          imageUrl,
          notes: receiptNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReceipts((prev) => [data.receipt, ...prev]);
        toast.success("تم إرسال الإيصال بنجاح!", "سيتم مراجعته من الإدارة");
        setShowReceiptForm(false);
        setReceiptAmount("");
        setReceiptNotes("");
        setReceiptImage(null);
        setPreviewUrl(null);
      } else {
        throw new Error("فشل إرسال الإيصال");
      }
    } catch (err) {
      toast.error(
        "فشل إرسال الإيصال",
        err instanceof Error ? err.message : "خطأ غير متوقع"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const totalDebt = parseFloat(user.totalDebt || "0");
  const totalPaid = parseFloat(user.totalPaid || "0");
  const creditLimit = parseFloat(user.creditLimit || "5000");
  const debtPercentage = Math.min(100, (totalDebt / creditLimit) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pt-16" dir="rtl">
      {showReceiptForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-linear-to-l from-green-700 to-emerald-600 p-5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-white font-bold text-lg">إرسال إيصال دفع</h2>
              <button
                onClick={() => setShowReceiptForm(false)}
                className="bg-white/20 rounded-xl p-2 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  المبلغ المدفوع (₪) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  صورة الإيصال
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-green-400 rounded-xl p-5 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="معاينة"
                      width={200}
                      height={160}
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        اضغط لرفع صورة الإيصال
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="أي معلومات إضافية..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-green-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceiptForm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmitReceipt}
                  disabled={isSubmitting}
                  className={cn(
                    "flex-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                    isSubmitting
                      ? "bg-gray-200 text-gray-400"
                      : "bg-linear-to-l from-green-600 to-emerald-600 text-white hover:shadow-lg"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  إرسال الإيصال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-linear-to-l from-blue-900 via-indigo-800 to-blue-800 pt-6 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <p className="text-blue-300">{user.ownerName}</p>
              </div>
            </div>
            {/* ✅ حالة الإشعارات */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-xs text-white">
                {notificationStatus === "granted" ? "✅ مفعّل" : 
                 notificationStatus === "denied" ? "❌ معطّل" : "⏳ في الانتظار"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {[
              { id: "profile", label: "الحساب" },
              { id: "orders", label: `الطلبات (${orders.length})` },
              { id: "receipts", label: `الإيصالات (${receipts.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-blue-800"
                    : "text-blue-200 hover:bg-white/10"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-500" />
                الحساب المالي
              </h2>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-red-600 font-black text-xl">
                    {totalDebt.toFixed(2)}
                  </p>
                  <p className="text-red-500 text-xs font-medium">الدين الحالي (₪)</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-green-600 font-black text-xl">
                    {totalPaid.toFixed(2)}
                  </p>
                  <p className="text-green-500 text-xs font-medium">إجمالي المدفوع (₪)</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-blue-600 font-black text-xl">
                    {creditLimit.toFixed(0)}
                  </p>
                  <p className="text-blue-500 text-xs font-medium">حد الائتمان (₪)</p>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs text-gray-500">
                <span>نسبة استخدام الائتمان</span>
                <span className="font-semibold">{debtPercentage.toFixed(0)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    debtPercentage > 80
                      ? "bg-linear-to-l from-red-600 to-red-400"
                      : debtPercentage > 50
                      ? "bg-linear-to-l from-orange-500 to-yellow-400"
                      : "bg-linear-to-l from-green-500 to-emerald-400"
                  )}
                  style={{ width: `${debtPercentage}%` }}
                />
              </div>

              {debtPercentage > 80 && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 rounded-xl p-3 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">
                    اقتربت من حد الائتمان. يرجى سداد جزء من الدين.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowReceiptForm(true)}
                className="w-full mt-4 py-3 bg-linear-to-l from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
              >
                <CreditCard className="w-5 h-5" />
                إرسال إيصال دفع
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">معلومات التواصل</h2>
              <div className="space-y-3">
                {[
                  { icon: Phone, label: "الهاتف", value: user.phone },
                  { icon: Mail, label: "البريد", value: user.email },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {value || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد طلبات بعد</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        طلب #{order.id}
                      </h3>
                      <p className="text-gray-500 text-sm">{user.name}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString("ar")}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-blue-700">
                        {parseFloat(order.total).toFixed(2)} ₪
                      </p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-lg font-medium",
                          order.status === "pending" &&
                            "bg-yellow-100 text-yellow-700",
                          order.status === "approved" &&
                            "bg-green-100 text-green-700",
                          order.status === "rejected" &&
                            "bg-red-100 text-red-700"
                        )}
                      >
                        {order.status === "pending"
                          ? "قيد المراجعة"
                          : order.status === "approved"
                          ? "مقبول"
                          : "مرفوض"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span>{item.productName}</span>
                        <span className="text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => setShowReceiptForm(true)}
                className="flex items-center gap-2 bg-linear-to-l from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
              >
                <CreditCard className="w-4 h-4" />
                إضافة إيصال
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد إيصالات بعد</p>
              </div>
            ) : (
              receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-gray-900">
                      إيصال #{receipt.id}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(receipt.createdAt).toLocaleDateString("ar")}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-green-600">
                      {parseFloat(receipt.amount).toFixed(2)} ₪
                    </p>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-lg font-medium",
                        receipt.status === "pending" &&
                          "bg-yellow-100 text-yellow-700",
                        receipt.status === "approved" &&
                          "bg-green-100 text-green-700",
                        receipt.status === "rejected" &&
                          "bg-red-100 text-red-700"
                      )}
                    >
                      {receipt.status === "pending"
                        ? "قيد المراجعة"
                        : receipt.status === "approved"
                        ? "مقبول ✓"
                        : "مرفوض ✗"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
