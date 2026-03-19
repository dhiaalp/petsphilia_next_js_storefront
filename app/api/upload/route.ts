import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = (await req.json()) as {
      image: string;
      mimeType: string;
    };

    if (!image) {
      return NextResponse.json({ error: "No image data" }, { status: 400 });
    }

    const ext = mimeType?.includes("png") ? "png" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
