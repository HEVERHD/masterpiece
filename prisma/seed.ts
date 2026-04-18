import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TALLAS_BERMUDA = ["30", "32", "34", "36", "38", "40"];
const TALLAS_ROPA = ["S", "M", "L", "XL", "XXL"];
const TALLAS_CHANCLA_ALTA = ["39/40", "41/42", "43/44"];
const TALLAS_CHANCLA_MULTI = ["39", "40", "41", "42", "43", "44", "45", "46"];

const categorias = [
  {
    name: "Bermudas",
    slug: "bermudas",
    productos: [
      { name: "Bermuda de Jean",    tallas: TALLAS_BERMUDA },
      { name: "Bermuda Corta Dril", tallas: TALLAS_BERMUDA },
      { name: "Bermuda Cargo Dril", tallas: TALLAS_BERMUDA },
      { name: "Bermuda Cargo Jean", tallas: TALLAS_BERMUDA },
    ],
  },
  {
    name: "Camisetas",
    slug: "camisetas",
    productos: [
      { name: "Camiseta Altagama",    tallas: TALLAS_ROPA },
      { name: "Camiseta Top Q",       tallas: TALLAS_ROPA },
      { name: "Camiseta Multimarca",  tallas: TALLAS_ROPA },
      { name: "Camisa",               tallas: TALLAS_ROPA },
      { name: "Franela",              tallas: TALLAS_ROPA },
    ],
  },
  {
    name: "Chanclas",
    slug: "chanclas",
    productos: [
      { name: "Chancla Altagama",   tallas: TALLAS_CHANCLA_ALTA  },
      { name: "Chancla Multimarca", tallas: TALLAS_CHANCLA_MULTI },
    ],
  },
];

async function main() {
  console.log("Iniciando seed...\n");

  for (const cat of categorias) {
    const categoria = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });

    console.log(`✔ Categoría: ${categoria.name}`);

    for (const prod of cat.productos) {
      const producto = await prisma.product.upsert({
        where: {
          // upsert por nombre + categoría (no hay unique en name, usamos findFirst fallback)
          id: (
            await prisma.product.findFirst({
              where: { name: prod.name, categoryId: categoria.id },
            })
          )?.id ?? "nuevo",
        },
        update: {},
        create: {
          name:       prod.name,
          price:      0,
          categoryId: categoria.id,
          isVisible:  false,   // oculto hasta que se carguen imágenes y precio
          sizes: {
            create: prod.tallas.map((t) => ({ size: t, stock: 0 })),
          },
        },
      });

      console.log(`   └─ ${producto.name} (${prod.tallas.join(", ")})`);
    }
  }

  console.log("\nSeed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
