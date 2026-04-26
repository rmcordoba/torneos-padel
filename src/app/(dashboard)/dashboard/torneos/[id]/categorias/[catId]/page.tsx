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

  return (
    <div className="max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/torneos" className="text-slate-400 hover:text-slate-700 transition-colors">
          Torneos
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href={`/dashboard/torneos/${tournamentId}`}
          className="text-slate-400 hover:text-slate-700 transition-colors truncate max-w-[160px]"
        >
          {tc.tournament.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900 truncate">{tc.category.name}</span>
      </nav>

      {/* Header de la categoría */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Franja de color según cupo */}
        <div
          className="h-1.5 w-full transition-all duration-500"
          style={{
            background: pct >= 100
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : pct >= 80
              ? "linear-gradient(90deg, #f59e0b, #d97706)"
              : "linear-gradient(90deg, #10b981, #059669)",
          }}
        />

        <div className="flex items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{tc.category.name}</h1>
                <Badge variant={(STATUS_VARIANT[tc.status] ?? "outline") as "default"}>
                  {STATUS_LABEL[tc.status] ?? tc.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{tc.tournament.name}</p>
            </div>
          </div>
          <CategoryStatusActions tcId={catId} currentStatus={tc.status as TournamentCategoryStatus} tournamentId={tournamentId} />
        </div>

        {/* Métricas de la categoría */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100">
          <MetricCell
            icon={<Users className="h-4 w-4 text-emerald-500" />}
            label="Cupo"
            value={`${tc.maxTeams} parejas`}
          />
          <MetricCell
            icon={FORMAT_ICON[tc.format] ?? <Trophy className="h-4 w-4 text-blue-500" />}
            label="Formato"
            value={FORMAT_LABEL[tc.format] ?? tc.format}
          />
          <MetricCell
            icon={<Swords className="h-4 w-4 text-purple-500" />}
            label="Sets / Games"
            value={`${tc.setsPerMatch} sets · ${tc.gamesPerSet} games`}
          />
          <MetricCell
            icon={<DollarSign className="h-4 w-4 text-amber-500" />}
            label="Arancel"
            value={tc.pricePerTeam ? `$${Number(tc.pricePerTeam).toLocaleString("es-AR")}` : "Sin costo"}
          />
        </div>
      </div>

      {/* Manager de inscripciones */}
      {/* Fixture link */}
      <Link
        href={`/dashboard/torneos/${tournamentId}/categorias/${catId}/fixture`}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
      >
        <Swords className="h-4 w-4 text-blue-500" /> Ver / gestionar fixture
      </Link>

      <RegistrationManager
        tournamentCategoryId={catId}
        maxTeams={tc.maxTeams}
        returnPath={returnPath}
        pending={pending as Parameters<typeof RegistrationManager>[0]["pending"]}
        approved={approved as Parameters<typeof RegistrationManager>[0]["approved"]}
        waitlist={waitlist as Parameters<typeof RegistrationManager>[0]["waitlist"]}
      />

      {/* Back link */}
      <Link
        href={`/dashboard/torneos/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al torneo
      </Link>
    </div>
  );
}

function MetricCell({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {icon}
      <div>
        <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">{value}</p>
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
          padding: "7px 14px",
          borderRadius: 8,
          border: `1px solid ${transition.color}44`,
          background: "transparent",
          color: transition.color,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {transition.label}
      </button>
    </form>
  );
}
