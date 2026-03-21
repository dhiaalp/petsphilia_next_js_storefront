import crypto from "node:crypto";
import { NextRequest } from "next/server";

const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";
const accessToken = process.env.META_CONVERSIONS_API_TOKEN ?? "";
const apiVersion = process.env.META_CONVERSIONS_API_VERSION ?? "v22.0";

type MetaEventInput = {
  eventName: "AddToCart" | "InitiateCheckout" | "Purchase";
  req: NextRequest;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  numItems?: number;
  eventId?: string;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value?: string) {
  return value?.replace(/[^\d]/g, "") ?? "";
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

export async function sendMetaEvent(input: MetaEventInput) {
  if (!pixelId || !accessToken) {
    return;
  }

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        event_id: input.eventId,
        user_data: {
          ...(input.email ? { em: [sha256(normalizeEmail(input.email))] } : {}),
          ...(input.phone ? { ph: [sha256(normalizePhone(input.phone))] } : {}),
          ...(input.firstName ? { fn: [sha256(normalizeText(input.firstName))] } : {}),
          ...(input.lastName ? { ln: [sha256(normalizeText(input.lastName))] } : {}),
          ...(input.city ? { ct: [sha256(normalizeText(input.city))] } : {}),
          ...(input.country ? { country: [sha256(normalizeText(input.country))] } : {}),
          ...(getClientIp(input.req) ? { client_ip_address: getClientIp(input.req) } : {}),
          ...(input.req.headers.get("user-agent")
            ? { client_user_agent: input.req.headers.get("user-agent") }
            : {}),
        },
        custom_data: {
          ...(typeof input.value === "number" ? { value: input.value } : {}),
          ...(input.currency ? { currency: input.currency.toUpperCase() } : {}),
          ...(input.contentName ? { content_name: input.contentName } : {}),
          ...(input.contentIds?.length ? { content_ids: input.contentIds } : {}),
          ...(typeof input.numItems === "number" ? { num_items: input.numItems } : {}),
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`,
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
      console.error("Meta CAPI request failed:", response.status, errorText);
    }
  } catch (error) {
    console.error("Meta CAPI event failed:", error);
  }
}
