"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  removeFromWaitlist,
  approveAllPending,
  promoteAllWaitlist,
  clearWaitlist,
  updateRegistrationAvailability,
} from "@/modules/registrations/actions";
import { WEEKDAY_TIME_BANDS } from "@/modules/registrations/validations";
import { WeekdayAvailabilityPicker } from "@/components/ui/weekday-availability-picker";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AddRegistrationForm } from "./add-registration-form";
import {
  Check, X, Ban, Clock, Users, ListOrdered,
  CheckCircle2, Loader2, Trophy, CheckCheck, ArrowUpCircle, Trash2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerProfile, Team, TeamPlayer, Registration, WaitlistEntry, WeekdayTimeBand } from "@prisma/client";

type TeamWithPlayers = Team & {
  players: (TeamPlayer & { playerProfile: PlayerProfile })[];
};

type RegistrationWithTeam = Registration & { team: TeamWithPlayers };
type WaitlistWithTeam = WaitlistEntry & { team: TeamWithPlayers };

interface RegistrationManagerProps {
  tournamentCategoryId: string;
  maxTeams: number;
  returnPath: string;
  hasWeekdayPlay: boolean;
  pending: RegistrationWithTeam[];
  approved: RegistrationWithTeam[];
  waitlist: WaitlistWithTeam[];
}

type Tab = "pending" | "approved" | "waitlist";

export function RegistrationManager({
  tournamentCategoryId,
  maxTeams,
  returnPath,
  hasWeekdayPlay,
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
  const pctColor = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-lime-400";

  return (
    <div className="space-y-4">

      {/* Barra de cupo */}
      <div className="rounded-2xl border border-white/[0.07] bg-[rgba(12,20,40,0.7)] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-extrabold text-slate-100 font-display">
              {approved.length} / {maxTeams} parejas
            </span>
            {isFull && (
              <Badge variant="destructive" className="text-[10px]">Cupo lleno</Badge>
            )}
          </div>
          <span className="text-xs font-extrabold text-slate-400 font-display">{pct}%</span>
        </div>
        <Progress value={pct} colorClass={pctColor} className="h-3 bg-white/[0.06]" />
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-400" />
            {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <ListOrdered className="h-3 w-3 text-violet-400" />
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
      <div className="rounded-2xl border border-white/[0.07] bg-[rgba(12,20,40,0.7)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          <TabButton
            active={tab === "pending"}
            onClick={() => setTab("pending")}
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Pendientes"
            count={pending.length}
            countColor="bg-amber-400 text-[#080e1a]"
          />
          <TabButton
            active={tab === "approved"}
            onClick={() => setTab("approved")}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Aprobadas"
            count={approved.length}
            countColor="bg-lime-400 text-[#080e1a]"
          />
          <TabButton
            active={tab === "waitlist"}
            onClick={() => setTab("waitlist")}
            icon={<ListOrdered className="h-3.5 w-3.5" />}
            label="Lista de espera"
            count={waitlist.length}
            countColor="bg-violet-400 text-[#080e1a]"
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
                hasWeekdayPlay={hasWeekdayPlay}
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
              hasWeekdayPlay={hasWeekdayPlay}
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
              hasWeekdayPlay={hasWeekdayPlay}
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
  hasWeekdayPlay,
  emptyTitle,
  emptyDesc,
  renderActions,
}: {
  items: RegistrationWithTeam[];
  returnPath: string;
  hasWeekdayPlay: boolean;
  emptyTitle: string;
  emptyDesc: string;
  renderActions: (reg: RegistrationWithTeam) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <Trophy className="h-10 w-10 text-white/10 mb-3" />
        <p className="text-sm font-bold text-slate-300 font-display">{emptyTitle}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {items.map((reg, i) => (
        <RegistrationRow
          key={reg.id}
          reg={reg}
          index={i + 1}
          returnPath={returnPath}
          hasWeekdayPlay={hasWeekdayPlay}
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
  hasWeekdayPlay,
}: {
  items: WaitlistWithTeam[];
  returnPath: string;
  tournamentCategoryId: string;
  hasWeekdayPlay: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const [promoting, startPromote] = useTransition();
  const [clearing, startClear] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <ListOrdered className="h-10 w-10 text-white/10 mb-3" />
        <p className="text-sm font-bold text-slate-300 font-display">Lista de espera vacía</p>
        <p className="text-xs text-slate-500 mt-1">
          Las parejas se agregan aquí cuando el cupo está lleno.
        </p>
      </div>
    );
  }

  const isBusy = pending || promoting || clearing;

  return (
    <>
      {/* Acciones masivas */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-violet-400/[0.07]">
        <span className="text-xs text-violet-400 font-bold">
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
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-violet-400 transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(139,92,246,0.3)]"
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
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 transition-colors disabled:opacity-50"
          >
            {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Vaciar lista
          </button>
        </div>
      </div>
    <ul className="divide-y divide-white/[0.05]">
      {items.map((entry) => {
        const names = getPlayerNames(entry.team);
        return (
          <li key={entry.id} className="flex items-center gap-4 px-5 py-4">
            {/* Posición */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-extrabold font-display">
              {entry.position}
            </div>

            {/* Jugadores */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <PlayerAvatarGroup names={names} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-100 truncate font-display">{names.join(" / ")}</p>
                <p className="text-xs text-slate-500">
                  En espera desde {new Date(entry.createdAt).toLocaleDateString("es-AR")}
                </p>
                {hasWeekdayPlay && (
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    <Clock className="h-3 w-3 text-lime-400 shrink-0" />
                    <AvailabilityChips value={entry.weekdayAvailability} />
                  </div>
                )}
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
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition-colors disabled:opacity-50"
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
  returnPath,
  hasWeekdayPlay,
  actions,
}: {
  reg: RegistrationWithTeam;
  index: number;
  returnPath: string;
  hasWeekdayPlay: boolean;
  actions: React.ReactNode;
}) {
  const names = getPlayerNames(reg.team);
  return (
    <li className="flex items-center gap-4 px-5 py-4 group hover:bg-white/[0.03] transition-colors">
      <span className="text-xs font-bold text-slate-600 w-4 shrink-0 font-display">{index}</span>

      <PlayerAvatarGroup names={names} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-100 truncate font-display">{names.join(" / ")}</p>
        <p className="text-xs text-slate-500">
          Inscripto el {new Date(reg.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        {hasWeekdayPlay && (
          <AvailabilityEditor
            registrationId={reg.id}
            returnPath={returnPath}
            value={reg.weekdayAvailability}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {actions}
      </div>
    </li>
  );
}

// ─── AvailabilityEditor ───────────────────────────────────────────────────────

function AvailabilityChips({ value }: { value: WeekdayTimeBand[] }) {
  if (value.length === 0) {
    return <span className="text-[11px] text-slate-500">Sin disponibilidad declarada</span>;
  }
  if (value.length === WEEKDAY_TIME_BANDS.length) {
    return <span className="rounded-md bg-lime-400/10 border border-lime-400/25 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">Disp. total (L–V)</span>;
  }
  return (
    <>
      {WEEKDAY_TIME_BANDS.filter((b) => value.includes(b.value)).map((b) => (
        <span key={b.value} className="rounded-md bg-lime-400/10 border border-lime-400/25 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">
          {b.label} {b.range}
        </span>
      ))}
    </>
  );
}

function AvailabilityEditor({
  registrationId,
  returnPath,
  value,
}: {
  registrationId: string;
  returnPath: string;
  value: WeekdayTimeBand[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, startSave] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
        <Clock className="h-3 w-3 text-lime-400 shrink-0" />
        <AvailabilityChips value={value} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar disponibilidad"
          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-lime-400 transition-colors"
        >
          <Pencil className="h-3 w-3" /> Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        startSave(async () => {
          await updateRegistrationAvailability(fd);
          setEditing(false);
        });
      }}
      className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
    >
      <input type="hidden" name="registrationId" value={registrationId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <WeekdayAvailabilityPicker defaultValue={value} />
      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-extrabold text-[#080e1a] hover:bg-lime-300 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Guardar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setEditing(false)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
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
          className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-xs font-extrabold text-[#080e1a] hover:bg-lime-300 transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(163,230,53,0.25)]"
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
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
        >
          {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
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
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 transition-colors disabled:opacity-50"
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
    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-amber-400/[0.07]">
      <span className="text-xs text-amber-400 font-bold">
        {count} inscripción{count !== 1 ? "es" : ""} pendiente{count !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        disabled={approving}
        onClick={() => {
          startApprove(async () => { await approveAllPending(tournamentCategoryId, returnPath); });
        }}
        className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-xs font-extrabold text-[#080e1a] hover:bg-lime-300 transition-colors disabled:opacity-50 shadow-[0_0_16px_rgba(163,230,53,0.25)]"
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
        "flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-bold transition-all border-b-2",
        active
          ? "border-lime-400 text-lime-400 bg-lime-400/[0.06]"
          : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${countColor}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function PlayerAvatarGroup({ names }: { names: string[] }) {
  const colors = ["from-lime-400 to-emerald-500", "from-sky-400 to-blue-500"];
  return (
    <div className="flex -space-x-2 shrink-0">
      {names.slice(0, 2).map((name, i) => {
        const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
        return (
          <div
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${colors[i]} text-[11px] font-extrabold text-[#080e1a] ring-2 ring-[#0a1428] font-display`}
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
