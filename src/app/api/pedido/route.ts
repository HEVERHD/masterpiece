import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().+]/g, "");
  // If it already has a full international prefix (starts with +), use as-is
  const raw = phone.trim();
  if (raw.startsWith("+")) return `+${digits}`;
  // Default to Colombia (+57)
  return `+57${digits}`;
}

export async function POST(req: Request) {
  try {
    const { productId, productName, size, price, customerName, customerPhone, deliveryType, address, city, carrier, message } =
      await req.json();

    if (!customerName || !customerPhone || !productName) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Decrementar stock de la talla seleccionada
    if (productId && size) {
      const productSize = await prisma.productSize.findUnique({
        where: { productId_size: { productId, size } },
      });

      if (!productSize || productSize.stock <= 0) {
        return NextResponse.json(
          { error: "Lo sentimos, esta talla se agotó justo ahora." },
          { status: 409 }
        );
      }

      await prisma.productSize.update({
        where: { productId_size: { productId, size } },
        data: { stock: { decrement: 1 } },
      });
    }

    // Enviar WhatsApp
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const to = `whatsapp:${normalizePhone(customerPhone)}`;
    const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    const sizeText = size ? `📏 Talla: *${size}*\n` : "";
    const deliveryText =
      deliveryType === "domicilio"
        ? `🛵 Domicilio en Cartagena\n📍 ${address}\n`
        : deliveryType === "envio_nacional"
        ? `📦 Envío nacional vía *${carrier === "interrapidisimo" ? "Interrapidísimo" : "Envía"}*\n🏙️ Ciudad: ${city}\n📍 ${address}\n`
        : `🏪 Recoge en tienda\n📍 ${address}\n`;
    const questionText = message ? `\n💬 "${message}"\n` : "";

    // 1️⃣ Mensaje al cliente (confirmación de pedido)
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
      const clientBody =
        `Hola ${customerName} 👋\n\n` +
        `Recibimos tu pedido en *Masterpiece CTG*:\n\n` +
        `👕 *${productName}*\n` +
        sizeText +
        `💰 ${price}\n` +
        deliveryText +
        questionText +
        `\nEn breve te contactamos para coordinar.\n` +
        `— Masterpiece CTG, Cartagena 🇨🇴`;

      await client.messages.create({ from, to, body: clientBody });
    }

    // 2️⃣ Notificación al admin (Ruben)
    if (process.env.ADMIN_WHATSAPP) {
      const adminTo = `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`;
      const adminBody =
        `🛒 *Nuevo pedido — Masterpiece CTG*\n\n` +
        `👤 Cliente: *${customerName}*\n` +
        `📞 Teléfono: ${normalizePhone(customerPhone)}\n\n` +
        `👕 *${productName}*\n` +
        sizeText +
        `💰 ${price}\n` +
        deliveryText +
        questionText;

      await client.messages.create({ from, to: adminTo, body: adminBody });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PEDIDO ERROR]", err);
    return NextResponse.json({ error: "No se pudo enviar el pedido" }, { status: 500 });
  }
}
