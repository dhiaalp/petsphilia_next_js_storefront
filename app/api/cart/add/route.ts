import { NextRequest, NextResponse } from "next/server";

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

    if (!variantId) {
      return NextResponse.json(
        { error: "A Medusa product variant is required before adding to cart." },
        { status: 400 },
      );
    }

    const { getOrCreateCart } = await import("@/lib/cart");
    const { medusa } = await import("@/lib/medusa");

    const cart = await getOrCreateCart();
    const cartId = cart.cart?.id;

    if (!cartId) {
      return NextResponse.json(
        { error: "Could not create a Medusa cart." },
        { status: 500 },
      );
    }

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
        product_handle: productHandle,
        ...(size && { size }),
      },
    });

    return NextResponse.json({ success: true, source: "medusa" });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 },
    );
  }
}
