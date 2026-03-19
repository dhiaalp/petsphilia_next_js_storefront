"use server";

import { redirect } from "next/navigation";
import { getOrCreateCart } from "@/lib/cart";
import { medusa } from "@/lib/medusa";

export async function addToCart(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  if (!variantId) {
    return;
  }

  const cart = await getOrCreateCart();
  const cartId = cart.cart?.id;

  if (!cartId) {
    return;
  }

  await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity: 1,
  });

  redirect("/cart");
}

export async function addCustomizedToCart(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const artworkUrl = String(formData.get("artworkUrl") ?? "");

  if (!variantId) {
    return;
  }

  const cart = await getOrCreateCart();
  const cartId = cart.cart?.id;

  if (!cartId) {
    return;
  }

  await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity: 1,
    metadata: {
      custom_artwork: artworkUrl,
      is_customized: true,
    },
  });

  redirect("/cart");
}

