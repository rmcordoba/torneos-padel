"use client";

import { useActionState } from "react";
import { updatePlayerProfile, type PlayerActionState } from "@/modules/players/actions";
import { AlertCircle, Check, Loader2 } from "lucide-react";

interface Props {
  playerProfileId: string;
  defaultValues: {
    firstName: string;
    lastName: string;
    phone: string | null;
    dni: string | null;
    birthDate: string | null;
  };
}

export function PlayerEditForm({ playerProfileId, defaultValues }: Props) {
  const action = updatePlayerProfile.bind(null, playerProfileId);
  const [state, formAction, isPending] = useActionState<PlayerActionState, FormData>(action, null);

  const label = { fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const fieldErr = { fontSize: 11, color: "#f87171", marginTop: 4 };

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} /> {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Nombre <span style={{ color: "#f87171" }}>*</span></label>
          <input name="firstName" defaultValue={defaultValues.firstName} disabled={isPending} className="field-input" />
          {state?.fieldErrors?.firstName && <p style={fieldErr}>{state.fieldErrors.firstName[0]}</p>}
        </div>
        <div>
          <label style={label}>Apellido <span style={{ color: "#f87171" }}>*</span></label>
          <input name="lastName" defaultValue={defaultValues.lastName} disabled={isPending} className="field-input" />
          {state?.fieldErrors?.lastName && <p style={fieldErr}>{state.fieldErrors.lastName[0]}</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>DNI</label>
          <input name="dni" defaultValue={defaultValues.dni ?? ""} disabled={isPending} className="field-input" />
          {state?.fieldErrors?.dni && <p style={fieldErr}>{state.fieldErrors.dni[0]}</p>}
        </div>
        <div>
          <label style={label}>Teléfono</label>
          <input name="phone" defaultValue={defaultValues.phone ?? ""} disabled={isPending} className="field-input" />
        </div>
      </div>

      <div>
        <label style={label}>Fecha de nacimiento</label>
        <input name="birthDate" type="date" defaultValue={defaultValues.birthDate ?? ""} disabled={isPending} className="field-input" style={{ width: "auto" }} />
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
