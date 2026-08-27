import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد ملف" }, { status: 400 });
    }

    // Convert file to base64 data URL
    // In production with Vercel, set BLOB_READ_WRITE_TOKEN and uncomment Vercel Blob code
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "خطأ في رفع الملف" }, { status: 500 });
  }
}
