import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendMetaEvent } from "@/lib/meta-conversions";

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
    const { cartId } = (await req.json()) as { cartId?: string };

    if (!cartId) {
      return NextResponse.json({ error: "Missing cartId" }, { status: 400 });
    }

    const completeRes = await medusaFetch(`/store/carts/${cartId}/complete`, {
      method: "POST",
    });

    if (!(completeRes.type === "order" || completeRes.order)) {
      throw new Error("Cart completion did not return an order");
    }

    const cookieStore = await cookies();
    cookieStore.delete("_petsphilia_cart_id");

    await sendMetaEvent({
      eventName: "Purchase",
      req,
      eventSourceUrl: new URL("/checkout", req.url).toString(),
      email: completeRes.order?.email,
      phone: completeRes.order?.shipping_address?.phone,
      firstName: completeRes.order?.shipping_address?.first_name,
      lastName: completeRes.order?.shipping_address?.last_name,
      city: completeRes.order?.shipping_address?.city,
      country: completeRes.order?.shipping_address?.country_code,
      value:
        typeof completeRes.order?.total === "number"
          ? completeRes.order.total
          : undefined,
      currency: completeRes.order?.currency_code ?? "aed",
      contentIds:
        completeRes.order?.items?.map((item: { variant_id?: string }) => item.variant_id || "").filter(Boolean) ??
        [],
      numItems: completeRes.order?.items?.length,
      eventId: `purchase_${completeRes.order?.id ?? cartId}`,
    });

    return NextResponse.json({
      success: true,
      orderId: completeRes.order?.id,
    });
  } catch (err) {
    console.error("Stripe checkout completion failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to complete the order.",
      },
      { status: 500 },
    );
  }
}
