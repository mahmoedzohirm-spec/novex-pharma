// ============================================
// ملف: src/components/PharmacyDetailPage.tsx (معدل)
// ============================================
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  CreditCard,
  Loader2,
  Bell,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package,
  Eye,
  XCircle,
  Key,
  Edit,
  Save,
  Download,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import Image from "next/image";

interface PharmacyDetail {
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
  password?: string;
}

interface Receipt {
  id: number;
  amount: string;
  status: string;
  imageUrl: string;
  notes: string;
  rejectionReason: string;
  createdAt: string;
  approvedAt: string | null;
}

interface Order {
  id: number;
  total: string;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; bonusQuantity: number; price: number }>;
}

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  pharmacyId: number;
  onBack: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700" },
    approved: { label: "مقبول ✅", color: "bg-green-100 text-green-700" },
    rejected: { label: "مرفوض ❌", color: "bg-red-100 text-red-700" },
  };
  const { label, color } = map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", color)}>{label}</span>;
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function PharmacyDetailPage({ pharmacyId, onBack }: Props) {
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderMessage, setReminderMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const toast = useToast();

  const [creditLimit, setCreditLimit] = useState("");
  const [isUpdatingCredit, setIsUpdatingCredit] = useState(false);

  // ✅ حالات تغيير كلمة مرور الصيدلية
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPharmacyPassword, setNewPharmacyPassword] = useState("");
  const [confirmPharmacyPassword, setConfirmPharmacyPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pharmaRes, receiptsRes, ordersRes, notifRes] = await Promise.all([
        fetch(`/api/pharmacies/${pharmacyId}`),
        fetch(`/api/receipts?pharmacyId=${pharmacyId}`),
        fetch(`/api/orders?pharmacyId=${pharmacyId}`),
        fetch(`/api/notifications?pharmacyId=${pharmacyId}`),
      ]);

      if (pharmaRes.ok) {
        const data = await pharmaRes.json();
        setPharmacy(data.pharmacy);
        if (data.pharmacy?.creditLimit) {
          setCreditLimit(data.pharmacy.creditLimit);
        }
      } else {
        throw new Error("فشل تحميل بيانات الصيدلية");
      }

      if (receiptsRes.ok) {
        const data = await receiptsRes.json();
        setReceipts(data.receipts || []);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      toast.error("خطأ في تحميل البيانات", error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  }, [pharmacyId, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCreditLimit = async () => {
    if (!pharmacy) return;
    const newLimit = parseFloat(creditLimit);
    if (isNaN(newLimit) || newLimit < 0) {
      toast.warning("يرجى إدخال قيمة صحيحة للحد");
      return;
    }
    setIsUpdatingCredit(true);
    try {
      const res = await fetch(`/api/pharmacies/${pharmacy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditLimit: String(newLimit) }),
      });
      if (res.ok) {
        toast.success("تم تحديث حد الائتمان بنجاح!");
        await fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.error || "فشل التحديث");
      }
    } catch (error) {
      toast.error("خطأ", error instanceof Error ? error.message : "فشل تحديث حد الائتمان");
    } finally {
      setIsUpdatingCredit(false);
    }
  };

  const sendReminder = useCallback(async () => {
    if (!pharmacy) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/notifications/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          message: reminderMessage.trim() || `لديك دين مستحق قدره ${formatCurrency(parseFloat(pharmacy.totalDebt))} ₪، يرجى السداد.`,
        }),
      });

      if (res.ok) {
        toast.success("تم إرسال التذكير بنجاح!");
        setReminderMessage("");
        await fetchData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "فشل إرسال التذكير");
      }
    } catch (error) {
      toast.error("فشل إرسال التذكير", error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى");
    } finally {
      setIsSending(false);
    }
  }, [pharmacy, reminderMessage, toast, fetchData]);

  // ✅ تغيير كلمة مرور الصيدلية
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPharmacyPassword !== confirmPharmacyPassword) {
      toast.warning("كلمة المرور غير متطابقة");
      return;
    }

    if (newPharmacyPassword.length < 6) {
      toast.warning("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsResettingPassword(true);
    try {
      const token = localStorage.getItem("novex_token");
      const res = await fetch(`/api/pharmacies/${pharmacy!.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPharmacyPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("✅ تم تغيير كلمة مرور الصيدلية بنجاح");
        setShowResetPasswordModal(false);
        setNewPharmacyPassword("");
        setConfirmPharmacyPassword("");
        await fetchData();
      } else {
        toast.error(data.error || "فشل تغيير كلمة المرور");
      }
    } catch (error) {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 font-medium">الصيدلية غير موجودة</p>
          <button onClick={onBack} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const debt = parseFloat(pharmacy.totalDebt);
  const paid = parseFloat(pharmacy.totalPaid);
  const creditLimitValue = parseFloat(pharmacy.creditLimit);
  const usagePercent = creditLimitValue > 0 ? Math.min(100, (debt / creditLimitValue) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16" dir="rtl">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-16 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-bold">{pharmacy.name}</span>
          <StatusBadge status={pharmacy.isActive ? "approved" : "rejected"} />
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ زر تحميل التقرير */}
          <button
            onClick={() => window.open(`/pharmacy-report/${pharmacy.id}`, "_blank")}
            className="bg-green-100 hover:bg-green-200 rounded-xl p-2 transition-colors"
            title="فتح التقرير"
          >
            <Download className="w-5 h-5 text-green-600" />
          </button>

          {/* زر التحديث الحالي */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 rounded-xl p-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-gray-600", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* معلومات الصيدلية */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            معلومات الصيدلية
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: User, label: "المالك", value: pharmacy.ownerName },
              { icon: Phone, label: "الهاتف", value: pharmacy.phone },
              { icon: Mail, label: "البريد", value: pharmacy.email },
              { icon: MapPin, label: "العنوان", value: pharmacy.address },
              { icon: FileText, label: "رقم الترخيص", value: pharmacy.licenseNumber },
              ...(pharmacy.password ? [{ icon: Key, label: "كلمة المرور", value: pharmacy.password }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value || "—"}</p>
                </div>
              </div>
            ))}
            {/* ✅ زر تغيير كلمة المرور */}
            <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">الإجراء</p>
                <button
                  onClick={() => setShowResetPasswordModal(true)}
                  className="text-sm font-semibold text-yellow-600 hover:text-yellow-800 transition-colors"
                >
                  🔑 تغيير كلمة المرور
                </button>
              </div>
            </div>
          </div>
          {pharmacy.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              <span className="font-semibold">ملاحظات:</span> {pharmacy.notes}
            </div>
          )}
        </div>

        {/* الملخص المالي */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-500" />
            الملخص المالي
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 font-black text-2xl">{formatCurrency(debt)}</p>
              <p className="text-red-500 text-xs font-medium">الدين (₪)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-green-600 font-black text-2xl">{formatCurrency(paid)}</p>
              <p className="text-green-500 text-xs font-medium">المدفوع (₪)</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-600 font-black text-2xl">{formatCurrency(creditLimitValue)}</p>
              <p className="text-blue-500 text-xs font-medium">حد الائتمان (₪)</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>نسبة استخدام الائتمان</span>
              <span className="font-semibold">{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-orange-500" : "bg-green-500"
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* تعديل حد الائتمان */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-500" />
            تعديل حد الائتمان
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                حد الائتمان الجديد (₪)
              </label>
              <input
                type="number"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="أدخل الحد الجديد"
              />
            </div>
            <button
              onClick={updateCreditLimit}
              disabled={isUpdatingCredit || !creditLimit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {isUpdatingCredit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              تحديث الحد
            </button>
          </div>
        </div>

        {/* إرسال تذكير */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            إرسال تذكير
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder={`رسالة التذكير (افتراضي: لديك دين ${formatCurrency(debt)} ₪)`}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={sendReminder}
              disabled={isSending}
              className="px-6 py-3 bg-linear-to-l from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال التذكير
            </button>
          </div>
        </div>

        {/* الإيصالات */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            الإيصالات ({receipts.length})
          </h2>
          {receipts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لا توجد إيصالات</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {receipts.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-700">#{r.id}</span>
                    <span className="text-gray-400">{new Date(r.createdAt).toLocaleDateString("ar")}</span>
                    {r.imageUrl && (
                      <button
                        onClick={() => setSelectedReceiptImage(r.imageUrl)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-600">{formatCurrency(parseFloat(r.amount))} ₪</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الطلبات */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            الطلبات ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لا توجد طلبات</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map((o) => {
                const isExpanded = expandedOrderId === o.id;
                return (
                  <div key={o.id} className="bg-gray-50 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-700">طلب #{o.id}</span>
                        <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-700">{formatCurrency(parseFloat(o.total))} ₪</span>
                        <StatusBadge status={o.status} />
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-1">
                        <p className="text-xs text-gray-400 font-medium mb-1">المنتجات:</p>
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                            <div>
                              <span>{item.productName}</span>
                              {item.bonusQuantity > 0 && (
                                <span className="text-green-600 text-xs mr-2">+{item.bonusQuantity} مجاني</span>
                              )}
                            </div>
                            <span className="text-gray-600">{item.quantity} × {item.price} ₪</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* الإشعارات */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            الإشعارات ({notifications.length})
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 rounded-xl text-sm flex items-start gap-3 transition-colors",
                    !n.isRead ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                  )}
                >
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{n.title}</p>
                    <p className="text-gray-500 text-xs">{n.body}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(n.createdAt).toLocaleDateString("ar")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ مودال تغيير كلمة مرور الصيدلية */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
            <div className="bg-linear-to-l from-yellow-600 to-amber-600 p-5 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-white font-bold text-lg">🔑 تغيير كلمة مرور الصيدلية</h2>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPharmacyPassword("");
                  setConfirmPharmacyPassword("");
                }}
                className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  value={newPharmacyPassword}
                  onChange={(e) => setNewPharmacyPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  value={confirmPharmacyPassword}
                  onChange={(e) => setConfirmPharmacyPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setNewPharmacyPassword("");
                    setConfirmPharmacyPassword("");
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-2 py-2.5 bg-linear-to-l from-yellow-600 to-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
                >
                  {isResettingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  تغيير كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReceiptImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceiptImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative">
            <Image
              src={selectedReceiptImage}
              alt="الإيصال"
              width={800}
              height={600}
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 rounded-xl p-2 transition-colors"
            >
              <XCircle className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}