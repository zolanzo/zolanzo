import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. MIME Type Validation
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: PNG, JPEG, WEBP, PDF." },
        { status: 400 },
      );
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB maximum size limit." },
        { status: 400 },
      );
    }

    const fileRef = `PROOF_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const publicUrl = `https://storage.zolanzo.com/evidence/${fileRef}`;

    return NextResponse.json({
      success: true,
      fileRef,
      publicUrl,
      sizeBytes: file.size,
      mimeType: file.type || "image/png",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload Error" },
      { status: 500 },
    );
  }
}
