import { NextResponse } from "next/server";
import twilio from "twilio";

// Twilio sends webhooks as application/x-www-form-urlencoded
// Next.js App Router parses formData natively — no extra config needed.

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+57${digits}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const from        = (formData.get("From")        as string) ?? "";   // "whatsapp:+57XXXXXXXXXX"
    const body        = (formData.get("Body")        as string) ?? "";
    const profileName = (formData.get("ProfileName") as string) ?? "";
    const numMedia    = parseInt((formData.get("NumMedia") as string) ?? "0", 10);

    // Ignorar mensajes que vengan del propio número de Twilio (evita bucles)
    const twilioFrom = (process.env.TWILIO_WHATSAPP_FROM ?? "").replace(/[\s\-().+]/g, "");
    const senderNum  = from.replace("whatsapp:", "").replace(/[\s\-().+]/g, "");
    if (twilioFrom && senderNum.endsWith(twilioFrom.replace(/^\+/, ""))) {
      return twimlOk();
    }

    if (process.env.ADMIN_WHATSAPP && process.env.TWILIO_ACCOUNT_SID) {
      const client    = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const fromPhone = from.replace("whatsapp:", "");
      const name      = profileName || fromPhone;

      const lines: string[] = [
        `📨 *Nuevo mensaje — Masterpiece CTG*`,
        ``,
        `👤 *${name}*`,
      ];
      if (profileName) lines.push(`📞 ${fromPhone}`);
      if (body)        lines.push(``, `💬 "${body}"`);
      if (numMedia > 0) lines.push(`📎 Envió ${numMedia} archivo(s)`);
      lines.push(``, `_Para responder escríbele directamente a:_`, fromPhone);

      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        to:   `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`,
        body: lines.join("\n"),
      });
    }
  } catch (err) {
    console.error("[WEBHOOK TWILIO]", err);
  }

  return twimlOk();
}

// Twilio requiere una respuesta TwiML válida (aunque esté vacía)
function twimlOk() {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
