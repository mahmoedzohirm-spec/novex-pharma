// ============================================
// ملف: src/components/Header.tsx (مع eslint-disable)
// ============================================
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Home,
  ClipboardList,
  CreditCard,
  ChevronDown,
  Package,
  Users,
  BarChart3,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";
import Image from "next/image";

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, tab?: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ حالات للعدادات
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingReceiptsCount, setPendingReceiptsCount] = useState(0);

  // ✅ جلب الطلبات والإيصالات المعلقة
  const fetchCounts = useCallback(async () => {
    try {
      const [ordersRes, receiptsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/receipts"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const pendingOrders = ordersData.orders?.filter(
          (o: any) => o.status === "pending"
        );
        setPendingOrdersCount(pendingOrders?.length || 0);
      }

      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json();
        const pendingReceipts = receiptsData.receipts?.filter(
          (r: any) => r.status === "pending"
        );
        setPendingReceiptsCount(pendingReceipts?.length || 0);
      }
    } catch (error) {
      console.error("❌ فشل جلب العدادات:", error);
    }
  }, []);

  // ✅ جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const url =
        user.role === "pharmacy"
          ? `/api/notifications?pharmacyId=${user.id}`
          : "/api/notifications";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(
          (data.notifications || []).filter((n: Notification) => !n.isRead)
            .length
        );
      }
    } catch {
      // ignore
    }
  }, [user]);

  // ✅ جلب الإشعارات والعدادات عند تحميل المكون
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCounts();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications, fetchCounts]);

  // ✅ عناصر القائمة الجانبية مع الأعداد الشرطية
  const drawerItems = user
    ? user.role === "admin"
      ? [
          { id: "admin", label: "الرئيسية", icon: BarChart3, tab: "dashboard" },
          { id: "admin", label: "المنتجات", icon: Package, tab: "products" },
          { id: "admin", label: "الصيدليات", icon: Users, tab: "pharmacies" },
          {
            id: "admin",
            label: `الطلبات${pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ""}`,
            icon: ClipboardList,
            tab: "orders",
          },
          {
            id: "admin",
            label: `الإيصالات${pendingReceiptsCount > 0 ? ` (${pendingReceiptsCount})` : ""}`,
            icon: CreditCard,
            tab: "receipts",
          },
        ]
      : [
          { id: "catalog", label: "الكتالوج", icon: Home },
          {
            id: "profile",
            label: "طلباتي",
            icon: ClipboardList,
            tab: "orders",
          },
          {
            id: "profile",
            label: "الإيصالات",
            icon: CreditCard,
            tab: "receipts",
          },
          { id: "profile", label: "حسابي", icon: User, tab: "profile" },
        ]
    : [
        { id: "catalog", label: "الكتالوج", icon: Home },
        { id: "login", label: "تسجيل الدخول", icon: LogIn },
      ];

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-linear-to-l from-blue-950 via-blue-900 to-indigo-900 shadow-2xl"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-white hover:bg-white/10 rounded-xl p-2 transition-colors"
                aria-label="فتح القائمة"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() =>
                  onNavigate(user?.role === "admin" ? "admin" : "catalog")
                }
              >
                <Image
                  src="/lond.jpg"
                  alt="Novex Pharma"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover shadow-lg"
                />
                <div>
                  <span className="text-white font-bold text-lg leading-none">
                    Novex
                  </span>
                  <span className="text-cyan-400 font-bold text-lg leading-none">
                    {" "}
                    Pharma
                  </span>
                  <p className="text-blue-300 text-xs leading-none">
                    نظام إدارة الصيدليات
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setUserMenuOpen(false);
                    }}
                    className="relative bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200"
                  >
                    <Bell className="w-5 h-5 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -left-1 bg-yellow-400 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 bg-linear-to-l from-blue-800 to-indigo-800">
                        <h3 className="text-white font-semibold text-sm">
                          الإشعارات
                        </h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 py-6 text-sm">
                            لا توجد إشعارات
                          </p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.isRead && markAsRead(n.id)}
                              className={cn(
                                "p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                                !n.isRead && "bg-blue-50"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {n.body}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-all duration-200"
                  >
                    <div className="w-7 h-7 bg-linear-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-white text-sm font-medium max-w-[100px] truncate">
                      {user.name || user.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-blue-300 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 bg-linear-to-l from-blue-800 to-indigo-800">
                        <p className="text-white font-semibold text-sm">
                          {user.name || user.username}
                        </p>
                        <p className="text-blue-200 text-xs">
                          {user.role === "admin" ? "مدير النظام" : "صيدلية"}
                        </p>
                      </div>
                      {user.role === "pharmacy" && (
                        <button
                          onClick={() => {
                            onNavigate("profile", "profile");
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        >
                          <User className="w-4 h-4" />
                          الملف الشخصي
                        </button>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          onNavigate("catalog");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm border-t"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate("login")}
                  className="bg-linear-to-l from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* القائمة الجانبية */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 p-4 overflow-y-auto transition-transform duration-300"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">القائمة</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-1">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const tab = (item as any).tab || undefined;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onNavigate(item.id, tab);
                      setDrawerOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      currentPage === item.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}

              {user && (
                <>
                  <div className="border-t border-gray-200 my-3" />
                  <button
                    onClick={() => {
                      logout();
                      setDrawerOpen(false);
                      onNavigate("catalog");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {(notifOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setNotifOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}
    </>
  );
}