"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type ActionState } from "@/modules/auth/actions";
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

function Field({ id, name, type = "text", placeholder, label, autoComplete, disabled, error }: {
  id: string; name: string; type?: string; placeholder?: string; label: string;
  autoComplete?: string; disabled?: boolean; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={lbl}>{label}</label>
      <input
        id={id} name={name} type={type} placeholder={placeholder}
        autoComplete={autoComplete} required disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
      />
      {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(register, null);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field id="firstName" name="firstName" placeholder="Juan" label="Nombre" disabled={isPending} error={state?.fieldErrors?.firstName?.[0]} />
        <Field id="lastName" name="lastName" placeholder="Pérez" label="Apellido" disabled={isPending} error={state?.fieldErrors?.lastName?.[0]} />
      </div>

      <Field id="email" name="email" type="email" placeholder="tu@email.com" label="Email" autoComplete="email" disabled={isPending} error={state?.fieldErrors?.email?.[0]} />

      <Field id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" label="Contraseña" autoComplete="new-password" disabled={isPending} error={state?.fieldErrors?.password?.[0]} />

      {/* Password strength hint */}
      <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: -8 }}>
        Usá al menos 8 caracteres con letras y números.
      </p>

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
          fontFamily: "var(--font-space), sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</>
        ) : (
          "Crear cuenta gratuita"
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
