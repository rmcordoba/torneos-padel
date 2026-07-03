import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const org = await p.organizer.findFirst({ select: { id: true, name: true } });
  const cats = await p.category.findMany({ where: { organizerId: org!.id }, select: { id: true, name: true } });
  const adminUser = await p.user.findFirst({ where: { organizerMemberships: { some: { organizerId: org!.id } } }, select: { id: true, email: true } });
  const tCount = await p.tournament.count({ where: { organizerId: org!.id } });
  const pCount = await p.playerProfile.count();
  console.log(JSON.stringify({ org, cats, adminUser, tCount, pCount }, null, 2));
  await p.$disconnect();
}
main();
