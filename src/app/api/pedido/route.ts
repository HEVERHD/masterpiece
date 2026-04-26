import { NextResponse } from "next/server";
import twilio from "twilio";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

function normalizePhone(phone: string): string {
  const raw = phone.trim();
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (raw.startsWith("+")) return `+${digits}`;
  return `+57${digits}`;
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_URL ?? "https://masterpiece-brown.vercel.app";
}

export async function POST(req: Request) {
  try {
    const {
      productId,
      productName,
      size,
      price,
      customerName,
      customerPhone,
      deliveryType,
      address,
      city,
      carrier,
      message,
    } = await req.json();

    if (!customerName || !customerPhone || !productName) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Guardar pedido en BD (stock NO se toca hasta que admin confirme pago)
    const order = await prisma.order.create({
      data: {
        productId: productId ?? null,
        productName,
        size: size ?? null,
        price,
        customerName,
        customerPhone: normalizePhone(customerPhone),
        deliveryType,
        address: address ?? null,
        city: city ?? null,
        carrier: carrier ?? null,
        message: message ?? null,
      },
    });

    const trackingUrl = `${baseUrl()}/pedido/${order.id}`;

    // Construir textos
    const sizeText = size ? `📏 Talla: *${size}*\n` : "";
    const deliveryText =
      deliveryType === "domicilio"
        ? `🛵 Domicilio en Cartagena\n📍 ${address}\n`
        : deliveryType === "envio_nacional"
        ? `📦 Envío nacional vía *${carrier === "interrapidisimo" ? "Interrapidísimo" : "Envía"}*\n🏙️ Ciudad: ${city}\n📍 ${address}\n`
        : `🏪 Recoge en tienda\n📍 ${address}\n`;
    const questionText = message ? `\n💬 "${message}"\n` : "";

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    // 1️⃣ WhatsApp al cliente (con link de seguimiento)
    const to = `whatsapp:${normalizePhone(customerPhone)}`;
    if (process.env.TWILIO_CONTENT_SID) {
      await twilioClient.messages.create({
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
        `\n🔗 Sigue tu pedido aquí:\n${trackingUrl}\n` +
        `\nEn breve te contactamos para coordinar el pago.\n` +
        `— Masterpiece CTG, Cartagena 🇨🇴`;
      await twilioClient.messages.create({ from, to, body: clientBody });
    }

    // 2️⃣ WhatsApp al admin
    if (process.env.ADMIN_WHATSAPP) {
      const adminTo = `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`;
      const adminBody =
        `🛒 *Nuevo pedido — Masterpiece CTG*\n\n` +
        `👤 *${customerName}*\n` +
        `📞 ${normalizePhone(customerPhone)}\n\n` +
        `👕 *${productName}*\n` +
        sizeText +
        `💰 ${price}\n` +
        deliveryText +
        questionText +
        `\n📋 ${trackingUrl}`;
      await twilioClient.messages.create({ from, to: adminTo, body: adminBody });
    }

    // 3️⃣ Push notification al admin
    const subscriptions = await prisma.pushSubscription.findMany();
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "🛒 Nuevo pedido",
            body: `${customerName} quiere ${productName}${size ? ` — ${size}` : ""}`,
            url: "/admin/pedidos",
          })
        )
      )
    );

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error("[PEDIDO ERROR]", err);
    return NextResponse.json({ error: "No se pudo enviar el pedido" }, { status: 500 });
  }
}
