import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3Endpoint = process.env.S3_ENDPOINT;

const s3Client =
  s3Bucket && s3Region && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region: s3Region,
        ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
        forcePathStyle: false,
      })
    : null;

function guessContentType(fileKey: string) {
  if (fileKey.endsWith(".png")) return "image/png";
  if (fileKey.endsWith(".webp")) return "image/webp";
  if (fileKey.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const fileKey = key.join("/");

  if (!fileKey) {
    return NextResponse.json({ error: "Missing file key" }, { status: 400 });
  }

  try {
    if (s3Client && s3Bucket) {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3Bucket,
          Key: fileKey,
        }),
      );

      const bytes = await response.Body?.transformToByteArray();

      if (!bytes) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": response.ContentType || guessContentType(fileKey),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const localPath = path.join(process.cwd(), "public", ...key);
    const buffer = await readFile(localPath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": guessContentType(fileKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
