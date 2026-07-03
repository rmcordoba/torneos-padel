"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, loginWithGoogle, type ActionState } from "@/modules/auth/actions";
import { Loader2, AlertCircle } from "lucide-react";

const ACCENT = "#a3e635";

const lbl: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  display: "block",
  marginBottom: 8,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 46,
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#f1f5f9",
  fontSize: 14,
  padding: "0 14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export function LoginForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(login, null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Google sign-in */}
      <form action={loginWithGoogle}>
        <button
          type="submit"
          style={{
            width: "100%",
            height: 46,
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#e2e8f0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-space), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303C33.973 32.573 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a11.966 11.966 0 01-4.087 5.571l6.19 5.238C39.712 39.056 44 32 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          Continuar con Google
        </button>
      </form>

      {/* Separador */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.06em" }}>O CON EMAIL</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {state?.error && (
          <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 11, padding: "12px 14px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
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
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(163,230,53,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(163,230,53,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {state?.fieldErrors?.email && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label htmlFor="password" style={{ ...lbl, marginBottom: 0 }}>Contraseña</label>
            <Link href="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: "none", textTransform: "none" }}>
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
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(163,230,53,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(163,230,53,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {state?.fieldErrors?.password && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={isPending ? undefined : "btn-lime"}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 11,
            border: "none",
            background: isPending ? "rgba(163,230,53,0.4)" : ACCENT,
            color: "#080e1a",
            fontSize: 14,
            fontWeight: 800,
            cursor: isPending ? "not-allowed" : "pointer",
            marginTop: 4,
            fontFamily: "var(--font-space), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: isPending ? "none" : "0 0 24px rgba(163,230,53,0.3)",
          }}
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Iniciando sesión...</>
          ) : (
            "Iniciar sesión →"
          )}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#475569", margin: 0 }}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" style={{ fontWeight: 700, color: ACCENT, textDecoration: "none" }}>
            Registrate gratis
          </Link>
        </p>
      </form>
    </div>
  );
}
