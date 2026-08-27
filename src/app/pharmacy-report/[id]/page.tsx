"use client";

import { useEffect, useState, useRef } from "react";

interface PharmacyData {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  totalDebt: string;
  totalPaid: string;
  creditLimit: string;
  isActive: boolean;
  notes: string;
}

interface Order {
  id: number;
  total: string;
  status: string;
  createdAt: string;
}

interface Receipt {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
}

export default function PharmacyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setPharmacyId(p.id));
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [pharmaRes, ordersRes, receiptsRes] = await Promise.all([
          fetch(`/api/pharmacies/${pharmacyId}`),
          fetch(`/api/orders?pharmacyId=${pharmacyId}`),
          fetch(`/api/receipts?pharmacyId=${pharmacyId}`),
        ]);

        if (pharmaRes.ok) {
          const data = await pharmaRes.json();
          setPharmacy(data.pharmacy);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        }
        if (receiptsRes.ok) {
          const data = await receiptsRes.json();
          setReceipts(data.receipts || []);
        }
      } catch (error) {
        console.error("خطأ في تحميل البيانات", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pharmacyId]);

  // ✅ زر التحميل المباشر (بدون طباعة)
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      // استيراد المكتبات ديناميكياً (تجنب أخطاء SSR)
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdfHeight;

      // إضافة صفحات إضافية إذا كان المحتوى طويلاً
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`تقرير_الصيدلية_${pharmacy?.name || pharmacyId}.pdf`);
    } catch (error) {
      console.error("❌ فشل إنشاء PDF:", error);
      alert("حدث خطأ أثناء إنشاء التقرير. جرب استخدام زر الطباعة كبديل.");
    } finally {
      setIsDownloading(false);
    }
  };

  // زر الطباعة الاحتياطي
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600 text-xl">⚠️ الصيدلية غير موجودة</div>
      </div>
    );
  }

  const debt = parseFloat(pharmacy.totalDebt);
  const credit = parseFloat(pharmacy.creditLimit);
  const usagePercent = credit > 0 ? (debt / credit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* أزرار التحميل */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 print:hidden"
          >
            {isDownloading ? "⏳ جاري التحميل..." : "📥 تحميل PDF مباشر"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors print:hidden"
          >
            🖨️ طباعة (بديل)
          </button>
        </div>

        {/* محتوى التقرير */}
        <div
          ref={reportRef}
          className="bg-white rounded-2xl shadow-xl p-8 print:shadow-none print:p-4"
          style={{ color: "#000", backgroundColor: "#fff" }}
        >
          <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
            تقرير الصيدلية: {pharmacy.name}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            تاريخ التقرير: {new Date().toLocaleDateString("ar")}
          </p>

          <h2 className="text-xl font-bold text-blue-700 border-b pb-2 mb-4">
            معلومات الصيدلية
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div><strong>الاسم:</strong> {pharmacy.name}</div>
            <div><strong>المالك:</strong> {pharmacy.ownerName}</div>
            <div><strong>الهاتف:</strong> {pharmacy.phone}</div>
            <div><strong>البريد:</strong> {pharmacy.email || "-"}</div>
            <div><strong>حد الائتمان:</strong> {parseFloat(pharmacy.creditLimit).toFixed(2)} ₪</div>
            <div><strong>الدين الحالي:</strong> {parseFloat(pharmacy.totalDebt).toFixed(2)} ₪</div>
            <div><strong>إجمالي المدفوع:</strong> {parseFloat(pharmacy.totalPaid).toFixed(2)} ₪</div>
            <div><strong>الحالة:</strong> {pharmacy.isActive ? "نشط" : "معطل"}</div>
            {pharmacy.notes && (
              <div className="col-span-2"><strong>ملاحظات:</strong> {pharmacy.notes}</div>
            )}
          </div>

          <h2 className="text-xl font-bold text-green-700 border-b pb-2 mb-4">
            الملخص المالي
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div><strong>الدين الحالي:</strong> {debt.toFixed(2)} ₪</div>
            <div><strong>إجمالي المدفوع:</strong> {parseFloat(pharmacy.totalPaid).toFixed(2)} ₪</div>
            <div><strong>حد الائتمان:</strong> {credit.toFixed(2)} ₪</div>
            <div><strong>نسبة الاستخدام:</strong> {usagePercent.toFixed(1)}%</div>
          </div>

          {orders.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-purple-700 border-b pb-2 mb-4">
                الطلبات ({orders.length})
              </h2>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-purple-100">
                    <th className="border p-2 text-right">رقم</th>
                    <th className="border p-2 text-right">التاريخ</th>
                    <th className="border p-2 text-right">المبلغ</th>
                    <th className="border p-2 text-right">الحالة</th>
                    <th className="border p-2 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="border p-2">#{o.id}</td>
                      <td className="border p-2">{new Date(o.createdAt).toLocaleDateString("ar")}</td>
                      <td className="border p-2">{parseFloat(o.total).toFixed(2)} ₪</td>
                      <td className="border p-2">
                        {o.status === "pending" ? "قيد المراجعة" : o.status === "approved" ? "مقبول" : "مرفوض"}
                      </td>
                      <td className="border p-2">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {receipts.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-amber-700 border-b pb-2 mb-4">
                الإيصالات ({receipts.length})
              </h2>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="border p-2 text-right">رقم</th>
                    <th className="border p-2 text-right">التاريخ</th>
                    <th className="border p-2 text-right">المبلغ</th>
                    <th className="border p-2 text-right">الحالة</th>
                    <th className="border p-2 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="border p-2">#{r.id}</td>
                      <td className="border p-2">{new Date(r.createdAt).toLocaleDateString("ar")}</td>
                      <td className="border p-2">{parseFloat(r.amount).toFixed(2)} ₪</td>
                      <td className="border p-2">
                        {r.status === "pending" ? "قيد المراجعة" : r.status === "approved" ? "مقبول" : "مرفوض"}
                      </td>
                      <td className="border p-2">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="text-center text-gray-500 text-sm mt-8 border-t pt-4">
            تم إنشاء هذا التقرير بواسطة نظام Novex Pharma
          </div>
        </div>
      </div>
    </div>
  );
}