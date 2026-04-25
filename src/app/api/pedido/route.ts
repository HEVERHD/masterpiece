import { NextResponse } from "next/server";
import twilio from "twilio";

// Normaliza el número: quita espacios/guiones y asegura formato internacional
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function POST(req: Request) {
  try {
    const { productName, size, price, customerName, customerPhone, message } =
      await req.json();

    if (!customerName || !customerPhone || !productName) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const to = `whatsapp:${normalizePhone(customerPhone)}`;
    const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    // Si hay plantilla aprobada, la usamos (producción)
    // Si no, enviamos texto libre (sandbox / pruebas)
    if (process.env.TWILIO_CONTENT_SID) {
      await client.messages.create({
        from,
        to,
        contentSid: process.env.TWILIO_CONTENT_SID,
        contentVariables: JSON.stringify({
          "1": customerName,
          "2": productName,
          "3": size ?? "Única",
          "4": price,
          "5": message || "",
        }),
      });
    } else {
      const sizeText = size ? `📏 Talla: *${size}*\n` : "";
      const questionText = message ? `\n💬 Tu consulta: "${message}"\n` : "";
      const body =
        `Hola ${customerName} 👋\n\n` +
        `Recibimos tu pedido en *Masterpiece CTG*:\n\n` +
        `👕 *${productName}*\n` +
        sizeText +
        `💰 ${price}\n` +
        questionText +
        `\nEn breve te contactamos para coordinar.\n` +
        `— Masterpiece CTG, Cartagena 🇨🇴`;

      await client.messages.create({ from, to, body });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PEDIDO ERROR]", err);
    return NextResponse.json({ error: "No se pudo enviar el pedido" }, { status: 500 });
  }
}
