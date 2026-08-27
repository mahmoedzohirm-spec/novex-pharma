// ============================================
// ملف: src/components/RegisterPage.tsx
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
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import Image from "next/image";

interface RegisterPageProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
  onBackToCatalog?: () => void;
}

export default function RegisterPage({
  onSuccess,
  onBackToLogin,
  onBackToCatalog,
}: RegisterPageProps) {
  const { register } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    name: "",
    ownerName: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.phone || !form.password || !form.name || !form.ownerName) {
      toast.warning("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (form.password.length < 6) {
      toast.warning("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.warning("كلمة المرور غير متطابقة");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        phone: form.phone,
        password: form.password,
        name: form.name,
        ownerName: form.ownerName,
        email: form.email || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "فشل إنشاء الحساب");
      }

      toast.success("تم إنشاء الحساب بنجاح!", "مرحباً بك في Novex Pharma");
      onSuccess();
    } catch (err) {
      toast.error("فشل إنشاء الحساب", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-blue-950 via-indigo-900 to-blue-800 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Image
            src="/lond.jpg"
            alt="Novex Pharma"
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl shadow-2xl shadow-blue-500/30 mb-3 mx-auto object-cover"
          />
          <h1 className="text-2xl font-black text-white mb-1">
            Novex <span className="text-cyan-400">Pharma</span>
          </h1>
          <p className="text-blue-300 text-sm">إنشاء حساب جديد</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                رقم الجوال *
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-3 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                اسم الصيدلية *
              </label>
              <div className="relative">
                <Building className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="اسم الصيدلية"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-3 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                اسم المالك *
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type="text"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="اسم المالك"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-3 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-3 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                كلمة المرور *
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-10 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                تأكيد كلمة المرور *
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/15 border border-white/30 rounded-xl pr-10 pl-10 py-3 text-white placeholder-blue-300/60 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2",
                isLoading
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-linear-to-l from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حساب"
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={onBackToLogin}
              className="text-blue-300 hover:text-white transition-colors text-sm font-semibold flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              لديك حساب بالفعل؟ تسجيل الدخول
            </button>

            {onBackToCatalog && (
              <button
                onClick={onBackToCatalog}
                className="text-blue-400/70 hover:text-white transition-colors text-xs flex items-center justify-center gap-1"
              >
                العودة إلى الصفحة الرئيسية
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}