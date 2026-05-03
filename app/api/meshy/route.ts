import { NextRequest, NextResponse } from "next/server";
import { notifyWhatsApp } from "../notify";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";
const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MESHY_API_BASE = "https://api.meshy.ai/openapi/v1";

type FurDensity = "dense" | "minimal" | "moderate";

const FUR_STYLES: Record<FurDensity, string> = {
  dense: `- Simplified smooth fur: large soft sculpted clumps, broad flowing surfaces
- Avoid micro-detail noise — prioritise clean readable shapes`,
  minimal: `- Fine detailed fur texture with realistic strand groupings
- Complex surface patterns and skin fold detail to add richness`,
  moderate: `-high quality fur texture
- surfaces with intentional detailing`,
};

function buildSculpturePrompt(furDensity: FurDensity): string {
  return `Transform the uploaded pet photo into a full body stylized grey monocolor resin sculpture designed for high-quality 3D printing as a keychain.

Style:
- Clean sculpted collectible figurine style (realistic scan)
${FUR_STYLES[furDensity]}
- No chaotic or noisy micro-details
- Premium designer toy / collectible sculpture look

Face:
- Preserve the pet's identity and expression
- realistic glossy eyes, the color must be grey the same as the entire model

Geometry:
- Thick, durable shapes suitable for resin printing
- No thin or fragile parts
- Remove whiskers or engrave them subtly
-realistic complex forms
- NO metal parts, chains, rings, or hardware — everything must be solid resin
- The keychain loop must be part of the sculpt, not a separate metal piece, semi donut shape

Keychain:
- Integrated solid resin loop at top, smoothly blended into the head
- Strong and printable, no metal rings or chain links

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
}

async function analyzeFurDensity(apiKey: string, imageBase64: string, mimeType: string): Promise<FurDensity> {
  try {
    const res = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Look at this pet photo and classify its coat as exactly one word: "dense" (thick, fluffy, long, bushy, or heavy double coat), "minimal" (short, smooth, fine, sleek, sparse, or hairless), or "moderate" (medium length or average thickness). Reply with only that one word.`,
            },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (!res.ok) return "moderate";
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ?? "";
    if (text.includes("dense")) return "dense";
    if (text.includes("minimal")) return "minimal";
    return "moderate";
  } catch {
    return "moderate";
  }
}

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
 * POST  - Generate sculpture via Gemini, then immediately submit to Meshy.
 *         Returns both the sculpture preview image AND the Meshy taskId.
 *         This avoids round-tripping the large base64 through the client.
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
    const { imageBase64, mimeType, petName } = body as {
      imageBase64: string;
      mimeType: string;
      petName?: string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64 and mimeType" },
        { status: 400 },
      );
    }

    const furDensity = await analyzeFurDensity(geminiKey, imageBase64, mimeType);

    const namePrompt = petName?.trim()
      ? `\n\nName:\n- Add the name "${petName.trim()}" in a proportional size as a necklace. It must be readable with a rounded friendly font. The letters must be showed freely without a base plate.`
      : "";
    const finalPrompt = buildSculpturePrompt(furDensity) + namePrompt;

    // Step 1: Generate sculpture image from pet photo via Gemini
    const sculptureResult = await callGemini(geminiKey, [
      { text: finalPrompt },
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

    // Step 2: Immediately send sculpture to Meshy as a data URL
    const dataUrl = `data:${sculptureResult.mimeType};base64,${sculptureResult.image}`;

    const meshyRes = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${meshyKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: dataUrl,
        ai_model: "meshy-6",
        should_texture: false,
        should_remesh: false,
      }),
    });

    if (!meshyRes.ok) {
      const errText = await meshyRes.text();
      console.error("Meshy API error:", meshyRes.status, errText);
      // Still return the sculpture so user can see it, even if Meshy failed
      return NextResponse.json({
        sculptureImage: sculptureResult.image,
        sculptureMimeType: sculptureResult.mimeType,
        taskId: null,
        meshyError: `Meshy error (${meshyRes.status}): ${errText.slice(0, 200)}`,
      });
    }

    const meshyData = await meshyRes.json();

    await notifyWhatsApp(
      `🔑 New 3D Keychain generated!\nMeshy Task: ${meshyData.result}\nA customer is creating a custom keychain.`
    );

    return NextResponse.json({
      sculptureImage: sculptureResult.image,
      sculptureMimeType: sculptureResult.mimeType,
      taskId: meshyData.result,
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
