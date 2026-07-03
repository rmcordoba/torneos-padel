import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Planes (idempotente por slug). El plan default es el que se asigna en el alta (trial).
  const basico = await prisma.plan.upsert({
    where: { slug: "basico" },
    update: { name: "Básico", priceMonthly: 15000, hasBookingsModule: false, isActive: true, sortOrder: 1 },
    create: { name: "Básico", slug: "basico", priceMonthly: 15000, hasBookingsModule: false, isDefault: false, isActive: true, sortOrder: 1 },
  });

  const pro = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: { name: "Pro", priceMonthly: 30000, hasBookingsModule: true, isActive: true, sortOrder: 2 },
    create: { name: "Pro", slug: "pro", priceMonthly: 30000, hasBookingsModule: true, isDefault: true, isActive: true, sortOrder: 2 },
  });

  // Garantizar un único plan default (el "Pro").
  await prisma.plan.updateMany({ where: { id: { not: pro.id } }, data: { isDefault: false } });
  await prisma.plan.update({ where: { id: pro.id }, data: { isDefault: true } });

  console.log("Planes:", { basico: basico.slug, pro: pro.slug });

  // Backfill: organizers existentes sin suscripción → ACTIVE con período largo
  // (para que no queden bloqueados tras introducir el billing).
  const orgs = await prisma.organizer.findMany({
    where: { subscription: { is: null } },
    select: { id: true, name: true },
  });

  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 1);

  for (const o of orgs) {
    await prisma.subscription.create({
      data: {
        organizerId: o.id,
        planId: pro.id,
        status: "ACTIVE",
        currentPeriodEnd: farFuture,
        notes: "Backfill inicial (alta previa a facturación)",
      },
    });
  }

  console.log(`Backfill: ${orgs.length} organizer(s) con suscripción ACTIVE.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
