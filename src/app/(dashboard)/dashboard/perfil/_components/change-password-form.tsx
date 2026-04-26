"use client";

import { useActionState, useEffect } from "react";
import { changePassword, type ActionState } from "@/modules/auth/actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

const INPUT_STYLE: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8, fontSize: 13,
  background: "oklch(20% 0.012 250)",
  border: "1px solid oklch(30% 0.01 250)",
  color: "var(--text-primary)",
  outline: "none",
  width: "100%", boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block",
};

export function ChangePasswordForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(changePassword, null);

  useEffect(() => {
    if (state?.error === "__changed__") {
      toast({ type: "success", title: "Contraseña actualizada", description: "Tu contraseña fue cambiada correctamente." });
    }
  }, [state]);

  const globalError = state?.error && state.error !== "__changed__" && !state.fieldErrors
    ? state.error
    : null;

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 8,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          fontSize: 13, color: "#f87171",
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {globalError}
        </div>
      )}

      <div>
        <label style={LABEL_STYLE}>Contraseña actual</label>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          style={INPUT_STYLE}
        />
        {state?.fieldErrors?.currentPassword && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{state.fieldErrors.currentPassword[0]}</p>
        )}
      </div>

      <div>
        <label style={LABEL_STYLE}>Nueva contraseña</label>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
          disabled={isPending}
          style={INPUT_STYLE}
        />
        {state?.fieldErrors?.newPassword && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{state.fieldErrors.newPassword[0]}</p>
        )}
      </div>

      <div>
        <label style={LABEL_STYLE}>Confirmar nueva contraseña</label>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          style={INPUT_STYLE}
        />
        {state?.fieldErrors?.confirmPassword && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{state.fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: "var(--accent)", color: "#000", border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {isPending ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
