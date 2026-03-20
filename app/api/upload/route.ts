import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3PublicUrl = process.env.S3_PUBLIC_URL;
const s3Endpoint = process.env.S3_ENDPOINT;

const s3Client =
  s3Bucket && s3Region && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region: s3Region,
        ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
        forcePathStyle: false,
      })
    : null;

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

    if (s3Client && s3Bucket) {
      const key = `uploads/${filename}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType || "image/jpeg",
        }),
      );

      const publicBaseUrl =
        s3PublicUrl || `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;

      return NextResponse.json({
        url: `${publicBaseUrl.replace(/\/$/, "")}/${key}`,
      });
    }

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
