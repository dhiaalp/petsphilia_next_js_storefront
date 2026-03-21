import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCart, removeFromLocalCart } from "@/lib/cart";
import { medusa } from "@/lib/medusa";

function redirectToCart(req: NextRequest) {
  return NextResponse.redirect(new URL("/cart", req.url), { status: 303 });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const lineItemId = String(formData.get("lineItemId") ?? "");
    const localItemId = String(formData.get("localItemId") ?? "");

    if (lineItemId) {
      const cart = await getOrCreateCart();
      const cartId = cart.cart?.id;

      if (!cartId) {
        return redirectToCart(req);
      }

      await medusa.store.cart.deleteLineItem(cartId, lineItemId);
    } else if (localItemId) {
      await removeFromLocalCart(localItemId);
    }

    return redirectToCart(req);
  } catch (err) {
    console.error("Remove from cart error:", err);
    return redirectToCart(req);
  }
}
