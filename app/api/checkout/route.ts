import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

async function medusaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      ...options.headers,
    },
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, firstName, lastName, email, phone, address, city, country } = body;

    if (!firstName || !lastName || !email || !phone || !address || !city) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (cartId) {
      try {
        // 1. Get cart items to extract custom metadata
        const cartData = await medusaFetch(`/store/carts/${cartId}`);
        const cartItems = cartData.cart?.items ?? [];
        const orderMeta: Record<string, string> = {};
        cartItems.forEach((item: Record<string, unknown>, idx: number) => {
          const meta = (item.metadata ?? {}) as Record<string, string>;
          const prefix = cartItems.length === 1 ? "" : `item_${idx + 1}_`;
          orderMeta[`${prefix}product`] = String(item.title ?? "");
          orderMeta[`${prefix}variant`] = (item.variant as Record<string, string>)?.title ?? "";
          if (meta.pet_name) orderMeta[`${prefix}pet_name`] = meta.pet_name;
          if (meta.art_style) orderMeta[`${prefix}art_style`] = meta.art_style;
          if (meta.pet_photo) orderMeta[`${prefix}pet_photo`] = meta.pet_photo;
          if (meta.custom_artwork) orderMeta[`${prefix}cartoon_design`] = meta.custom_artwork;
          if (meta.custom_mockup) orderMeta[`${prefix}product_mockup`] = meta.custom_mockup;
        });

        // 2. Update cart with email, addresses, and order-level metadata
        await medusaFetch(`/store/carts/${cartId}`, {
          method: "POST",
          body: JSON.stringify({
            email,
            metadata: orderMeta,
            shipping_address: {
              first_name: firstName,
              last_name: lastName,
              phone,
              address_1: address,
              city,
              country_code: country || "ae",
            },
            billing_address: {
              first_name: firstName,
              last_name: lastName,
              phone,
              address_1: address,
              city,
              country_code: country || "ae",
            },
          }),
        });

        // 2. Get shipping options and add to cart
        const shippingRes = await medusaFetch(`/store/shipping-options?cart_id=${cartId}`);
        const shippingOptions = shippingRes.shipping_options ?? [];
        if (shippingOptions.length > 0) {
          await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
            method: "POST",
            body: JSON.stringify({ option_id: shippingOptions[0].id }),
          });
        }

        // 3. Initialize payment collection
        const payColRes = await medusaFetch(`/store/payment-collections`, {
          method: "POST",
          body: JSON.stringify({ cart_id: cartId }),
        });
        const payColId = payColRes.payment_collection?.id;

        if (payColId) {
          // 4. Create payment session with system provider (COD)
          await medusaFetch(`/store/payment-collections/${payColId}/payment-sessions`, {
            method: "POST",
            body: JSON.stringify({ provider_id: "pp_system_default" }),
          });
        }

        // 5. Complete the cart → creates an order
        const completeRes = await medusaFetch(`/store/carts/${cartId}/complete`, {
          method: "POST",
        });

        if (completeRes.type === "order" || completeRes.order) {
          const cookieStore = await cookies();
          cookieStore.delete("_petsphilia_cart_id");

          return NextResponse.json({
            success: true,
            source: "medusa",
            orderId: completeRes.order?.id,
          });
        }

        // If completion failed, log the reason
        console.error("Cart completion failed:", JSON.stringify(completeRes));
      } catch (err) {
        console.error("Medusa checkout failed:", err);
      }
    }

    // Fallback: clear local cart
    const cookieStore = await cookies();
    cookieStore.delete("_petsphilia_local_cart");

    return NextResponse.json({
      success: true,
      source: "local",
      order: { firstName, lastName, email, phone, address, city, country: country || "ae" },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
