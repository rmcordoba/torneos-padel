"use client";

import { useActionState, useTransition, useRef, useEffect } from "react";
import {
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermissions,
  type ConfigActionState,
} from "@/modules/config/actions";
import type { getOrganizerConfig } from "@/modules/config/queries";

type Member = NonNullable<Awaited<ReturnType<typeof getOrganizerConfig>>>["members"][number];

const A = "#a3e635";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ORGANIZER: "Organizador",
  COLLABORATOR: "Colaborador",
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  OWNER:        { bg: "rgba(251,191,36,.15)", color: "#fbbf24" },
  ORGANIZER:    { bg: "rgba(59,130,246,.15)", color: "#60a5fa" },
  COLLABORATOR: { bg: "oklch(22% 0.01 250)",  color: "var(--text-faint)" },
};

const ALL_PERMISSIONS = [
  { value: "MANAGE_REGISTRATIONS", label: "Inscripciones" },
  { value: "MANAGE_RESULTS",       label: "Resultados" },
  { value: "MANAGE_SCHEDULE",      label: "Calendario" },
  { value: "VIEW_REPORTS",         label: "Reportes" },
];

const inp: React.CSSProperties = {
  flex: 1, boxSizing: "border-box",
  background: "oklch(20% 0.012 250)",
  border: "1px solid oklch(30% 0.01 250)",
  borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: "var(--text-secondary)",
  outline: "none", fontFamily: "inherit",
};

function PermissionsEditor({ member }: { member: Member }) {
  const currentPerms = member.permissions as string[];
  const [, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const perm = e.target.value;
    const newPerms = e.target.checked
      ? [...currentPerms, perm]
      : currentPerms.filter((p) => p !== perm);
    startTransition(() => updateCollaboratorPermissions(member.id, newPerms));
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
      {ALL_PERMISSIONS.map((p) => (
        <label key={p.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--text-faint)" }}>
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

function MemberRow({ member, currentUserId }: { member: Member; currentUserId: string }) {
  const isOwner = member.role === "OWNER";
  const isSelf = member.userId === currentUserId;
  const [isPending, startTransition] = useTransition();
  const rc = ROLE_COLORS[member.role] ?? ROLE_COLORS.COLLABORATOR;

  return (
    <div style={{ borderRadius: 10, border: "1px solid oklch(26% 0.01 250)", background: "oklch(18% 0.012 250)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
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
          <p style={{ fontSize: 11, color: "var(--text-darkest)" }}>{member.user.email}</p>
          {member.role === "COLLABORATOR" && <PermissionsEditor member={member} />}
        </div>

        {!isOwner && !isSelf && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => removeCollaborator(member.id))}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.1)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

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
          style={{ padding: "9px 18px", borderRadius: 8, background: isPending ? "oklch(24% 0.01 250)" : "var(--accent)", border: "none", color: isPending ? "var(--text-faint)" : "#0f172a", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {isPending ? "Invitando..." : "Invitar"}
        </button>
      </div>
      {state?.error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{state.error}</p>
      )}
      <p style={{ fontSize: 11, color: "var(--text-darkest)", marginTop: 6 }}>
        El usuario debe tener una cuenta registrada en el sistema.
      </p>
    </form>
  );
}

export function CollaboratorsManager({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Invitar por email
        </p>
        <InviteForm />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {members.map((m) => (
          <MemberRow key={m.id} member={m} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
}
