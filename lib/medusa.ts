import Medusa from "@medusajs/js-sdk";

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

export const medusa = new Medusa({
  baseUrl: backendUrl,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  debug: process.env.NODE_ENV === "development",
});

export type StoreProduct = {
  id: string;
  title: string;
  subtitle?: string | null;
  handle?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  variants?: Array<{
    id: string;
    title: string;
    calculated_price?: {
      calculated_amount?: number;
      currency_code?: string;
    };
  }>;
};

export function formatMoney(amount = 0, currencyCode = "aed") {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function listProducts(limit = 12) {
  const regionId = process.env.NEXT_PUBLIC_DEFAULT_REGION_ID;

  const response = await medusa.store.product.list({
    limit,
    region_id: regionId,
    fields: "*variants.calculated_price,+metadata,+tags",
  });

  return (response.products ?? []) as StoreProduct[];
}

export async function getProductByHandle(handle: string) {
  const regionId = process.env.NEXT_PUBLIC_DEFAULT_REGION_ID;
  const response = await medusa.store.product.list({
    handle,
    region_id: regionId,
    fields: "*variants.calculated_price,+metadata,+tags",
  });

  return ((response.products ?? [])[0] ?? null) as StoreProduct | null;
}

