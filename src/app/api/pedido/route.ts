import { NextResponse } from "next/server";
import twilio from "twilio";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

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
      items,
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

    // 1️⃣ Guardar pedido — esto SIEMPRE debe funcionar
    const order = await prisma.order.create({
      data: {
        productId:     productId ?? null,
        productName,
        size:          size ?? null,
        price,
        items:         items ?? undefined,
        customerName,
        customerPhone: normalizePhone(customerPhone),
        deliveryType,
        address:       address ?? null,
        city:          city ?? null,
        carrier:       carrier ?? null,
        message:       message ?? null,
      },
    });

    // 2️⃣ Notificaciones — fallos aquí NO cancelan el pedido
    const trackingUrl = `${baseUrl()}/pedido/${order.id}`;

    const multiItems = Array.isArray(items) && items.length > 1;
    const itemsText  = multiItems
      ? (items as Array<{ productName: string; size: string | null; price: string }>)
          .map((it, i) => `${i + 1}. *${it.productName}*${it.size ? ` — ${it.size}` : ""} — ${it.price}`)
          .join("\n") + "\n"
      : `👕 *${productName}*\n${size ? `📏 Talla: *${size}*\n` : ""}`;

    const deliveryText =
      deliveryType === "domicilio"
        ? `🛵 Domicilio en Cartagena\n📍 ${address}\n`
        : deliveryType === "envio_nacional"
        ? `📦 Envío nacional vía *${carrier === "interrapidisimo" ? "Interrapidísimo" : "Envía"}*\n🏙️ Ciudad: ${city}\n📍 ${address}\n`
        : `🏪 Recoge en tienda\n📍 ${address}\n`;
    const questionText = message ? `\n💬 "${message}"\n` : "";

    // WhatsApp (no lanza error hacia el cliente si falla)
    try {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
      const to   = `whatsapp:${normalizePhone(customerPhone)}`;

      // Mensaje al cliente
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
          itemsText +
          `💰 ${price}\n` +
          deliveryText +
          questionText +
          `\n🔗 Sigue tu pedido aquí:\n${trackingUrl}\n` +
          `\nEn breve te contactamos para coordinar el pago.\n` +
          `— Masterpiece CTG, Cartagena 🇨🇴`;
        await twilioClient.messages.create({ from, to, body: clientBody });
      }

      // Mensaje al admin
      if (process.env.ADMIN_WHATSAPP) {
        const adminTo   = `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`;
        const adminBody =
          `🛒 *Nuevo pedido — Masterpiece CTG*\n\n` +
          `👤 *${customerName}*\n` +
          `📞 ${normalizePhone(customerPhone)}\n\n` +
          itemsText +
          `💰 ${price}\n` +
          deliveryText +
          questionText +
          `\n📋 ${trackingUrl}`;
        await twilioClient.messages.create({ from, to: adminTo, body: adminBody });
      }
    } catch (twilioErr) {
      console.error("[TWILIO ERROR]", twilioErr);
      // El pedido ya está guardado — no fallamos el request
    }

    // Push notification al admin
    try {
      initWebPush();
      const subscriptions = await prisma.pushSubscription.findMany();
      await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "🛒 Nuevo pedido",
              body: `${customerName} — ${productName}${size ? ` (${size})` : ""}`,
              url: "/admin/pedidos",
            })
          )
        )
      );
    } catch (pushErr) {
      console.error("[PUSH ERROR]", pushErr);
    }

    return NextResponse.json({ ok: true, orderId: order.id });

  } catch (err) {
    console.error("[PEDIDO ERROR]", err);
    return NextResponse.json({ error: "No se pudo guardar el pedido" }, { status: 500 });
  }
}
