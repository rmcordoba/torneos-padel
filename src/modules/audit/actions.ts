"use server";

import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface AuditParams {
  userId: string;
  organizerId?: string;
  tournamentId?: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      organizerId: params.organizerId,
      tournamentId: params.tournamentId,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
      after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function getAuditLogs(organizerId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      tournament: { select: { name: true } },
    },
  });
}
