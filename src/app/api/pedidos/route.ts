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

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

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

  const updated = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}
