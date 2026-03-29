import { NextRequest, NextResponse } from "next/server";
import { notifyWhatsApp } from "../notify";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

const MOCKUP_TEXT: Record<string, string> = {
  tshirt: "a WHITE T-SHIRT",
  hoodie: "a WHITE HOODIE",
  mug: "a WHITE MUG",
};

const PRINT_AREA_TEXT: Record<string, string> = {
  tshirt:
    "Place the artwork as a medium-size front chest print, centered horizontally, taking up about 30% to 40% of the shirt width with generous white space around it.",
  hoodie:
    "Place the artwork as a medium-size front chest print, centered horizontally, taking up about 28% to 38% of the hoodie width with generous white space around it.",
  mug:
    "Place the artwork as a medium-size print on the center of the mug body, taking up about 35% to 45% of the visible mug area and leaving clear empty margins around it.",
};

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

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType, style, petName, product } = body as {
      imageBase64: string;
      mimeType: string;
      style: string;
      petName?: string;
      product?: string;
    };

    if (!imageBase64 || !mimeType || !style) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64, mimeType, style" },
        { status: 400 },
      );
    }

    const textInstruction = petName
      ? `Add the name "${petName}" elegantly in the design if it fits naturally.`
      : "";

    // Step 1: Generate the design artwork on white background
    const artworkPrompt = `Create a high-quality pet portrait illustration based on the reference photo. `
      + `Use this style: ${style}. `
      + `Focus ONLY on the pet's head and face — do NOT include the body, legs, or tail. `
      + `Capture the pet's unique facial features: eyes, ears, nose, fur texture, markings, and personality. `
      + `The portrait should be a close-up head shot with expressive, detailed eyes. `
      + `${textInstruction}${textInstruction ? ", add it seamlessly with design, integrate it with it using the same style. " : ""}`
      + `The background MUST be completely WHITE - clean, minimal, with no objects, no shadows, no textures. `
      + `The design should be centered and suitable for printing on products. `
      + `Keep the illustration compact with comfortable white margins on all sides, as if it will later be placed inside a print area. `
      + `Do not let the artwork fill the entire frame or touch the edges. `
      + `This is just the design artwork - NOT on any product yet. Pure white background only.`;

    const artworkResult = await callGemini(apiKey, [
      { text: artworkPrompt },
      {
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      },
    ]);

    if ("error" in artworkResult && !("image" in artworkResult)) {
      return NextResponse.json(
        { error: `Artwork generation failed. Please try again.` },
        { status: artworkResult.status },
      );
    }

    // Step 2: Generate the product mockup using the artwork
    let mockupResult: { image: string; mimeType: string } | null = null;

    if (product) {
      // Determine product type from handle
      let productType = "mug";
      if (product.includes("tshirt") || product.includes("shirt")) productType = "tshirt";
      else if (product.includes("hoodie")) productType = "hoodie";

      const mockupText = MOCKUP_TEXT[productType] || MOCKUP_TEXT.mug;
      const printAreaText = PRINT_AREA_TEXT[productType] || PRINT_AREA_TEXT.mug;
      const mockupTextInstruction = petName
        ? `Add the name "${petName}" elegantly on the product if it fits naturally.`
        : "";

      const mockupPrompt = `Take the EXACT pet design shown in the reference image and place it on this product: ${mockupText}. `
        + `Use a beautiful gradient orange background from #ee7519 to #d46a1a behind the product. `
        + `Keep the pet design EXACTLY as shown in the reference image - same colors, same style, same composition, same details. `
        + `Do NOT change the design colors to white - keep the original design colors. `
        + `The product itself (tshirt/hoodie/mug/etc) should be WHITE. `
        + `${printAreaText} `
        + `The artwork must look neatly fitted inside the printable area, smaller than the product, and never oversized. `
        + `Leave visible blank product space around the design so the mockup feels realistic and premium. `
        + `Do not crop the design, do not wrap it around edges, and do not let it dominate the whole product surface. `
        + `The overall image should look like a professional product shot - realistic, well-lit, and ready for an online store. `
        + `The white product must be clearly visible with the original design, set against the orange gradient background.`;

      const mockup = await callGemini(apiKey, [
        { text: mockupPrompt },
        {
          inline_data: {
            mime_type: artworkResult.mimeType,
            data: artworkResult.image,
          },
        },
      ]);

      if ("image" in mockup && mockup.image && mockup.mimeType) {
        mockupResult = { image: mockup.image, mimeType: mockup.mimeType };
      }
    }

    const productLabel = product || "unknown";
    await notifyWhatsApp(
      `🎨 New design generated!\nProduct: ${productLabel}\nPet name: ${petName || "N/A"}\nStyle: ${style}`
    );

    return NextResponse.json({
      image: artworkResult.image,
      mimeType: artworkResult.mimeType,
      ...(mockupResult && {
        mockup: mockupResult.image,
        mockupMimeType: mockupResult.mimeType,
      }),
    });
  } catch (err) {
    console.error("Generate route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
