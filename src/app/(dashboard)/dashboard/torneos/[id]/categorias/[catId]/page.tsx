import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getCategoryWithRegistrationCounts,
  getRegistrationsByTournamentCategory,
  getWaitlist,
} from "@/modules/registrations/queries";
import { updateTournamentCategoryStatus } from "@/modules/tournaments/actions";
import { RegistrationManager } from "./_components/registration-manager";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, Trophy, GitBranch, LayoutGrid,
  Swords, Users, DollarSign, Shield, RefreshCw, Shuffle,
} from "lucide-react";
import type { Metadata } from "next";
import type { TournamentCategoryStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Categoría — Inscripciones" };

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};
const FORMAT_ICON: Record<string, React.ReactNode> = {
  SINGLE_ELIMINATION: <GitBranch className="h-3.5 w-3.5" />,
  GROUP_PLAYOFF:      <LayoutGrid className="h-3.5 w-3.5" />,
  DOUBLE_ELIMINATION: <Shield className="h-3.5 w-3.5" />,
  ROUND_ROBIN:        <RefreshCw className="h-3.5 w-3.5" />,
  AMERICANO:          <Shuffle className="h-3.5 w-3.5" />,
  MEXICANO:           <Shuffle className="h-3.5 w-3.5" />,
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  REGISTRATION_OPEN: "Inscripciones abiertas",
  REGISTRATION_CLOSED: "Inscripciones cerradas",
  IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "sport"> = {
  DRAFT: "outline",
  REGISTRATION_OPEN: "success",
  REGISTRATION_CLOSED: "warning",
  IN_PROGRESS: "sport",
  COMPLETED: "secondary",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const { id: tournamentId, catId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const [tc, pending, approved, waitlist] = await Promise.all([
    getCategoryWithRegistrationCounts(catId),
    getRegistrationsByTournamentCategory(catId, "PENDING"),
    getRegistrationsByTournamentCategory(catId, "APPROVED"),
    getWaitlist(catId),
  ]);

  if (!tc || tc.tournament.id !== tournamentId) notFound();

  const returnPath = `/dashboard/torneos/${tournamentId}/categorias/${catId}`;
  const pct = Math.round((tc.counts.approved / tc.maxTeams) * 100);

  const capColor = pct >= 100 ? "#f43f5e" : pct >= 80 ? "#fb923c" : "#a3e635";

  return (
    <div className="max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/torneos" style={{ color: "#475569", textDecoration: "none" }}>Torneos</Link>
        <span style={{ color: "#334155" }}>/</span>
        <Link href={`/dashboard/torneos/${tournamentId}`} style={{ color: "#475569", textDecoration: "none", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tc.tournament.name}
        </Link>
        <span style={{ color: "#334155" }}>/</span>
        <span style={{ fontWeight: 700, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.category.name}</span>
      </nav>

      {/* Header de la categoría */}
      <div style={{
        borderRadius: 18, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(12,20,40,0.7)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}>
        {/* Franja de cupo */}
        <div style={{ height: 5, width: "100%", background: capColor, boxShadow: `0 0 12px ${capColor}` }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(163,230,53,0.12)" }}>
              <Trophy size={24} color="#a3e635" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.02em" }}>{tc.category.name}</h1>
                <Badge variant={(STATUS_VARIANT[tc.status] ?? "outline") as "default"}>
                  {STATUS_LABEL[tc.status] ?? tc.status}
                </Badge>
              </div>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{tc.tournament.name}</p>

              {/* Cupo progress */}
              <div style={{ marginTop: 14, width: 280, maxWidth: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Cupo ocupado</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: capColor, fontFamily: "var(--font-space), sans-serif" }}>{tc.counts.approved}/{tc.maxTeams} · {pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: capColor, borderRadius: 6, boxShadow: `0 0 8px ${capColor}88`, transition: "width .4s" }} />
                </div>
              </div>
            </div>
          </div>
          <CategoryStatusActions tcId={catId} currentStatus={tc.status as TournamentCategoryStatus} tournamentId={tournamentId} />
        </div>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <MetricCell icon={<Users size={15} color="#a3e635" />} label="Cupo" value={`${tc.maxTeams} parejas`} idx={0} />
          <MetricCell icon={FORMAT_ICON[tc.format] ?? <Trophy size={15} color="#38bdf8" />} label="Formato" value={FORMAT_LABEL[tc.format] ?? tc.format} idx={1} />
          <MetricCell icon={<Swords size={15} color="#a78bfa" />} label="Sets / Games" value={`${tc.setsPerMatch}×${tc.gamesPerSet}`} idx={2} />
          <MetricCell icon={<DollarSign size={15} color="#fbbf24" />} label="Arancel" value={tc.pricePerTeam ? `$${Number(tc.pricePerTeam).toLocaleString("es-AR")}` : "Gratis"} idx={3} />
        </div>
      </div>

      {/* Fixture link */}
      <Link
        href={`/dashboard/torneos/${tournamentId}/categorias/${catId}/fixture`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          borderRadius: 12, padding: "13px",
          border: "1px solid rgba(56,189,248,0.25)",
          background: "rgba(56,189,248,0.08)",
          color: "#38bdf8", fontSize: 14, fontWeight: 800, textDecoration: "none",
          fontFamily: "var(--font-space), sans-serif",
        }}
      >
        <Swords size={16} /> Ver / gestionar fixture
      </Link>

      <RegistrationManager
        tournamentCategoryId={catId}
        maxTeams={tc.maxTeams}
        returnPath={returnPath}
        hasWeekdayPlay={tc.tournament.hasWeekdayPlay}
        pending={pending as Parameters<typeof RegistrationManager>[0]["pending"]}
        approved={approved as Parameters<typeof RegistrationManager>[0]["approved"]}
        waitlist={waitlist as Parameters<typeof RegistrationManager>[0]["waitlist"]}
      />

      {/* Back link */}
      <Link
        href={`/dashboard/torneos/${tournamentId}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", textDecoration: "none" }}
      >
        <ChevronLeft size={16} />
        Volver al torneo
      </Link>
    </div>
  );
}

function MetricCell({
  icon, label, value, idx,
}: {
  icon: React.ReactNode; label: string; value: string; idx: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRight: idx < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
      <div style={{ opacity: 0.85 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginTop: 2, fontFamily: "var(--font-space), sans-serif" }}>{value}</p>
      </div>
    </div>
  );
}

const CAT_STATUS_TRANSITIONS: Partial<Record<TournamentCategoryStatus, { newStatus: TournamentCategoryStatus; label: string; color: string }>> = {
  DRAFT:               { newStatus: "REGISTRATION_OPEN",   label: "Abrir inscripciones", color: "#a3e635" },
  REGISTRATION_OPEN:   { newStatus: "REGISTRATION_CLOSED", label: "Cerrar inscripciones", color: "#fbbf24" },
  REGISTRATION_CLOSED: { newStatus: "REGISTRATION_OPEN",   label: "Reabrir inscripciones", color: "#60a5fa" },
};

async function CategoryStatusActions({
  tcId, currentStatus, tournamentId,
}: {
  tcId: string; currentStatus: TournamentCategoryStatus; tournamentId: string;
}) {
  const transition = CAT_STATUS_TRANSITIONS[currentStatus];
  if (!transition) return null;

  const { newStatus } = transition;
  async function action() {
    "use server";
    await updateTournamentCategoryStatus(tcId, newStatus);
  }

  return (
    <form action={action}>
      <button
        type="submit"
        style={{
          padding: "9px 16px",
          borderRadius: 10,
          border: "none",
          background: transition.color,
          color: "#080e1a",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
          boxShadow: `0 0 18px ${transition.color}40`,
        }}
      >
        {transition.label}
      </button>
    </form>
  );
}
