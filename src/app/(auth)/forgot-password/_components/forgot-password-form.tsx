"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type ActionState } from "@/modules/auth/actions";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
  display: "block", marginBottom: 7, letterSpacing: "0.01em",
};
const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", height: 42, borderRadius: 9,
  border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
  color: "var(--text-primary)", fontSize: 14, padding: "0 14px",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(forgotPassword, null);

  const sent = state?.error === "__sent__";

  if (sent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={24} style={{ color: "#a3e635" }} />
          </div>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
            Revisá tu email
          </p>
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0, lineHeight: 1.6 }}>
            Si existe una cuenta con ese email, vas a recibir un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
          </p>
        </div>
        <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ArrowLeft size={13} />
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
        Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
      </p>

      {state?.error && state.error !== "__sent__" && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" style={lbl}>Email</label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          placeholder="tu@email.com" required disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
        {state?.fieldErrors?.email && (
          <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <button
        type="submit" disabled={isPending}
        style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: "#a3e635", color: "#0a0f0a", fontSize: 14, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1, fontFamily: "Space Grotesk, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {isPending ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : "Enviar enlace"}
      </button>

      <Link href="/login" style={{ textAlign: "center", fontSize: 13, color: "var(--text-faint)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <ArrowLeft size={13} />
        Volver al login
      </Link>
    </form>
  );
}
