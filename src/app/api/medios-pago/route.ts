import { NextResponse } from "next/server";
import twilio from "twilio";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+57${digits}`;
}

const MEDIOS_PAGO = `
💵 *Efectivo*

💳 *Todas las tarjetas*

🏦 *Transferencia Bancolombia*
Cuenta Ahorro: 91289105137
A nombre de: Darío Marín

📱 *Bre-B / Llave*
@rubenm3453

📲 *Daviplata*
3244224868

📋 *SISTECREDITO* — financiamiento disponible ✔️
`.trim();

export async function POST(req: Request) {
  try {
    const { phone, customerName } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 });
    }

    if (!process.env.TWILIO_ACCOUNT_SID) {
      return NextResponse.json({ error: "Twilio no configurado" }, { status: 500 });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const body =
      `Hola ${customerName ?? ""}! 👋\n\n` +
      `💳 *Métodos de pago — Masterpiece CTG*\n\n` +
      `${MEDIOS_PAGO}\n\n` +
      `Una vez realices el pago, envía tu comprobante al WhatsApp de Masterpiece y en minutos confirmamos tu pedido. ✅\n` +
      `— Masterpiece CTG 🇨🇴`;

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to:   `whatsapp:${normalizePhone(phone)}`,
      body,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[MEDIOS PAGO ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
