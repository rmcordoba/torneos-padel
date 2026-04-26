"use client";

import { useActionState } from "react";
import { createPlayer, type PlayerActionState } from "@/modules/players/actions";
import { AlertCircle, Check, Loader2 } from "lucide-react";

export function PlayerCreateForm() {
  const [state, formAction, isPending] = useActionState<PlayerActionState, FormData>(
    createPlayer,
    null
  );

  const label = { fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const fieldErr = { fontSize: 11, color: "#f87171", marginTop: 4 };

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} /> {state.error}
        </div>
      )}

      {/* Email */}
      <div>
        <label style={label}>Email <span style={{ color: "#f87171" }}>*</span></label>
        <input name="email" type="email" placeholder="jugador@email.com" disabled={isPending} className="field-input" autoComplete="off" />
        {state?.fieldErrors?.email && <p style={fieldErr}>{state.fieldErrors.email[0]}</p>}
        <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 6 }}>
          Si ya tiene cuenta en el sistema, se vinculará el perfil. Si no, se creará una cuenta pendiente.
        </p>
      </div>

      {/* Nombre y Apellido */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Nombre <span style={{ color: "#f87171" }}>*</span></label>
          <input name="firstName" placeholder="Juan" disabled={isPending} className="field-input" />
          {state?.fieldErrors?.firstName && <p style={fieldErr}>{state.fieldErrors.firstName[0]}</p>}
        </div>
        <div>
          <label style={label}>Apellido <span style={{ color: "#f87171" }}>*</span></label>
          <input name="lastName" placeholder="García" disabled={isPending} className="field-input" />
          {state?.fieldErrors?.lastName && <p style={fieldErr}>{state.fieldErrors.lastName[0]}</p>}
        </div>
      </div>

      {/* DNI y Teléfono */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>DNI</label>
          <input name="dni" placeholder="12345678" disabled={isPending} className="field-input" />
          {state?.fieldErrors?.dni && <p style={fieldErr}>{state.fieldErrors.dni[0]}</p>}
        </div>
        <div>
          <label style={label}>Teléfono</label>
          <input name="phone" placeholder="+54 11 1234-5678" disabled={isPending} className="field-input" />
        </div>
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <label style={label}>Fecha de nacimiento</label>
        <input name="birthDate" type="date" disabled={isPending} className="field-input" style={{ width: "auto" }} />
      </div>

      {/* Botones */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" onClick={() => history.back()} disabled={isPending} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: isPending ? 0.5 : 1 }}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Creando...</> : <><Check size={14} /> Crear jugador</>}
        </button>
      </div>
    </form>
  );
}
