import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";
const MESHY_API_BASE = "https://api.meshy.ai/openapi/v2";

const SCULPTURE_PROMPT = `Transform the uploaded pet photo into a full body stylized grey monocolor resin sculpture designed for high-quality 3D printing as a keychain.

Style:
- Clean sculpted collectible figurine style (not realistic scan)
- Controlled fur texture with large soft sculpted clumps
- Smooth surfaces with intentional detailing
- No chaotic or noisy micro-details
- Premium designer toy / collectible sculpture look

Face:
- Preserve the pet's identity and expression
- Add subtle eyelids and eye definition (no blank spheres)
- Slightly stylized cute proportions
- Eyes readable even at small size

Geometry:
- Thick, durable shapes suitable for resin printing
- No thin or fragile parts
- Remove whiskers or engrave them subtly
- Clean topology, simplified forms

Keychain:
- Integrated loop at top, smoothly blended into the head
- Strong and printable

Material:
- Single-color matte resin
- Soft light reflections
- Looks like a real printed object, not CGI

Output:
- front-facing collectible
- studio lighting
- clean white background
- premium product look

Important:
- Must look like a handcrafted sculpt, not AI noise
- Must be manufacturable and durable`;

async function callGemini(apiKey: string, parts: Record<string, unknown>[]) {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", res.status, errText);
    return { error: errText, status: res.status };
  }

  const data = await res.json();
  const responseParts = data?.candidates?.[0]?.content?.parts;

  if (!responseParts) {
    return { error: "No parts in response", status: 502 };
  }

  for (const part of responseParts) {
    const imageData = part.inline_data || part.inlineData;
    if (imageData) {
      return {
        image: imageData.data as string,
        mimeType: (imageData.mime_type || imageData.mimeType || "image/png") as string,
      };
    }
  }

  return { error: "No image in response", status: 502 };
}

/**
 * POST  - Step 1: Generate sculpture image via Gemini, then start Meshy 3D task
 *         OR just start Meshy task if sculptureImageUrl is provided
 * GET   - Poll Meshy task status
 */
export async function POST(req: NextRequest) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const meshyKey = process.env.MESHY_API_KEY;

  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }
  if (!meshyKey) {
    return NextResponse.json({ error: "MESHY_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType, sculptureImageUrl } = body as {
      imageBase64?: string;
      mimeType?: string;
      sculptureImageUrl?: string;
    };

    // If sculptureImageUrl is provided, skip Gemini and go straight to Meshy
    if (sculptureImageUrl) {
      const meshyRes = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${meshyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: sculptureImageUrl,
          enable_pbr: true,
          should_remesh: true,
          topology: "quad",
          target_polycount: 30000,
        }),
      });

      if (!meshyRes.ok) {
        const errText = await meshyRes.text();
        console.error("Meshy API error:", meshyRes.status, errText);
        return NextResponse.json({ error: "Failed to start 3D generation" }, { status: meshyRes.status });
      }

      const meshyData = await meshyRes.json();
      return NextResponse.json({ taskId: meshyData.result });
    }

    // Step 1: Generate sculpture image from pet photo via Gemini
    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64 and mimeType" },
        { status: 400 },
      );
    }

    const sculptureResult = await callGemini(geminiKey, [
      { text: SCULPTURE_PROMPT },
      {
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      },
    ]);

    if ("error" in sculptureResult && !("image" in sculptureResult)) {
      return NextResponse.json(
        { error: "Sculpture generation failed. Please try again." },
        { status: typeof sculptureResult.status === "number" ? sculptureResult.status : 502 },
      );
    }

    // Return the sculpture image so the client can upload it and then start the Meshy task
    return NextResponse.json({
      sculptureImage: sculptureResult.image,
      sculptureMimeType: sculptureResult.mimeType,
    });
  } catch (err) {
    console.error("Meshy POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const meshyKey = process.env.MESHY_API_KEY;
  if (!meshyKey) {
    return NextResponse.json({ error: "MESHY_API_KEY not configured" }, { status: 500 });
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(`${MESHY_API_BASE}/image-to-3d/${taskId}`, {
      headers: {
        Authorization: `Bearer ${meshyKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Meshy poll error:", res.status, errText);
      return NextResponse.json({ error: "Failed to check task status" }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      status: data.status, // PENDING, IN_PROGRESS, SUCCEEDED, FAILED, EXPIRED
      progress: data.progress ?? 0,
      modelUrl: data.model_urls?.glb ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
    });
  } catch (err) {
    console.error("Meshy GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
