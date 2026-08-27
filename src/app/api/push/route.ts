import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, title, message, pharmacyId } = body;

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_EMAIL = process.env.VAPID_EMAIL || "admin@novex.com";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      // VAPID keys not configured, return success silently
      return NextResponse.json({
        success: true,
        message: "VAPID keys not configured",
      });
    }

    const webpush = await import("web-push");
    webpush.default.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: title || "إشعار من Novex Pharma",
      body: message || "لديك إشعار جديد",
      pharmacyId,
    });

    if (subscription) {
      try {
        await webpush.default.sendNotification(subscription, payload);
      } catch (pushError) {
        console.error("Push notification error:", pushError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push route error:", error);
    return NextResponse.json({ error: "خطأ في إرسال الإشعار" }, { status: 500 });
  }
}

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  return NextResponse.json({ publicKey });
}
