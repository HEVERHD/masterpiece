import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  categoryId: z.string().min(1).optional(),
  isVisible: z.boolean().optional(),
  sizes: z
    .array(z.object({ size: z.string(), stock: z.number().int().min(0) }))
    .optional(),
  images: z.array(z.string().url()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    if (data.sizes !== undefined) {
      await prisma.productSize.deleteMany({ where: { productId: id } });
      updateData.sizes = {
        create: data.sizes,
      };
    }

    if (data.images !== undefined) {
      await prisma.image.deleteMany({ where: { productId: id } });
      updateData.images = {
        create: data.images.map((url, i) => ({ url, order: i })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
