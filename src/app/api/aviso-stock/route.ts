import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+57${digits}`;
}

export async function POST(req: Request) {
  try {
    const { productId, productName, size, phone } = await req.json();

    if (!productId || !productName || !phone) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Save alert
    await prisma.stockAlert.create({
      data: {
        productId,
        productName,
        size:  size ?? null,
        phone: normalizePhone(phone),
      },
    });

    // Notify admin via WhatsApp (best-effort)
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.ADMIN_WHATSAPP) {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        const body =
          `🔔 *Aviso de stock — Masterpiece CTG*\n\n` +
          `Un cliente quiere saber cuando vuelva:\n` +
          `👕 *${productName}*${size ? `\n📏 Talla: *${size}*` : ""}\n` +
          `📞 ${normalizePhone(phone)}`;
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
          to:   `whatsapp:${normalizePhone(process.env.ADMIN_WHATSAPP)}`,
          body,
        });
      }
    } catch (err) {
      console.error("[AVISO STOCK TWILIO]", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[AVISO STOCK ERROR]", err);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
