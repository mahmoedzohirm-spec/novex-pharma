// ============================================
// ملف: src/app/page.tsx
// ============================================
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { Loader2 } from "lucide-react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";

import Header from "@/components/Header";
import CartBottomSheet from "@/components/CartBottomSheet";
import LoginPage from "@/components/LoginPage";
import RegisterPage from "@/components/RegisterPage";
import CatalogPage from "@/components/CatalogPage";
import MedicineDetailsPage from "@/components/MedicineDetailsPage";
import AdminPage from "@/components/AdminPage";
import PharmacyProfilePage from "@/components/PharmacyProfilePage";
import PWABanner from "@/components/PWABanner";

type Page =
  | "catalog"
  | "login"
  | "register"
  | "admin"
  | "profile"
  | "medicine";

type AdminTab = "dashboard" | "products" | "pharmacies" | "orders" | "receipts";
type PharmacyTab = "profile" | "orders" | "receipts";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("catalog");
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [pharmacyTab, setPharmacyTab] = useState<PharmacyTab>("profile");

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const page = params.get("page") as Page | null;
    const tab = params.get("tab") as AdminTab | null;

    if (page) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(page);
      if (page === "admin" && tab) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      const isAuthPage = currentPage === "login" || currentPage === "register";
      if (!isAuthPage && currentPage !== "catalog") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage("catalog");
      }
    }
  }, [user, isLoading, currentPage]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin" && currentPage !== "admin") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage("admin");
      } else if (
        user.role === "pharmacy" &&
        (currentPage === "admin" || currentPage === "login" || currentPage === "register")
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage("catalog");
      }
    }
  }, [user, isLoading, currentPage]);

  const navigate = (page: string, tab?: string) => {
    if (page === "login" || page === "register" || page === "catalog") {
      setCurrentPage(page as Page);
      return;
    }

    if (!user) {
      setCurrentPage("catalog");
      return;
    }

    if (user.role === "admin" && page === "admin") {
      if (tab && ["dashboard", "products", "pharmacies", "orders", "receipts"].includes(tab)) {
        setAdminTab(tab as AdminTab);
      } else {
        setAdminTab("dashboard");
      }
      setCurrentPage("admin");
      return;
    }

    if (user.role === "pharmacy" && page === "profile") {
      if (tab === "orders") {
        setPharmacyTab("orders");
      } else if (tab === "receipts") {
        setPharmacyTab("receipts");
      } else {
        setPharmacyTab("profile");
      }
      setCurrentPage("profile");
      return;
    }

    setCurrentPage(page as Page);
  };

  const viewMedicineDetails = (id: number) => {
  console.log("🔄 فتح تفاصيل المنتج ID:", id);
  setSelectedMedicineId(id);
  setCurrentPage("medicine");
};
  const handleBackToCatalog = () => {
    setCurrentPage("catalog");
  };

  const handleGoToLogin = () => {
    setCurrentPage("login");
  };

  const handleGoToRegister = () => {
    setCurrentPage("register");
  };

  const handleRegisterSuccess = () => {
    const stored = localStorage.getItem("novex_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === "admin") {
        setCurrentPage("admin");
      } else {
        setPharmacyTab("profile");
        setCurrentPage("profile");
      }
    } else {
      setCurrentPage("catalog");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 rounded-2xl p-6 mb-4 inline-block">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          </div>
          <p className="text-white font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onSuccess={() => {
          const stored = localStorage.getItem("novex_user");
          if (stored) {
            const u = JSON.parse(stored);
            setCurrentPage(u.role === "admin" ? "admin" : "catalog");
          }
        }}
        onBackToCatalog={handleBackToCatalog}
        onRegister={handleGoToRegister}
      />
    );
  }

  if (currentPage === "register") {
    return (
      <RegisterPage
        onSuccess={handleRegisterSuccess}
        onBackToLogin={handleGoToLogin}
        onBackToCatalog={handleBackToCatalog}
      />
    );
  }

  return (
    <>
      <Header currentPage={currentPage} onNavigate={navigate} />
      <PWABanner />

      <main>
        {currentPage === "catalog" && (
          <CatalogPage onViewDetails={viewMedicineDetails} />
        )}

        {currentPage === "medicine" && selectedMedicineId !== null && (
          <MedicineDetailsPage
            productId={selectedMedicineId}
            onBack={() => setCurrentPage("catalog")}
          />
        )}

        {currentPage === "admin" &&
          (user?.role === "admin" ? (
            <AdminPage initialTab={adminTab} />
          ) : (
            <LoginPage
              onSuccess={() => {
                const stored = localStorage.getItem("novex_user");
                if (stored) {
                  const u = JSON.parse(stored);
                  setCurrentPage(u.role === "admin" ? "admin" : "catalog");
                }
              }}
              onBackToCatalog={handleBackToCatalog}
              onRegister={handleGoToRegister}
            />
          ))}

        {currentPage === "profile" &&
          (user ? (
            <PharmacyProfilePage initialTab={pharmacyTab} />
          ) : (
            <LoginPage
              onSuccess={() => setCurrentPage("profile")}
              onBackToCatalog={handleBackToCatalog}
              onRegister={handleGoToRegister}
            />
          ))}
      </main>

      {user?.role === "pharmacy" && <CartBottomSheet />}
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Suspense
            fallback={
              <div className="min-h-screen bg-linear-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
            }
          >
            <AppContent />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
