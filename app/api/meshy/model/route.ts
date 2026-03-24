import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy GLB model downloads from Meshy to avoid CORS issues.
 * Usage: GET /api/meshy/model?url=<encoded meshy asset url>
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow proxying from Meshy's asset domain
  if (!url.startsWith("https://assets.meshy.ai/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch model" }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to proxy model" }, { status: 502 });
  }
}
