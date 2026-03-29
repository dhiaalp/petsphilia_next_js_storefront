const WHATSAPP_API = "https://graph.facebook.com/v22.0";

export async function notifyWhatsApp(_message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER || "971585573621";

  if (!token || !phoneNumberId) {
    console.log("WhatsApp notification skipped: missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      }),
    });

    const data = await res.text();
    if (!res.ok) {
      console.error("WhatsApp API error:", res.status, data);
    } else {
      console.log("WhatsApp notification sent:", data);
    }
  } catch (err) {
    console.error("WhatsApp notification failed:", err);
  }
}
