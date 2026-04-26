import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Status badge — matches design reference dark theme ──────────────────── */

type StatusKey =
  | "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED"
  | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  | "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED"
  | "SCHEDULED" | "WALKOVER" | "RETIRED" | "POSTPONED"
  | "SEEDING"
  | "activo" | "inscripciones" | "finalizado" | "pendiente"
  | "aprobada" | "rechazada" | "lista_espera"
  | "abierta" | "llena" | "cerrada"
  | "programado" | "en_curso" | "jugado";

const STATUS_MAP: Record<StatusKey, { label: string; bg: string; color: string; border: string; pulse?: boolean }> = {
  // Tournament statuses
  DRAFT:                { label: "Borrador",              bg: "rgba(148,163,184,0.10)", color: "#64748b", border: "rgba(148,163,184,0.20)" },
  PUBLISHED:            { label: "Publicado",             bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  REGISTRATION_OPEN:    { label: "Inscripciones abiertas",bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.25)" },
  REGISTRATION_CLOSED:  { label: "Inscripciones cerradas",bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  IN_PROGRESS:          { label: "En curso",              bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.30)", pulse: true },
  COMPLETED:            { label: "Finalizado",            bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.20)" },
  CANCELLED:            { label: "Cancelado",             bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  SEEDING:              { label: "Armando fixture",       bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },

  // Registration statuses
  PENDING:    { label: "Pendiente",      bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  APPROVED:   { label: "Aprobada",       bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.25)" },
  REJECTED:   { label: "Rechazada",      bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  WAITLISTED: { label: "Lista de espera",bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },

  // Match statuses
  SCHEDULED:  { label: "Programado",    bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  WALKOVER:   { label: "Walkover",      bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  RETIRED:    { label: "Retiro",        bg: "rgba(249,115,22,0.12)",  color: "#f97316", border: "rgba(249,115,22,0.25)" },
  POSTPONED:  { label: "Postergado",    bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },

  // Design reference aliases
  activo:       { label: "Activo",          bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.25)", pulse: true },
  inscripciones:{ label: "Inscripciones",   bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  finalizado:   { label: "Finalizado",      bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.20)" },
  pendiente:    { label: "Pendiente",       bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  aprobada:     { label: "Aprobada",        bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.25)" },
  rechazada:    { label: "Rechazada",       bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  lista_espera: { label: "Lista de espera", bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  abierta:      { label: "Abierta",         bg: "rgba(163,230,53,0.10)",  color: "#a3e635", border: "rgba(163,230,53,0.20)" },
  llena:        { label: "Llena",           bg: "rgba(248,113,113,0.10)", color: "#f87171", border: "rgba(248,113,113,0.20)" },
  cerrada:      { label: "Cerrada",         bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.20)" },
  programado:   { label: "Programado",      bg: "rgba(96,165,250,0.10)",  color: "#60a5fa", border: "rgba(96,165,250,0.20)" },
  en_curso:     { label: "En curso",        bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.30)", pulse: true },
  jugado:       { label: "Jugado",          bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.20)" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "sport" | "purple" | "blue";
}

function Badge({ status, variant, className, children, ...props }: BadgeProps) {
  if (status) {
    const s = STATUS_MAP[status as StatusKey] ?? {
      label: status,
      bg: "rgba(148,163,184,0.10)",
      color: "#94a3b8",
      border: "rgba(148,163,184,0.20)",
    };
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}
        {...props}
      >
        {s.pulse && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", animation: "pulse-dot 1.5s infinite" }} />
        )}
        {children ?? s.label}
      </span>
    );
  }

  /* Legacy variant support for any code that still uses variant prop */
  const variantStyles: Record<string, React.CSSProperties> = {
    default:     { background: "rgba(163,230,53,0.15)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.3)" },
    secondary:   { background: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.20)" },
    outline:     { background: "transparent", color: "#64748b", border: "1px solid rgba(148,163,184,0.25)" },
    destructive: { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" },
    success:     { background: "rgba(163,230,53,0.12)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.25)" },
    warning:     { background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
    sport:       { background: "rgba(163,230,53,0.15)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.3)" },
    purple:      { background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" },
    blue:        { background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" },
  };

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
        ...(variantStyles[variant ?? "default"] ?? variantStyles.default),
      }}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
export const badgeVariants = () => "";
