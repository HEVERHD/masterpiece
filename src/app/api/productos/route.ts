import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const sizeSchema = z.object({
  size: z.string().min(1),
  stock: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  categoryId: z.string().min(1, "La categoria es requerida"),
  isVisible: z.boolean().default(true),
  sizes: z.array(sizeSchema).default([]),
  images: z.array(z.string().url()).default([]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const size = searchParams.get("size") ?? "";
  const adminView = searchParams.get("admin") === "true";

  try {
    const where: Record<string, unknown> = {};

    if (!adminView) where.isVisible = true;

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (category) {
      where.category = { slug: category };
    }

    if (size) {
      where.sizes = {
        some: { size, stock: { gt: 0 } },
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        isVisible: data.isVisible,
        sizes: {
          create: data.sizes.map((s) => ({ ...s, id: undefined })),
        },
        images: {
          create: data.images.map((url, order) => ({ url, order })),
        },
      },
      include: {
        category: true,
        images: true,
        sizes: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
