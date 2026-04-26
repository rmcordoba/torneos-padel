import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import {
  getRegistrationReport,
  getMatchReport,
  getChampionsReport,
} from "@/modules/reports/queries";

function escapeCSV(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCSV(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new NextResponse("No autorizado", { status: 401 });

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return new NextResponse("Sin organizador", { status: 403 });

  const organizerId = memberships[0].organizerId;
  const type = req.nextUrl.searchParams.get("type") ?? "inscripciones";

  let csv = "";
  let filename = "reporte.csv";

  if (type === "inscripciones") {
    const data = await getRegistrationReport(organizerId);
    const header = ["Torneo", "Categoría", "Total", "Aprobados", "Pendientes", "Rechazados"];
    const rows = data.map((r) => [r.tournamentName, r.categoryName, String(r.total), String(r.approved), String(r.pending), String(r.rejected)]);
    csv = toCSV([header, ...rows]);
    filename = "inscripciones.csv";
  } else if (type === "partidos") {
    const data = await getMatchReport(organizerId);
    const header = ["Torneo", "Categoría", "Etapa", "Total", "Jugados", "Pendientes"];
    const rows = data.map((r) => [r.tournamentName, r.categoryName, r.stageName, String(r.total), String(r.played), String(r.pending)]);
    csv = toCSV([header, ...rows]);
    filename = "partidos.csv";
  } else if (type === "campeones") {
    const data = await getChampionsReport(organizerId);
    const header = ["Torneo", "Categoría", "Campeones", "Fecha inicio", "Fecha fin"];
    const rows = data.map((r) => [
      r.tournamentName,
      r.categoryName,
      r.champions.join(" / "),
      new Date(r.startDate).toLocaleDateString("es-AR"),
      new Date(r.endDate).toLocaleDateString("es-AR"),
    ]);
    csv = toCSV([header, ...rows]);
    filename = "campeones.csv";
  } else {
    return new NextResponse("Tipo inválido", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
