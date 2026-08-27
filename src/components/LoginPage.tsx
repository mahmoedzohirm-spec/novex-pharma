// ============================================
// ملف: src/components/LoginPage.tsx
// ============================================
"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Loader2,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import Image from "next/image";

interface LoginPageProps {
  onSuccess: () => void;
  onBackToCatalog?: () => void;
  onRegister?: () => void;
}

export default function LoginPage({
  onSuccess,
  onBackToCatalog,
  onRegister,
}: LoginPageProps) {
  const { login } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.warning("يرجى ملء جميع الحقول");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.success) {
        toast.success("تم تسجيل الدخول بنجاح!", "أهلاً بك في Novex Pharma");
        onSuccess();
      } else {
        toast.error("فشل تسجيل الدخول", result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-blue-950 via-indigo-900 to-blue-800 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/lond.jpg"
            alt="Novex Pharma"
            width={80}
            height={80}
            className="w-20 h-20 rounded-2xl shadow-2xl shadow-blue-500/30 mb-4 mx-auto object-cover"
          />
          <h1 className="text-3xl font-black text-white mb-1">
            Novex <span className="text-cyan-400">Pharma</span>
          </h1>
          <p className="text-blue-300">نظام إدارة الصيدليات والمستودع</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                البريد الإلكتروني أو رقم الجوال
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@example.com أو 05xxxxxxxx"
                  autoComplete="username"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-11 pl-4 py-3.5 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-11 pl-12 py-3.5 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 mt-2",
                isLoading
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-linear-to-l from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {onRegister && (
              <button
                onClick={onRegister}
                className="w-full text-cyan-300 hover:text-white transition-colors text-sm font-semibold flex items-center justify-center gap-1 py-2 border border-cyan-300/30 rounded-xl hover:bg-cyan-500/10"
              >
                <UserPlus className="w-4 h-4" />
                ليس لديك حساب؟ إنشاء حساب جديد
              </button>
            )}

            {onBackToCatalog && (
              <button
                onClick={onBackToCatalog}
                className="w-full text-blue-300 hover:text-white transition-colors text-sm flex items-center justify-center gap-1 py-1"
              >
                <ArrowRight className="w-4 h-4" />
                العودة إلى الصفحة الرئيسية
              </button>
            )}
          </div>

          {/* تم حذف قسم البيانات التجريبية */}
        </div>
      </div>
    </div>
  );
}