"use client";

import { useActionState, useTransition, useRef, useEffect, useState } from "react";
import {
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermissions,
  updateCollaboratorTournamentAccess,
  type ConfigActionState,
} from "@/modules/config/actions";
import type { getOrganizerConfig, getTournamentsByOrganizer } from "@/modules/config/queries";

type Member = NonNullable<Awaited<ReturnType<typeof getOrganizerConfig>>>["members"][number];
type Tournament = Awaited<ReturnType<typeof getTournamentsByOrganizer>>[number];

const A = "#a3e635";

const ROLE_LABELS: Record<string, string> = {
  OWNER:        "Propietario",
  ORGANIZER:    "Organizador",
  COLLABORATOR: "Colaborador",
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  OWNER:        { bg: "rgba(251,191,36,.15)", color: "#fbbf24" },
  ORGANIZER:    { bg: "rgba(59,130,246,.15)", color: "#60a5fa" },
  COLLABORATOR: { bg: "rgba(255,255,255,0.05)",  color: "#64748b" },
};

const ALL_PERMISSIONS = [
  { value: "MANAGE_TOURNAMENTS",   label: "Torneos" },
  { value: "MANAGE_REGISTRATIONS", label: "Inscripciones" },
  { value: "MANAGE_RESULTS",       label: "Resultados" },
  { value: "MANAGE_SCHEDULE",      label: "Calendario" },
  { value: "VIEW_REPORTS",         label: "Reportes" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador", PUBLISHED: "Publicado", REGISTRATION_OPEN: "Inscripciones",
  REGISTRATION_CLOSED: "Inscripciones cerradas", IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado", CANCELLED: "Cancelado",
};

const inp: React.CSSProperties = {
  flex: 1, boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: "#e2e8f0",
  outline: "none", fontFamily: "inherit",
};

// ─── Permissions editor ───────────────────────────────────────────────────────

function PermissionsEditor({ member }: { member: Member }) {
  const currentPerms = member.permissions as string[];
  const [, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const perm = e.target.value;
    const newPerms = e.target.checked
      ? [...currentPerms, perm]
      : currentPerms.filter((p) => p !== perm);
    startTransition(() => { updateCollaboratorPermissions(member.id, newPerms); });
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
      {ALL_PERMISSIONS.map((p) => (
        <label key={p.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#64748b" }}>
          <input
            type="checkbox"
            value={p.value}
            defaultChecked={currentPerms.includes(p.value)}
            onChange={handleChange}
            style={{ accentColor: A, width: 13, height: 13 }}
          />
          {p.label}
        </label>
      ))}
    </div>
  );
}

// ─── Tournament access editor ─────────────────────────────────────────────────

function TournamentAccessEditor({ member, tournaments }: { member: Member; tournaments: Tournament[] }) {
  const initialIds = member.tournamentAccess.map((a) => a.tournamentId);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [mode, setMode] = useState<"all" | "restricted">(initialIds.length === 0 ? "all" : "restricted");
  const [saving, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleModeChange = (newMode: "all" | "restricted") => {
    setMode(newMode);
    if (newMode === "all") {
      setSelectedIds([]);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const ids = mode === "all" ? [] : selectedIds;
    startTransition(async () => {
      await updateCollaboratorTournamentAccess(member.id, ids);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (tournaments.length === 0) {
    return (
      <p style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
        No hay torneos creados aún.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Acceso a torneos
      </p>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { id: "all", label: "Todos los torneos" },
          { id: "restricted", label: "Solo torneos seleccionados" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleModeChange(opt.id as "all" | "restricted")}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${mode === opt.id ? A + "55" : "rgba(255,255,255,0.1)"}`,
              background: mode === opt.id ? A + "15" : "transparent",
              color: mode === opt.id ? A : "#64748b",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tournament list (only shown in restricted mode) */}
      {mode === "restricted" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          {tournaments.map((t) => (
            <label
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "6px 8px", borderRadius: 7,
                background: selectedIds.includes(t.id) ? A + "0d" : "transparent",
                border: `1px solid ${selectedIds.includes(t.id) ? A + "30" : "transparent"}`,
                transition: "all .1s",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(t.id)}
                onChange={() => handleToggle(t.id)}
                style={{ accentColor: A, width: 13, height: 13, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: "#e2e8f0", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.name}
              </span>
              <span style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>
                {STATUS_LABELS[t.status] ?? t.status}
              </span>
            </label>
          ))}
          {selectedIds.length === 0 && (
            <p style={{ fontSize: 11, color: "#f87171", paddingLeft: 4 }}>
              Seleccioná al menos un torneo, o elegí "Todos los torneos".
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={saving || (mode === "restricted" && selectedIds.length === 0)}
        onClick={handleSave}
        style={{
          padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
          background: saved ? "rgba(163,230,53,.2)" : "rgba(163,230,53,.12)",
          border: `1px solid ${saved ? A + "55" : "rgba(163,230,53,.25)"}`,
          color: saved ? A : A,
          cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar acceso"}
      </button>
    </div>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member, currentUserId, tournaments }: { member: Member; currentUserId: string; tournaments: Tournament[] }) {
  const isOwner = member.role === "OWNER";
  const isSelf = member.userId === currentUserId;
  const [isPending, startTransition] = useTransition();
  const rc = ROLE_COLORS[member.role] ?? ROLE_COLORS.COLLABORATOR;

  return (
    <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
              {member.user.name ?? member.user.email}
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: rc.bg, color: rc.color }}>
              {ROLE_LABELS[member.role]}
            </span>
            {isSelf && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(163,230,53,.12)", color: A }}>
                Vos
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#334155" }}>{member.user.email}</p>

          {/* Collaborator controls */}
          {member.role === "COLLABORATOR" && (
            <>
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Permisos de acción
                </p>
                <PermissionsEditor member={member} />
              </div>
              <TournamentAccessEditor member={member} tournaments={tournaments} />
            </>
          )}
        </div>

        {!isOwner && !isSelf && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => { removeCollaborator(member.id); })}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.1)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Invite form ──────────────────────────────────────────────────────────────

function InviteForm() {
  const [state, action, isPending] = useActionState<ConfigActionState, FormData>(inviteCollaborator, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) {
      submitted.current = false;
      formRef.current?.reset();
    }
  }, [isPending, state]);

  return (
    <form ref={formRef} action={action}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input
          name="email"
          type="email"
          placeholder="email@ejemplo.com"
          required
          style={inp}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "9px 18px", borderRadius: 8, background: isPending ? "rgba(255,255,255,0.06)" : "#a3e635", border: "none", color: isPending ? "#64748b" : "#080e1a", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {isPending ? "Invitando..." : "Invitar"}
        </button>
      </div>
      {state?.error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{state.error}</p>
      )}
      <p style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
        El usuario debe tener una cuenta registrada en el sistema.
      </p>
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CollaboratorsManager({
  members,
  currentUserId,
  tournaments,
}: {
  members: Member[];
  currentUserId: string;
  tournaments: Tournament[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Invitar por email
        </p>
        <InviteForm />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {members.map((m) => (
          <MemberRow key={m.id} member={m} currentUserId={currentUserId} tournaments={tournaments} />
        ))}
      </div>
    </div>
  );
}
