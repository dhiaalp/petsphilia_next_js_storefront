import { NextRequest } from "next/server";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
const apiSecret = process.env.GA_API_SECRET ?? "";

type GAItem = {
  item_id: string;
  item_name?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type GAEventInput = {
  req: NextRequest;
  name: "add_to_cart" | "begin_checkout" | "purchase";
  clientId?: string;
  userId?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  items?: GAItem[];
};

function getClientId(req: NextRequest) {
  const gaCookie = req.cookies.get("_ga")?.value;

  if (!gaCookie) {
    return undefined;
  }

  const parts = gaCookie.split(".");
  if (parts.length < 4) {
    return undefined;
  }

  return `${parts[2]}.${parts[3]}`;
}

export async function sendGAEvent(input: GAEventInput) {
  if (!measurementId || !apiSecret) {
    return;
  }

  const clientId = input.clientId || getClientId(input.req);

  if (!clientId) {
    return;
  }

  const payload = {
    client_id: clientId,
    ...(input.userId ? { user_id: input.userId } : {}),
    events: [
      {
        name: input.name,
        params: {
          ...(typeof input.value === "number" ? { value: input.value } : {}),
          ...(input.currency ? { currency: input.currency.toUpperCase() } : {}),
          ...(input.transactionId ? { transaction_id: input.transactionId } : {}),
          ...(input.items?.length ? { items: input.items } : {}),
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("GA Measurement Protocol request failed:", response.status, errorText);
    }
  } catch (error) {
    console.error("GA Measurement Protocol event failed:", error);
  }
}
