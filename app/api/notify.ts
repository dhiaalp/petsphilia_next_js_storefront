const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export async function notifyWhatsApp(message: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toNumber = process.env.WHATSAPP_TO_NUMBER || "971585573621";

  if (!token || !phoneNumberId) return;

  try {
    await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (err) {
    console.error("WhatsApp notification failed:", err);
  }
}
