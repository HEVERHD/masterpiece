import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json([]);

  const combos = await prisma.productCombo.findMany({
    where: { productId },
    include: {
      related: {
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
      },
    },
  });
  return NextResponse.json(
    combos.map((c) => ({
      id:       c.related.id,
      name:     c.related.name,
      price:    Number(c.related.price),
      imageUrl: c.related.images[0]?.url ?? null,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId, relatedId } = await req.json();
  if (!productId || !relatedId || productId === relatedId)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await prisma.productCombo.upsert({
    where:  { productId_relatedId: { productId, relatedId } },
    update: {},
    create: { productId, relatedId },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId, relatedId } = await req.json();
  await prisma.productCombo.delete({
    where: { productId_relatedId: { productId, relatedId } },
  });
  return NextResponse.json({ ok: true });
}
