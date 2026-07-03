"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createClub, type OrganizerActionState } from "@/modules/organizers/actions";
import { Loader2, AlertCircle } from "lucide-react";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function Field({ id, name, type = "text", placeholder, label, autoComplete, disabled, error, value, onChange }: {
  id: string; name: string; type?: string; placeholder?: string; label: string;
  autoComplete?: string; disabled?: boolean; error?: string;
  value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} style={lbl}>{label}</label>
      <input
        id={id} name={name} type={type} placeholder={placeholder}
        autoComplete={autoComplete} required disabled={disabled}
        value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        defaultValue={onChange ? undefined : ""}
        style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
      />
      {error && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

export function CreateClubForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [state, action, isPending] = useActionState<OrganizerActionState, FormData>(createClub, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {state.error}
        </div>
      )}

      <Field
        id="name" name="name" placeholder="Club Pádel Central" label="Nombre del club"
        disabled={isPending} error={state?.fieldErrors?.name?.[0]}
        value={name} onChange={setName}
      />

      <div>
        <label htmlFor="slug" style={lbl}>Identificador del sitio</label>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <span style={{
            height: 42, display: "flex", alignItems: "center", padding: "0 10px",
            fontSize: 13, color: "var(--text-dimmer)", whiteSpace: "nowrap",
            border: "1px solid var(--border-default)", borderRight: "none",
            borderRadius: "9px 0 0 9px", background: "rgba(255,255,255,0.02)",
          }}>
            /c/
          </span>
          <input
            id="slug" name="slug" required disabled={isPending}
            value={effectiveSlug}
            onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
            placeholder="club-padel-central"
            style={{ ...inputStyle, borderRadius: "0 9px 9px 0", opacity: isPending ? 0.6 : 1 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#a3e635")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
          />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 5 }}>
          Será la dirección pública de tu club. Solo minúsculas, números y guiones.
        </p>
        {state?.fieldErrors?.slug?.[0] && <p style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>{state.fieldErrors.slug[0]}</p>}
      </div>

      {!isLoggedIn && (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tu cuenta de administrador
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field id="firstName" name="firstName" placeholder="Juan" label="Nombre" disabled={isPending} error={state?.fieldErrors?.firstName?.[0]} />
              <Field id="lastName" name="lastName" placeholder="Pérez" label="Apellido" disabled={isPending} error={state?.fieldErrors?.lastName?.[0]} />
            </div>
          </div>
          <Field id="email" name="email" type="email" placeholder="tu@email.com" label="Email" autoComplete="email" disabled={isPending} error={state?.fieldErrors?.email?.[0]} />
          <Field id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" label="Contraseña" autoComplete="new-password" disabled={isPending} error={state?.fieldErrors?.password?.[0]} />
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%", height: 44, borderRadius: 10, border: "none",
          background: "#a3e635", color: "#0a0f0a", fontSize: 14, fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1,
          marginTop: 4, fontFamily: "var(--font-space), sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Creando club...</>
        ) : (
          "Crear mi club"
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
        {isLoggedIn ? (
          <>¿Querés volver?{" "}
            <Link href="/dashboard" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Ir al panel</Link>
          </>
        ) : (
          <>¿Ya tenés cuenta?{" "}
            <Link href="/login" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Iniciá sesión</Link>
          </>
        )}
      </p>
    </form>
  );
}
