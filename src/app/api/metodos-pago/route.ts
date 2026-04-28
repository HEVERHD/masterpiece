import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ── Public: list active methods ──────────────────────────────
export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where:   { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(methods);
}

// ── Admin: create ────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { title, subtitle, value, appLink } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Falta el título" }, { status: 400 });

  const last = await prisma.paymentMethod.findFirst({ orderBy: { order: "desc" } });

  const method = await prisma.paymentMethod.create({
    data: {
      title:    title.trim(),
      subtitle: subtitle?.trim() || null,
      value:    value?.trim()    || null,
      appLink:  appLink?.trim()  || null,
      order:    (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(method);
}

// ── Admin: update ────────────────────────────────────────────
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, title, subtitle, value, appLink, active, order } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const method = await prisma.paymentMethod.update({
    where: { id },
    data: {
      ...(title    !== undefined ? { title:    title.trim()             } : {}),
      ...(subtitle !== undefined ? { subtitle: subtitle?.trim() || null } : {}),
      ...(value    !== undefined ? { value:    value?.trim()    || null } : {}),
      ...(appLink  !== undefined ? { appLink:  appLink?.trim()  || null } : {}),
      ...(active   !== undefined ? { active                             } : {}),
      ...(order    !== undefined ? { order                              } : {}),
    },
  });
  return NextResponse.json(method);
}

// ── Admin: delete ────────────────────────────────────────────
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  await prisma.paymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
