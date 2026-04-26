"use client";

import { useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  removeFromWaitlist,
  approveAllPending,
  promoteAllWaitlist,
  clearWaitlist,
} from "@/modules/registrations/actions";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AddRegistrationForm } from "./add-registration-form";
import {
  Check, X, Ban, Clock, Users, ListOrdered,
  CheckCircle2, Loader2, Trophy, CheckCheck, ArrowUpCircle, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerProfile, Team, TeamPlayer, Registration, WaitlistEntry } from "@prisma/client";

type TeamWithPlayers = Team & {
  players: (TeamPlayer & { playerProfile: PlayerProfile })[];
};

type RegistrationWithTeam = Registration & { team: TeamWithPlayers };
type WaitlistWithTeam = WaitlistEntry & { team: TeamWithPlayers };

interface RegistrationManagerProps {
  tournamentCategoryId: string;
  maxTeams: number;
  returnPath: string;
  pending: RegistrationWithTeam[];
  approved: RegistrationWithTeam[];
  waitlist: WaitlistWithTeam[];
}

type Tab = "pending" | "approved" | "waitlist";

export function RegistrationManager({
  tournamentCategoryId,
  maxTeams,
  returnPath,
  pending,
  approved,
  waitlist,
}: RegistrationManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) ?? "pending";

  const setTab = (t: Tab) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const isFull = approved.length >= maxTeams;
  const pct = Math.round((approved.length / maxTeams) * 100);
  const pctColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-4">

      {/* Barra de cupo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-900">
              {approved.length} / {maxTeams} parejas
            </span>
            {isFull && (
              <Badge variant="destructive" className="text-[10px]">Cupo lleno</Badge>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500">{pct}%</span>
        </div>
        <Progress value={pct} colorClass={pctColor} className="h-3" />
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <ListOrdered className="h-3 w-3 text-purple-500" />
            {waitlist.length} en lista de espera
          </span>
        </div>
      </div>

      {/* Agregar inscripción */}
      <AddRegistrationForm
        tournamentCategoryId={tournamentCategoryId}
        returnPath={returnPath}
        isFull={isFull}
      />

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <TabButton
            active={tab === "pending"}
            onClick={() => setTab("pending")}
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Pendientes"
            count={pending.length}
            countColor="bg-amber-500"
          />
          <TabButton
            active={tab === "approved"}
            onClick={() => setTab("approved")}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Aprobadas"
            count={approved.length}
            countColor="bg-emerald-500"
          />
          <TabButton
            active={tab === "waitlist"}
            onClick={() => setTab("waitlist")}
            icon={<ListOrdered className="h-3.5 w-3.5" />}
            label="Lista de espera"
            count={waitlist.length}
            countColor="bg-purple-500"
          />
        </div>

        {/* Contenido del tab */}
        <div>
          {tab === "pending" && (
            <>
              {pending.length > 1 && (
                <ApproveAllButton
                  tournamentCategoryId={tournamentCategoryId}
                  returnPath={returnPath}
                  count={pending.length}
                />
              )}
              <RegistrationList
                items={pending}
                returnPath={returnPath}
                emptyTitle="Sin inscripciones pendientes"
                emptyDesc="Las nuevas inscripciones aparecerán aquí para su aprobación."
                renderActions={(reg) => (
                  <PendingActions registrationId={reg.id} returnPath={returnPath} />
                )}
              />
            </>
          )}

          {tab === "approved" && (
            <RegistrationList
              items={approved}
              returnPath={returnPath}
              emptyTitle="Sin inscripciones aprobadas"
              emptyDesc="Aprobá inscripciones pendientes para que aparezcan aquí."
              renderActions={(reg) => (
                <ApprovedActions registrationId={reg.id} returnPath={returnPath} />
              )}
            />
          )}

          {tab === "waitlist" && (
            <WaitlistList
              items={waitlist}
              returnPath={returnPath}
              tournamentCategoryId={tournamentCategoryId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RegistrationList ─────────────────────────────────────────────────────────

function RegistrationList({
  items,
  returnPath,
  emptyTitle,
  emptyDesc,
  renderActions,
}: {
  items: RegistrationWithTeam[];
  returnPath: string;
  emptyTitle: string;
  emptyDesc: string;
  renderActions: (reg: RegistrationWithTeam) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <Trophy className="h-10 w-10 text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-600">{emptyTitle}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((reg, i) => (
        <RegistrationRow
          key={reg.id}
          reg={reg}
          index={i + 1}
          actions={renderActions(reg)}
        />
      ))}
    </ul>
  );
}

// ─── WaitlistList ─────────────────────────────────────────────────────────────

function WaitlistList({
  items,
  returnPath,
  tournamentCategoryId,
}: {
  items: WaitlistWithTeam[];
  returnPath: string;
  tournamentCategoryId: string;
}) {
  const [pending, startTransition] = useTransition();

  const [promoting, startPromote] = useTransition();
  const [clearing, startClear] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <ListOrdered className="h-10 w-10 text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Lista de espera vacía</p>
        <p className="text-xs text-slate-400 mt-1">
          Las parejas se agregan aquí cuando el cupo está lleno.
        </p>
      </div>
    );
  }

  const isBusy = pending || promoting || clearing;

  return (
    <>
      {/* Acciones masivas */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-purple-50/60">
        <span className="text-xs text-purple-700 font-semibold">
          {items.length} pareja{items.length !== 1 ? "s" : ""} en espera
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (!confirm(`¿Promover las ${items.length} parejas a inscripciones pendientes?`)) return;
              startPromote(async () => { await promoteAllWaitlist(tournamentCategoryId, returnPath); });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {promoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
            Promover todas
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (!confirm(`¿Vaciar la lista de espera? Se eliminarán las ${items.length} entradas.`)) return;
              startClear(async () => { await clearWaitlist(tournamentCategoryId, returnPath); });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Vaciar lista
          </button>
        </div>
      </div>
    <ul className="divide-y divide-slate-100">
      {items.map((entry) => {
        const names = getPlayerNames(entry.team);
        return (
          <li key={entry.id} className="flex items-center gap-4 px-5 py-4">
            {/* Posición */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
              {entry.position}
            </div>

            {/* Jugadores */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PlayerAvatarGroup names={names} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{names.join(" / ")}</p>
                <p className="text-xs text-slate-400">
                  En espera desde {new Date(entry.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>

            {/* Acción */}
            <form action={async (fd) => {
              startTransition(async () => { await removeFromWaitlist(fd); });
            }}>
              <input type="hidden" name="waitlistEntryId" value={entry.id} />
              <input type="hidden" name="returnPath" value={returnPath} />
              <button
                type="submit"
                disabled={pending}
                title="Quitar de lista de espera"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
    </>
  );
}

// ─── RegistrationRow ──────────────────────────────────────────────────────────

function RegistrationRow({
  reg,
  index,
  actions,
}: {
  reg: RegistrationWithTeam;
  index: number;
  actions: React.ReactNode;
}) {
  const names = getPlayerNames(reg.team);
  return (
    <li className="flex items-center gap-4 px-5 py-4 group hover:bg-slate-50/50 transition-colors">
      <span className="text-xs font-bold text-slate-300 w-4 shrink-0">{index}</span>

      <PlayerAvatarGroup names={names} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{names.join(" / ")}</p>
        <p className="text-xs text-slate-400">
          Inscripto el {new Date(reg.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {actions}
      </div>
    </li>
  );
}

// ─── Botones de acción ────────────────────────────────────────────────────────

function PendingActions({ registrationId, returnPath }: { registrationId: string; returnPath: string }) {
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();

  return (
    <>
      <form action={async (fd) => { startApprove(async () => { await approveRegistration(fd); }); }}>
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <button
          type="submit"
          disabled={approving}
          title="Aprobar"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Aprobar
        </button>
      </form>
      <form action={async (fd) => { startReject(async () => { await rejectRegistration(fd); }); }}>
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <button
          type="submit"
          disabled={rejecting}
          title="Rechazar"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Rechazar
        </button>
      </form>
    </>
  );
}

function ApprovedActions({ registrationId, returnPath }: { registrationId: string; returnPath: string }) {
  const [cancelling, startCancel] = useTransition();

  return (
    <form action={async (fd) => { startCancel(async () => { await cancelRegistration(fd); }); }}>
      <input type="hidden" name="registrationId" value={registrationId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <button
        type="submit"
        disabled={cancelling}
        title="Cancelar inscripción"
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
        Cancelar
      </button>
    </form>
  );
}

// ─── ApproveAllButton ─────────────────────────────────────────────────────────

function ApproveAllButton({
  tournamentCategoryId, returnPath, count,
}: {
  tournamentCategoryId: string; returnPath: string; count: number;
}) {
  const [approving, startApprove] = useTransition();

  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-amber-50/60">
      <span className="text-xs text-amber-700 font-semibold">
        {count} inscripción{count !== 1 ? "es" : ""} pendiente{count !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        disabled={approving}
        onClick={() => {
          startApprove(async () => { await approveAllPending(tournamentCategoryId, returnPath); });
        }}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
        Aprobar todas
      </button>
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon, label, count, countColor,
}: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
  count: number; countColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-semibold transition-all border-b-2",
        active
          ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${countColor}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function PlayerAvatarGroup({ names }: { names: string[] }) {
  const colors = ["from-emerald-400 to-teal-500", "from-blue-400 to-blue-500"];
  return (
    <div className="flex -space-x-2 shrink-0">
      {names.slice(0, 2).map((name, i) => {
        const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
        return (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${colors[i]} text-[11px] font-bold text-white ring-2 ring-white`}
          >
            {initials}
          </div>
        );
      })}
    </div>
  );
}

function getPlayerNames(team: TeamWithPlayers): string[] {
  return team.players.map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`);
}
