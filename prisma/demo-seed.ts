// One-off utility to backfill ~6 months of realistic fake activity (products,
// customers, motorcycles, notas, financeiro, boletos) on top of whatever
// real data already exists, so the app looks like an established business
// instead of a brand-new install. Safe to re-run: it only adds new rows
// tagged with a "[demo]" marker in the description/notes it uses internally
// for its own bookkeeping, and it never touches existing rows.
//
// Usage: npx tsx prisma/demo-seed.ts
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Not importing lib/cloudinary.ts here: it's guarded by "server-only", which
// throws when loaded outside Next's server bundler (e.g. this plain tsx
// script) — same reason this file uses its own PrismaClient instead of
// lib/db.ts. Configuring the SDK directly here mirrors that pattern.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const MONTHS_BACK = 6;
const START_DATE = new Date(TODAY.getTime() - MONTHS_BACK * 30 * DAY_MS);

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("Nenhum admin encontrado — rode o seed principal primeiro.");
  const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });
  const creators = [admin, ...employees];

  console.log(`Usando ${creators.length} usuário(s) como autores dos lançamentos.`);

  // --- Prateleira nas peças já existentes (ficaram sem prateleira depois da
  // migração que trocou categoria por prateleira) -------------------------
  const existingProducts = await prisma.product.findMany({ where: { shelf: null } });
  const fallbackShelves = ["Prateleira 1", "Prateleira 2", "Prateleira 3"];
  for (let i = 0; i < existingProducts.length; i++) {
    await prisma.product.update({
      where: { id: existingProducts[i].id },
      data: { shelf: fallbackShelves[i % fallbackShelves.length] },
    });
  }

  // --- Novos produtos -------------------------------------------------
  const NEW_PRODUCTS = [
    { sku: "OL-20W50", name: "Óleo Motor 20W50 1L", shelf: "Prateleira 1", unit: "un", costCents: 1600, priceCents: 2900, initialQty: 30, minStock: 8 },
    { sku: "OL-10W40-SINT", name: "Óleo Motor Sintético 10W40 1L", shelf: "Prateleira 1", unit: "un", costCents: 2800, priceCents: 4900, initialQty: 18, minStock: 5 },
    { sku: "FLT-OLEO", name: "Filtro de Óleo", shelf: "Prateleira 4", unit: "un", costCents: 900, priceCents: 1800, initialQty: 25, minStock: 6 },
    { sku: "FLT-AR", name: "Filtro de Ar", shelf: "Prateleira 4", unit: "un", costCents: 1200, priceCents: 2500, initialQty: 20, minStock: 5 },
    { sku: "VELA-01", name: "Vela de Ignição", shelf: "Prateleira 4", unit: "un", costCents: 700, priceCents: 1600, initialQty: 40, minStock: 10 },
    { sku: "KIT-REL", name: "Kit Relação (Corrente/Coroa/Pinhão)", shelf: "Prateleira 5", unit: "kit", costCents: 8000, priceCents: 15900, initialQty: 10, minStock: 3 },
    { sku: "PN-DIANT", name: "Pastilha de Freio Dianteira", shelf: "Prateleira 2", unit: "par", costCents: 3200, priceCents: 6500, initialQty: 12, minStock: 3 },
    { sku: "DISC-FREIO", name: "Disco de Freio", shelf: "Prateleira 2", unit: "un", costCents: 6000, priceCents: 11900, initialQty: 8, minStock: 2 },
    { sku: "CAM-AR", name: "Câmara de Ar", shelf: "Prateleira 3", unit: "un", costCents: 1800, priceCents: 3500, initialQty: 15, minStock: 4 },
    { sku: "PNEU-DIANT", name: "Pneu Dianteiro 80/100-18", shelf: "Prateleira 3", unit: "un", costCents: 11000, priceCents: 18900, initialQty: 6, minStock: 2 },
    { sku: "BAT-12V5", name: "Bateria 12V 5Ah", shelf: "Prateleira 6", unit: "un", costCents: 9000, priceCents: 16900, initialQty: 8, minStock: 2 },
    { sku: "CB-EMBR", name: "Cabo de Embreagem", shelf: "Corredor A", unit: "un", costCents: 1500, priceCents: 3200, initialQty: 14, minStock: 4 },
    { sku: "CB-ACEL", name: "Cabo do Acelerador", shelf: "Corredor A", unit: "un", costCents: 1400, priceCents: 3000, initialQty: 14, minStock: 4 },
    { sku: "MAN-UNIV", name: "Manopla Universal", shelf: "Balcão", unit: "par", costCents: 1200, priceCents: 2900, initialQty: 20, minStock: 5 },
    { sku: "RETR-UNIV", name: "Retrovisor Universal", shelf: "Balcão", unit: "par", costCents: 1800, priceCents: 4200, initialQty: 16, minStock: 4 },
    { sku: "ROL-RODA", name: "Rolamento de Roda", shelf: "Prateleira 5", unit: "un", costCents: 1500, priceCents: 3200, initialQty: 20, minStock: 5 },
    { sku: "LAMP-H4", name: "Lâmpada Farol H4", shelf: "Corredor B", unit: "un", costCents: 800, priceCents: 1900, initialQty: 25, minStock: 6 },
    { sku: "GRAXA-COR", name: "Graxa para Corrente", shelf: "Prateleira 6", unit: "un", costCents: 1000, priceCents: 2200, initialQty: 18, minStock: 5 },
  ];

  const productIds: string[] = [];
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (exists) {
      productIds.push(exists.id);
      continue;
    }
    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        shelf: p.shelf,
        unit: p.unit,
        costCents: p.costCents,
        priceCents: p.priceCents,
        quantity: p.initialQty,
        minStock: p.minStock,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        type: "ENTRADA",
        quantity: p.initialQty,
        reason: "Estoque inicial",
        createdAt: START_DATE,
        userId: admin.id,
      },
    });
    productIds.push(created.id);
  }

  const allProducts = await prisma.product.findMany({ where: { active: true } });
  const stockLevel = new Map(allProducts.map((p) => [p.id, p.quantity]));
  console.log(`${allProducts.length} produtos disponíveis para as notas.`);

  // --- Clientes ---------------------------------------------------------
  const CUSTOMER_NAMES = [
    "Carlos Eduardo Souza", "Marcos Paulo Lima", "Fernanda Alves Costa",
    "Roberto Carlos Nunes", "Juliana Pereira Dias", "Ricardo Gomes Silva",
    "Patrícia Rocha Melo", "André Luiz Barbosa", "Camila Fernandes Ramos",
    "Bruno Henrique Castro", "Larissa Martins Cardoso", "Diego Almeida Teixeira",
    "Vanessa Cristina Farias", "Thiago Correia Moura", "Rafael Santana Duarte",
  ];
  const customerIds: string[] = [];
  for (const name of CUSTOMER_NAMES) {
    const ddd = randomChoice(["84", "11", "21"]);
    const phone = `(${ddd}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
    const createdAt = randomDate(START_DATE, addDays(TODAY, -14));
    const created = await prisma.customer.create({ data: { name, phone, createdAt } });
    customerIds.push(created.id);
  }
  const existingCustomers = await prisma.customer.findMany();
  for (const c of existingCustomers) customerIds.push(c.id);

  // --- Motos --------------------------------------------------------
  const MOTO_CATALOG = [
    { brand: "Honda", model: "Biz 125", year: 2020, purchase: 700000, sale: 950000 },
    { brand: "Yamaha", model: "Factor 125", year: 2021, purchase: 800000, sale: 1050000 },
    { brand: "Honda", model: "Pop 110i", year: 2022, purchase: 600000, sale: 820000 },
    { brand: "Yamaha", model: "Fazer 250", year: 2019, purchase: 1100000, sale: 1450000 },
    { brand: "Honda", model: "XRE 300", year: 2021, purchase: 1600000, sale: 2050000 },
    { brand: "Suzuki", model: "Yes 125", year: 2018, purchase: 550000, sale: 750000 },
    { brand: "Honda", model: "CB 300R", year: 2022, purchase: 1900000, sale: 2400000 },
    { brand: "Yamaha", model: "NMax 160", year: 2023, purchase: 1700000, sale: 2150000 },
    { brand: "Honda", model: "Bros 160", year: 2021, purchase: 1300000, sale: 1650000 },
    { brand: "Honda", model: "CG 160 Titan", year: 2020, purchase: 950000, sale: 1250000 },
    { brand: "Yamaha", model: "Crosser 150", year: 2019, purchase: 1000000, sale: 1300000 },
    { brand: "Honda", model: "PCX 150", year: 2022, purchase: 1500000, sale: 1900000 },
  ];
  const COLORS = ["Preta", "Vermelha", "Azul", "Branca", "Prata", "Cinza"];
  const BUYER_NAMES = CUSTOMER_NAMES;

  // Fictitious photos so the public showroom (and the "click to see details"
  // gallery/thumbnails) has something to show during a client demo. Cloudinary
  // fetches the placeholder image itself and re-hosts it, so the DB ends up
  // with a real res.cloudinary.com URL — same storage the real moto/product
  // photo forms use, not a hotlink to a third-party placeholder service.
  async function demoMotoImages(seed: string, count = 4) {
    const uploads = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        cloudinary.uploader.upload(`https://picsum.photos/seed/jairomotos-${seed}-${i}/900/675`, {
          folder: "jairomotos/motorcycles",
        })
      )
    );
    return uploads.map((upload) => upload.secure_url);
  }

  const MOTO_DESCRIPTIONS = [
    "Moto revisada e pronta para uso, com documentação em dia. Aceita financiamento e troca.",
    "Único dono, sempre revisada em concessionária. Pneus e freios em ótimo estado.",
    "Bem conservada, sem detalhes de pintura. Ideal para o dia a dia e economia de combustível.",
    "Revisão completa feita na loja: óleo, filtros e freios novos. Financiamos em até 48x.",
    "Moto de garagem, pouco rodada. Aceita troca por moto de menor valor.",
  ];

  let motoIndex = 0;
  for (const moto of MOTO_CATALOG) {
    const createdAt = randomDate(START_DATE, addDays(TODAY, -20));
    const outcome = motoIndex < 6 ? "SOLD" : motoIndex < 8 ? "RESERVED" : "AVAILABLE";
    const seed = `${moto.brand}-${moto.model}-${moto.year}`.toLowerCase().replace(/\s+/g, "-");
    motoIndex++;

    const motoRecord = await prisma.motorcycle.create({
      data: {
        brand: moto.brand,
        model: moto.model,
        year: moto.year,
        color: randomChoice(COLORS),
        images: await demoMotoImages(seed),
        description: randomChoice(MOTO_DESCRIPTIONS),
        mileage: randomInt(5000, 45000),
        purchaseCostCents: moto.purchase,
        salePriceCents: moto.sale,
        status: outcome,
        createdAt,
        updatedAt: createdAt,
        ...(outcome === "SOLD"
          ? {
              soldPriceCents: moto.sale - randomInt(0, 50000),
              buyerName: randomChoice(BUYER_NAMES),
              buyerPhone: `(84) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
              soldAt: randomDate(addDays(createdAt, 5), TODAY),
            }
          : {}),
      },
    });

    await prisma.motoTransaction.create({
      data: {
        type: "DESPESA",
        category: "Compra",
        description: `Compra - ${moto.brand} ${moto.model}`,
        amountCents: moto.purchase,
        date: createdAt,
        createdAt,
        motorcycleId: motoRecord.id,
        createdById: randomChoice(creators).id,
      },
    });

    if (Math.random() < 0.4) {
      const revisionDate = addDays(createdAt, randomInt(1, 10));
      await prisma.motoTransaction.create({
        data: {
          type: "DESPESA",
          category: "Revisão",
          description: "Revisão e preparação para venda",
          amountCents: randomInt(15000, 40000),
          date: revisionDate,
          createdAt: revisionDate,
          motorcycleId: motoRecord.id,
          createdById: randomChoice(creators).id,
        },
      });
    }

    if (outcome === "SOLD") {
      const updated = await prisma.motorcycle.findUniqueOrThrow({ where: { id: motoRecord.id } });
      await prisma.motoTransaction.create({
        data: {
          type: "RECEITA",
          category: "Venda",
          description: `Venda - ${moto.brand} ${moto.model}`,
          amountCents: updated.soldPriceCents ?? moto.sale,
          date: updated.soldAt ?? TODAY,
          createdAt: updated.soldAt ?? TODAY,
          motorcycleId: motoRecord.id,
          createdById: randomChoice(creators).id,
        },
      });
    }
  }
  console.log(`${MOTO_CATALOG.length} motos cadastradas.`);

  // --- Notas (invoices) --------------------------------------------------
  const SERVICES = [
    { description: "Troca de óleo e filtro", min: 3000, max: 6000 },
    { description: "Revisão geral", min: 8000, max: 18000 },
    { description: "Troca de pastilha de freio", min: 4000, max: 8000 },
    { description: "Alinhamento e balanceamento", min: 3500, max: 6500 },
    { description: "Troca de corrente e relação", min: 6000, max: 12000 },
    { description: "Diagnóstico elétrico", min: 4000, max: 9000 },
    { description: "Troca de bateria", min: 2000, max: 4000 },
    { description: "Regulagem de motor", min: 5000, max: 11000 },
  ];

  const monthsWindow: { start: Date; end: Date; invoiceCount: number }[] = [];
  for (let m = MONTHS_BACK - 1; m >= 0; m--) {
    const start = addDays(TODAY, -((m + 1) * 30));
    const end = addDays(TODAY, -(m * 30));
    monthsWindow.push({ start, end, invoiceCount: randomInt(12, 20) });
  }

  let invoicesCreated = 0;
  for (const window of monthsWindow) {
    for (let i = 0; i < window.invoiceCount; i++) {
      const issuedAt = randomDate(window.start, window.end);
      const isRecent = TODAY.getTime() - issuedAt.getTime() < 10 * DAY_MS;
      const roll = Math.random();
      const status = isRecent ? (roll < 0.5 ? "PENDING" : "APPROVED") : roll < 0.04 ? "CANCELED" : "APPROVED";

      const itemCount = randomInt(1, 3);
      const chosenProducts = new Set<string>();
      while (chosenProducts.size < itemCount && chosenProducts.size < allProducts.length) {
        chosenProducts.add(randomChoice(allProducts).id);
      }

      const items: { productId: string; quantity: number; unitPriceCents: number; subtotalCents: number }[] = [];
      for (const productId of chosenProducts) {
        const product = allProducts.find((p) => p.id === productId)!;
        const available = stockLevel.get(productId) ?? 0;
        const quantity = Math.min(randomInt(1, 3), Math.max(available, 0));
        if (quantity <= 0) continue;
        items.push({
          productId,
          quantity,
          unitPriceCents: product.priceCents,
          subtotalCents: quantity * product.priceCents,
        });
        if (status === "APPROVED") {
          stockLevel.set(productId, available - quantity);
        }
      }

      const services =
        Math.random() < 0.55
          ? Array.from({ length: randomInt(1, 2) }, () => {
              const svc = randomChoice(SERVICES);
              return { description: svc.description, amountCents: randomInt(svc.min, svc.max) };
            })
          : [];

      if (items.length === 0 && services.length === 0) continue;

      const itemsTotal = items.reduce((sum, it) => sum + it.subtotalCents, 0);
      const servicesTotal = services.reduce((sum, s) => sum + s.amountCents, 0);
      const subtotalCents = itemsTotal + servicesTotal;
      const discountCents = Math.random() < 0.2 ? Math.min(subtotalCents, randomInt(500, 3000)) : 0;
      const totalCents = subtotalCents - discountCents;
      const creator = randomChoice(creators);
      const customerId = randomChoice(customerIds);

      const invoice = await prisma.invoice.create({
        data: {
          customerId,
          status,
          discountCents,
          totalCents,
          issuedAt,
          createdAt: issuedAt,
          updatedAt: issuedAt,
          createdById: creator.id,
          items: { create: items },
          services: { create: services },
          ...(status === "APPROVED" ? { approvedAt: addDays(issuedAt, randomInt(0, 2)) } : {}),
          ...(status === "CANCELED" ? { canceledAt: addDays(issuedAt, randomInt(0, 3)) } : {}),
        },
      });

      if (status === "APPROVED") {
        const approvedAt = invoice.approvedAt ?? issuedAt;
        for (const item of items) {
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: "SAIDA",
              quantity: item.quantity,
              reason: `Venda - Nota #${invoice.number}`,
              invoiceId: invoice.id,
              createdAt: approvedAt,
              userId: creator.id,
            },
          });
        }
        await prisma.financialTransaction.create({
          data: {
            type: "RECEITA",
            category: "Venda",
            description: `Nota #${invoice.number}`,
            amountCents: invoice.totalCents,
            status: "PAGO",
            date: approvedAt,
            createdAt: approvedAt,
            invoiceId: invoice.id,
            createdById: creator.id,
          },
        });
      }

      invoicesCreated++;
    }

    // Restock every "month" window so products don't run out over time.
    for (const product of allProducts) {
      const current = stockLevel.get(product.id) ?? 0;
      if (current <= product.minStock) {
        const restock = randomInt(15, 40);
        stockLevel.set(product.id, current + restock);
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: "ENTRADA",
            quantity: restock,
            reason: "Compra - Reposição",
            createdAt: window.end,
            userId: admin.id,
          },
        });
      }
    }
  }
  console.log(`${invoicesCreated} notas criadas.`);

  for (const [productId, quantity] of stockLevel.entries()) {
    await prisma.product.update({ where: { id: productId }, data: { quantity: Math.max(quantity, 0) } });
  }

  // --- Lançamentos financeiros manuais recorrentes -----------------------
  for (const window of monthsWindow) {
    const mid = new Date((window.start.getTime() + window.end.getTime()) / 2);
    const recurring: { category: string; description: string; min: number; max: number }[] = [
      { category: "Aluguel", description: "Aluguel do galpão", min: 180000, max: 220000 },
      { category: "Energia", description: "Conta de energia elétrica", min: 30000, max: 60000 },
      { category: "Água", description: "Conta de água", min: 8000, max: 15000 },
      { category: "Internet", description: "Internet e telefone", min: 12000, max: 18000 },
      { category: "Salários", description: "Pagamento de salários", min: 300000, max: 550000 },
    ];
    for (const item of recurring) {
      await prisma.financialTransaction.create({
        data: {
          type: "DESPESA",
          category: item.category,
          description: item.description,
          amountCents: randomInt(item.min, item.max),
          status: "PAGO",
          date: mid,
          createdAt: mid,
          createdById: admin.id,
        },
      });
    }
    if (Math.random() < 0.5) {
      await prisma.financialTransaction.create({
        data: {
          type: "DESPESA",
          category: "Manutenção",
          description: "Manutenção de equipamentos da oficina",
          amountCents: randomInt(8000, 25000),
          status: "PAGO",
          date: addDays(mid, randomInt(-5, 5)),
          createdAt: addDays(mid, randomInt(-5, 5)),
          createdById: admin.id,
        },
      });
    }
  }
  console.log("Lançamentos financeiros recorrentes criados.");

  // --- Boletos ------------------------------------------------------
  type BoletoSeed = { description: string; type: "RECEITA" | "DESPESA"; amountCents: number; dueDate: Date; status: "PENDENTE" | "PAGO" | "CANCELADO" };
  const boletoSeeds: BoletoSeed[] = [];

  const SUPPLIERS = ["Distribuidora Norte Peças", "Comercial Auto Center", "Peças & Cia Ltda", "Fornecedor MotoParts"];
  for (let i = 0; i < 10; i++) {
    const dueDate = randomDate(START_DATE, addDays(TODAY, -10));
    boletoSeeds.push({
      description: `Boleto ${randomChoice(SUPPLIERS)}`,
      type: "DESPESA",
      amountCents: randomInt(50000, 250000),
      dueDate,
      status: "PAGO",
    });
  }
  boletoSeeds.push(
    { description: "Boleto Fornecedor MotoParts", type: "DESPESA", amountCents: randomInt(60000, 150000), dueDate: addDays(TODAY, -6), status: "PENDENTE" },
    { description: "Boleto Distribuidora Norte Peças", type: "DESPESA", amountCents: randomInt(60000, 150000), dueDate: addDays(TODAY, -2), status: "PENDENTE" },
    { description: "Parcela financiamento - Cliente Ricardo Gomes", type: "RECEITA", amountCents: randomInt(30000, 90000), dueDate: addDays(TODAY, 2), status: "PENDENTE" },
    { description: "Boleto Comercial Auto Center", type: "DESPESA", amountCents: randomInt(60000, 150000), dueDate: addDays(TODAY, 5), status: "PENDENTE" },
    { description: "Parcela financiamento - Cliente Camila Fernandes", type: "RECEITA", amountCents: randomInt(30000, 90000), dueDate: addDays(TODAY, 18), status: "PENDENTE" },
    { description: "Boleto Peças & Cia Ltda", type: "DESPESA", amountCents: randomInt(60000, 150000), dueDate: addDays(TODAY, 25), status: "PENDENTE" },
    { description: "Boleto Fornecedor MotoParts (cancelado)", type: "DESPESA", amountCents: randomInt(60000, 150000), dueDate: addDays(TODAY, -15), status: "CANCELADO" }
  );

  for (const b of boletoSeeds) {
    const createdAt = addDays(b.dueDate, -randomInt(5, 20));
    let financialTransactionId: string | undefined;
    let paidAt: Date | undefined;

    if (b.status === "PAGO") {
      paidAt = addDays(b.dueDate, randomInt(-1, 0));
      const tx = await prisma.financialTransaction.create({
        data: {
          type: b.type,
          category: "Boleto",
          description: b.description,
          amountCents: b.amountCents,
          status: "PAGO",
          date: paidAt,
          createdAt: paidAt,
          createdById: admin.id,
        },
      });
      financialTransactionId = tx.id;
    }

    await prisma.boleto.create({
      data: {
        description: b.description,
        type: b.type,
        amountCents: b.amountCents,
        dueDate: b.dueDate,
        status: b.status,
        paidAt,
        createdAt,
        financialTransactionId,
        createdById: admin.id,
      },
    });
  }
  console.log(`${boletoSeeds.length} boletos criados.`);

  console.log("Concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
