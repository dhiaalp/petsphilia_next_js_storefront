const TELEGRAM_API = "https://api.telegram.org";

export async function notifyWhatsApp(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("Telegram notification skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await res.text();
    if (!res.ok) {
      console.error("Telegram API error:", res.status, data);
    } else {
      console.log("Telegram notification sent");
    }
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}
