"use client";

import { useActionState, useState } from "react";
import { updateTournament, type TournamentActionState } from "@/modules/tournaments/actions";
import { AlertCircle, Check, Loader2, Globe, Lock, CalendarClock } from "lucide-react";

interface Props {
  tournamentId: string;
  defaultValues: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    registrationDeadline: string | null;
    isPublic: boolean;
    hasWeekdayPlay: boolean;
  };
}

const label = { fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 6 };
const fieldErr = { fontSize: 11, color: "#f87171", marginTop: 4 };

export function TournamentEditForm({ tournamentId, defaultValues }: Props) {
  const action = updateTournament.bind(null, tournamentId);
  const [state, formAction, isPending] = useActionState<TournamentActionState, FormData>(action, null);
  const [isPublic, setIsPublic] = useState(defaultValues.isPublic);
  const [hasWeekdayPlay, setHasWeekdayPlay] = useState(defaultValues.hasWeekdayPlay);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} /> {state.error}
        </div>
      )}

      <div>
        <label style={label}>Nombre del torneo <span style={{ color: "#f87171" }}>*</span></label>
        <input name="name" defaultValue={defaultValues.name} placeholder="Ej: Copa Verano 2025" disabled={isPending} className="field-input" />
        {state?.fieldErrors?.name && <p style={fieldErr}>{state.fieldErrors.name[0]}</p>}
      </div>

      <div>
        <label style={label}>Descripción</label>
        <textarea name="description" defaultValue={defaultValues.description ?? ""} placeholder="Descripción, premios, requisitos..." rows={3} disabled={isPending} className="field-input" style={{ resize: "vertical" }} />
        {state?.fieldErrors?.description && <p style={fieldErr}>{state.fieldErrors.description[0]}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Fecha de inicio <span style={{ color: "#f87171" }}>*</span></label>
          <input name="startDate" type="date" defaultValue={defaultValues.startDate} disabled={isPending} className="field-input" />
          {state?.fieldErrors?.startDate && <p style={fieldErr}>{state.fieldErrors.startDate[0]}</p>}
        </div>
        <div>
          <label style={label}>Fecha de fin <span style={{ color: "#f87171" }}>*</span></label>
          <input name="endDate" type="date" defaultValue={defaultValues.endDate} disabled={isPending} className="field-input" />
          {state?.fieldErrors?.endDate && <p style={fieldErr}>{state.fieldErrors.endDate[0]}</p>}
        </div>
      </div>

      <div>
        <label style={label}>Cierre de inscripciones</label>
        <input name="registrationDeadline" type="date" defaultValue={defaultValues.registrationDeadline ?? ""} disabled={isPending} className="field-input" style={{ width: "auto" }} />
      </div>

      {/* Visibilidad toggle */}
      <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", padding: "14px 16px" }}>
        <input type="hidden" name="isPublic" value={String(isPublic)} />
        <button type="button" onClick={() => setIsPublic((p) => !p)} disabled={isPending} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: isPublic ? "var(--accent-15)" : "var(--bg-elevated)", border: `1px solid ${isPublic ? "var(--accent-30)" : "var(--border-default)"}`, flexShrink: 0 }}>
            {isPublic ? <Globe size={16} color="var(--accent)" /> : <Lock size={16} color="var(--text-faint)" />}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{isPublic ? "Público" : "Privado"}</p>
            <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>
              {isPublic ? "Visible en el portal público" : "Solo visible para el organizador"}
            </p>
          </div>
          {/* Toggle switch */}
          <div style={{ marginLeft: "auto", position: "relative", width: 44, height: 24, borderRadius: 12, background: isPublic ? "var(--accent)" : "var(--border-strong)", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 2, left: isPublic ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: isPublic ? "#0a0f0a" : "var(--bg-elevated)", transition: "left 0.2s", display: "block" }} />
          </div>
        </button>
      </div>

      {/* Juego entre semana toggle */}
      <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", padding: "14px 16px" }}>
        <input type="hidden" name="hasWeekdayPlay" value={String(hasWeekdayPlay)} />
        <button type="button" onClick={() => setHasWeekdayPlay((p) => !p)} disabled={isPending} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: hasWeekdayPlay ? "var(--accent-15)" : "var(--bg-elevated)", border: `1px solid ${hasWeekdayPlay ? "var(--accent-30)" : "var(--border-default)"}`, flexShrink: 0 }}>
            <CalendarClock size={16} color={hasWeekdayPlay ? "var(--accent)" : "var(--text-faint)"} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Se juega entre semana (L–V)</p>
            <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>
              {hasWeekdayPlay ? "Se pide disponibilidad horaria al inscribir" : "No se pide disponibilidad horaria"}
            </p>
          </div>
          <div style={{ marginLeft: "auto", position: "relative", width: 44, height: 24, borderRadius: 12, background: hasWeekdayPlay ? "var(--accent)" : "var(--border-strong)", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 2, left: hasWeekdayPlay ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: hasWeekdayPlay ? "#0a0f0a" : "var(--bg-elevated)", transition: "left 0.2s", display: "block" }} />
          </div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" onClick={() => history.back()} disabled={isPending} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isPending ? 0.5 : 1 }}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Check size={14} /> Guardar cambios</>}
        </button>
      </div>
    </form>
  );
}
