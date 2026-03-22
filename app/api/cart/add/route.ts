import { NextRequest, NextResponse } from "next/server";
import { sendGAEvent } from "@/lib/google-analytics-events";
import { sendMetaEvent } from "@/lib/meta-conversions";

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

    const created = await medusa.store.cart.createLineItem(cartId, {
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

    const createdItem =
      created.cart?.items?.find((item) => item.variant_id === variantId) ??
      created.cart?.items?.[created.cart.items.length - 1];

    await sendMetaEvent({
      eventName: "AddToCart",
      req,
      eventSourceUrl: new URL("/cart", req.url).toString(),
      contentName: productHandle || createdItem?.title || "Custom product",
      contentIds: productHandle ? [productHandle] : variantId ? [variantId] : [],
      currency: created.cart?.currency_code ?? "aed",
      value:
        typeof createdItem?.unit_price === "number"
          ? createdItem.unit_price
          : undefined,
      numItems: 1,
    });

    await sendGAEvent({
      req,
      name: "add_to_cart",
      currency: created.cart?.currency_code ?? "aed",
      value:
        typeof createdItem?.unit_price === "number"
          ? createdItem.unit_price
          : undefined,
      items: [
        {
          item_id: productHandle || variantId,
          item_name: createdItem?.title || productHandle || "Custom product",
          item_variant: size || artStyle || undefined,
          price:
            typeof createdItem?.unit_price === "number"
              ? createdItem.unit_price
              : undefined,
          quantity: 1,
        },
      ],
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
