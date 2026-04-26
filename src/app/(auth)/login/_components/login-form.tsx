"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type ActionState } from "@/modules/auth/actions";
import { Loader2, AlertCircle } from "lucide-react";

const lbl: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 7,
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 42,
  borderRadius: 9,
  border: "1px solid var(--border-default)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontSize: 14,
  padding: "0 14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export function LoginForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(login, null);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" style={lbl}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
        {state?.fieldErrors?.email && (
          <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <label htmlFor="password" style={{ ...lbl, marginBottom: 0 }}>Contraseña</label>
          <Link href="/forgot-password" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
        {state?.fieldErrors?.password && (
          <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          border: "none",
          background: "#a3e635",
          color: "#0a0f0a",
          fontSize: 14,
          fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          marginTop: 4,
          fontFamily: "Space Grotesk, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Iniciando sesión...</>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
        ¿No tenés cuenta?{" "}
        <Link href="/register" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
          Registrate gratis
        </Link>
      </p>
    </form>
  );
}
