import { NextRequest, NextResponse } from "next/server";
import { addToLocalCart } from "@/lib/cart";

// Hardcoded prices for when Medusa isn't connected
const PRICES: Record<string, string> = {
  "custom-mug": "AED 60",
  "custom-tshirt": "AED 89",
  "custom-hoodie": "AED 120",
};

const TITLES: Record<string, string> = {
  "custom-mug": "Custom Mug",
  "custom-tshirt": "Custom T-Shirt",
  "custom-hoodie": "Custom Hoodie",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const variantId = String(formData.get("variantId") ?? "");
    const petPhotoUrl = String(formData.get("petPhotoUrl") ?? "");
    const artworkUrl = String(formData.get("artworkUrl") ?? "");
    const mockupUrl = String(formData.get("mockupUrl") ?? "");
    const artStyle = String(formData.get("artStyle") ?? "");
    const petName = String(formData.get("petName") ?? "");
    const size = String(formData.get("size") ?? "");
    const productHandle = String(formData.get("productHandle") ?? "");

    // Try Medusa first if we have a variant ID
    if (variantId) {
      try {
        const { getOrCreateCart } = await import("@/lib/cart");
        const { medusa } = await import("@/lib/medusa");

        const cart = await getOrCreateCart();
        const cartId = cart.cart?.id;

        if (cartId) {
          await medusa.store.cart.createLineItem(cartId, {
            variant_id: variantId,
            quantity: 1,
            metadata: {
              is_customized: true,
              pet_photo: petPhotoUrl,
              custom_artwork: artworkUrl,
              custom_mockup: mockupUrl,
              art_style: artStyle,
              pet_name: petName,
              ...(size && { size }),
            },
          });

          return NextResponse.json({ success: true, source: "medusa" });
        }
      } catch (err) {
        console.log("Medusa unavailable, falling back to local cart:", (err as Error).message);
      }
    }

    // Fallback: save to local cookie-based cart
    await addToLocalCart({
      productHandle,
      productTitle: TITLES[productHandle] || productHandle,
      petPhotoUrl,
      artworkUrl,
      mockupUrl,
      artStyle,
      petName,
      size,
      price: PRICES[productHandle] || "—",
    });

    return NextResponse.json({ success: true, source: "local" });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 },
    );
  }
}
