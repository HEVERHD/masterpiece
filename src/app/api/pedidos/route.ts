import { NextResponse } from "next/server";
import twilio from "twilio";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

const STORE_ADDRESS = "Campestre mz 82 lote 3 etapa 8, Cartagena, Colombia";

async function sendCustomerUpdate(
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    size: string | null;
    price: string;
    deliveryType: string;
    carrier: string | null;
    city: string | null;
  },
  newStatus: "PAGADO" | "ENVIADO"
) {
  if (!process.env.TWILIO_ACCOUNT_SID) return;

  const client      = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const from        = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
  const to          = `whatsapp:${normalizePhone(order.customerPhone)}`;
  const trackingUrl = `${baseUrl()}/pedido/${order.id}`;
  const storeUrl    = baseUrl();

  const isTienda    = order.deliveryType === "tienda";
  const isDomicilio = order.deliveryType === "domicilio";

  const sizeVar     = order.size ? ` — Talla ${order.size}` : "";

  if (newStatus === "PAGADO") {
    const nextStep = isTienda
      ? "🏪 Estamos preparando tu pedido para que lo recojas en nuestra tienda en Cartagena. Te avisamos cuando este listo."
      : isDomicilio
        ? "🛵 Pronto te contactamos para coordinar la entrega a domicilio."
        : "📦 En breve te enviamos los detalles del envio.";
    const trackingVar = isTienda ? storeUrl : trackingUrl;

    // Si hay plantilla aprobada, usarla (evita el bloqueo de 24h)
    if (process.env.TWILIO_CONTENT_SID_PAGADO) {
      await client.messages.create({
        from,
        to,
        contentSid: process.env.TWILIO_CONTENT_SID_PAGADO,
        contentVariables: JSON.stringify({
          "1": order.customerName,
          "2": order.productName,
          "3": sizeVar,
          "4": order.price,
          "5": nextStep,
          "6": isTienda ? `Visita nuestra tienda en Cartagena: ${storeUrl}` : `🔗 Sigue tu pedido: ${trackingVar}`,
        }),
      });
      return;
    }

    // Fallback: mensaje libre (solo funciona dentro de la ventana de 24h)
    const sizeText = order.size ? `\n📏 Talla: *${order.size}*` : "";
    await client.messages.create({
      from,
      to,
      body:
        `Hola ${order.customerName} 👋\n\n` +
        `✅ *¡Pago confirmado!*\n\n` +
        `Tu pedido en *Masterpiece CTG* está siendo preparado:\n` +
        `👕 *${order.productName}*${sizeText}\n` +
        `💰 ${order.price}\n\n` +
        `${nextStep}\n\n` +
        (!isTienda ? `🔗 Sigue el estado de tu pedido:\n${trackingVar}\n\n` : "") +
        `— Masterpiece CTG 🇨🇴`,
    });
    return;
  }

  // ENVIADO
  const carrierName =
    order.carrier === "interrapidisimo" ? "Interrapidísimo" :
    order.carrier === "envia"           ? "Envía"           : null;

  const shipVar = isTienda
    ? "🏪 Te esperamos en la tienda en Cartagena. Si necesitas la direccion, escribenos."
    : isDomicilio
      ? "🛵 El domicilio ya va en ruta hacia ti."
      : carrierName
        ? `📦 Va por ${carrierName}${order.city ? ` con destino a ${order.city}` : ""}.`
        : "📦 Pedido despachado.";

  const statusTitle = isTienda
    ? "🏪 ¡Ya puedes venir a recogerlo, esta listo!"
    : isDomicilio
      ? "🛵 ¡Tu pedido esta en camino!"
      : "📦 ¡Tu pedido fue despachado!";

  // Tienda: plantilla con dirección física + URL de la tienda
  if (isTienda && process.env.TWILIO_CONTENT_SID_ENVIADO_TIENDA) {
    await client.messages.create({
      from,
      to,
      contentSid: process.env.TWILIO_CONTENT_SID_ENVIADO_TIENDA,
      contentVariables: JSON.stringify({
        "1": order.customerName,
        "2": order.productName,
        "3": sizeVar,
        "4": order.price,
        "5": STORE_ADDRESS,
        "6": storeUrl,
      }),
    });
    return;
  }

  // Domicilio / envío nacional: plantilla con tracking URL
  if (!isTienda && process.env.TWILIO_CONTENT_SID_ENVIADO) {
    await client.messages.create({
      from,
      to,
      contentSid: process.env.TWILIO_CONTENT_SID_ENVIADO,
      contentVariables: JSON.stringify({
        "1": order.customerName,
        "2": order.productName,
        "3": sizeVar,
        "4": order.price,
        "5": shipVar,
        "6": trackingUrl,
        "7": storeUrl,
      }),
    });
    return;
  }

  // Fallback: mensaje libre
  const sizeText = order.size ? `\n📏 Talla: *${order.size}*` : "";
  await client.messages.create({
    from,
    to,
    body:
      `Hola ${order.customerName} 👋\n\n` +
      `${statusTitle}\n\n` +
      `👕 *${order.productName}*${sizeText}\n` +
      `💰 ${order.price}\n\n` +
      `${shipVar}\n\n` +
      (isTienda ? `📍 *${STORE_ADDRESS}*\n\n` : `🔗 Sigue el estado aquí:\n${trackingUrl}\n\n`) +
      `¡Gracias por tu compra! 🙌 Seguimos con más ropa para ti:\n` +
      `👉 ${storeUrl}\n\n` +
      `— Masterpiece CTG 🇨🇴`,
  });
}

async function sendLowStockAlert(productName: string, size: string, remaining: number) {
  const label = remaining === 0 ? `¡Agotado! 🚨` : `Solo queda ${remaining} unidad ⚠️`;
  const body  = `${label}\n${productName} — Talla ${size}`;

  // Push al admin
  const subscriptions = await prisma.pushSubscription.findMany();
  initWebPush();
  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: "📦 Stock bajo", body, url: "/admin/productos" })
      )
    )
  );

  // WhatsApp al admin
  if (process.env.ADMIN_WHATSAPP && process.env.TWILIO_ACCOUNT_SID) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to:   `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`,
      body: `📦 *Alerta de stock — Masterpiece CTG*\n\n${body}`,
    }).catch(console.error);
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { id, status, note } = body as { id?: string; status?: string; note?: string };

  if (!id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  // Note-only update
  if (note !== undefined && !status) {
    const updated = await prisma.order.update({ where: { id }, data: { adminNote: note } });
    return NextResponse.json(updated);
  }

  if (!status) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  // Al confirmar pago → decrementar stock
  if (status === "PAGADO" && order.status === "PENDIENTE") {
    if (order.productId && order.size) {
      const productSize = await prisma.productSize.findUnique({
        where: { productId_size: { productId: order.productId, size: order.size } },
      });
      if (!productSize || productSize.stock <= 0) {
        return NextResponse.json({ error: "Sin stock disponible para esta talla" }, { status: 409 });
      }
      await prisma.productSize.update({
        where: { productId_size: { productId: order.productId, size: order.size } },
        data: { stock: { decrement: 1 } },
      });

      // Alerta de stock bajo (0 o 1 unidad restante)
      const remaining = productSize.stock - 1;
      if (remaining <= 1) {
        await sendLowStockAlert(order.productName, order.size, remaining).catch(console.error);
      }
    }
  }

  // Al cancelar un pedido ya pagado → restaurar stock
  if (status === "CANCELADO" && order.status === "PAGADO") {
    if (order.productId && order.size) {
      await prisma.productSize.update({
        where: { productId_size: { productId: order.productId, size: order.size } },
        data: { stock: { increment: 1 } },
      });
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data:  { status: status as "PENDIENTE" | "PAGADO" | "ENVIADO" | "CANCELADO" },
  });

  // Confirmación WhatsApp al comprador en PAGADO y ENVIADO
  if (
    (status === "PAGADO"  && order.status === "PENDIENTE") ||
    (status === "ENVIADO" && order.status === "PAGADO")
  ) {
    sendCustomerUpdate(order, status as "PAGADO" | "ENVIADO").catch((err) =>
      console.error("[WA CONFIRMACION]", err)
    );
  }

  return NextResponse.json(updated);
}
