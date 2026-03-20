import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";
const STRIPE_PROVIDER_ID = "pp_stripe_stripe";

async function medusaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : `Medusa request failed: ${res.status}`,
    );
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, firstName, lastName, email, phone, address, city, country } = body;

    if (!cartId) {
      return NextResponse.json(
        { error: "A Medusa cart is required for Stripe checkout" },
        { status: 400 },
      );
    }

    if (!firstName || !lastName || !email || !phone || !address || !city) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

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

    const shippingRes = await medusaFetch(`/store/shipping-options?cart_id=${cartId}`);
    const shippingOptions = shippingRes.shipping_options ?? [];

    if (shippingOptions.length > 0) {
      await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
        method: "POST",
        body: JSON.stringify({ option_id: shippingOptions[0].id }),
      });
    }

    const payColRes = await medusaFetch(`/store/payment-collections`, {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    });

    const payColId = payColRes.payment_collection?.id;

    if (!payColId) {
      throw new Error("Unable to initialize payment collection");
    }

    const paymentSessionRes = await medusaFetch(
      `/store/payment-collections/${payColId}/payment-sessions`,
      {
        method: "POST",
        body: JSON.stringify({ provider_id: STRIPE_PROVIDER_ID }),
      },
    );

    const refreshedCart = await medusaFetch(`/store/carts/${cartId}`);

    const session =
      refreshedCart.cart?.payment_collection?.payment_sessions?.find(
        (paymentSession: Record<string, unknown>) =>
          paymentSession.provider_id === STRIPE_PROVIDER_ID,
      ) ??
      paymentSessionRes.payment_collection?.payment_sessions?.find(
        (paymentSession: Record<string, unknown>) =>
          paymentSession.provider_id === STRIPE_PROVIDER_ID,
      );

    const clientSecret = session?.data?.client_secret;

    if (!clientSecret) {
      throw new Error("Stripe client secret was not returned");
    }

    return NextResponse.json({ success: true, clientSecret });
  } catch (err) {
    console.error("Stripe checkout init failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to initialize Stripe checkout right now.",
      },
      { status: 500 },
    );
  }
}
