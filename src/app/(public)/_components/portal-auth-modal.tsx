"use client";

import { useActionState, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { loginPortal, registerPortal, type PortalAuthState } from "@/modules/auth/portal-actions";

const G  = "#059669";
const GL = "#f0fdf4";
const GB = "#d1fae5";

function AField({
  label, name, type = "text", placeholder, required, error, disabled,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; error?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: "100%", height: 40, padding: "0 14px",
          borderRadius: 12, border: `1px solid ${focused ? G : "#e2e8f0"}`,
          fontSize: 13, color: "#1e293b", background: "#f8fafc",
          outline: "none", opacity: disabled ? 0.6 : 1,
          boxSizing: "border-box", transition: "border-color 0.15s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && (
        <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

function LoginTab({ onClose, callbackUrl }: { onClose: () => void; callbackUrl: string }) {
  const [state, action, pending] = useActionState<PortalAuthState, FormData>(loginPortal, null);

  return (
    <form action={action} style={{ padding: "0 24px 24px" }}>
      <style>{`@keyframes am-spin { to { transform: rotate(360deg); } } .am-spin { animation: am-spin 0.8s linear infinite; }`}</style>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <AField label="Email" name="email" type="email" placeholder="tu@email.com" required disabled={pending} error={state?.fieldErrors?.email?.[0]} />
      <AField label="Contraseña" name="password" type="password" placeholder="••••••••" required disabled={pending} error={state?.fieldErrors?.password?.[0]} />

      {state?.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 12px", marginBottom: 16 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%", height: 44, borderRadius: 12, border: "none",
          background: pending ? "#86efac" : G,
          color: "#fff", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: pending ? "not-allowed" : "pointer",
          boxShadow: "0 2px 10px rgba(5,150,105,.25)",
          fontFamily: "inherit",
        }}
      >
        {pending ? (
          <><span className="am-spin" style={{ display: "inline-block" }}>⟳</span> Ingresando…</>
        ) : (
          "Ingresar →"
        )}
      </button>
    </form>
  );
}

function RegisterTab({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [state, action, pending] = useActionState<PortalAuthState, FormData>(registerPortal, null);

  return (
    <form action={action} style={{ padding: "0 24px 24px" }}>
      <style>{`@keyframes am-spin { to { transform: rotate(360deg); } } .am-spin { animation: am-spin 0.8s linear infinite; }`}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <AField label="Nombre" name="firstName" placeholder="Juan" required disabled={pending} error={state?.fieldErrors?.firstName?.[0]} />
        <AField label="Apellido" name="lastName" placeholder="Pérez" required disabled={pending} error={state?.fieldErrors?.lastName?.[0]} />
      </div>
      <AField label="Email" name="email" type="email" placeholder="tu@email.com" required disabled={pending} error={state?.fieldErrors?.email?.[0]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <AField label="Contraseña" name="password" type="password" placeholder="Mín. 8 chars" required disabled={pending} error={state?.fieldErrors?.password?.[0]} />
        <AField label="Repetir" name="confirmPassword" type="password" placeholder="Repetir" disabled={pending} />
      </div>

      {state?.error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 12px", marginBottom: 16 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%", height: 44, borderRadius: 12, border: "none",
          background: pending ? "#86efac" : G,
          color: "#fff", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: pending ? "not-allowed" : "pointer",
          boxShadow: "0 2px 10px rgba(5,150,105,.25)",
          fontFamily: "inherit",
        }}
      >
        {pending ? (
          <><span className="am-spin" style={{ display: "inline-block" }}>⟳</span> Creando cuenta…</>
        ) : (
          "Crear cuenta →"
        )}
      </button>
    </form>
  );
}

export function PortalAuthModal({
  defaultTab = "login",
  onClose,
}: {
  defaultTab?: "login" | "register";
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ width: "100%", maxWidth: 420, borderRadius: 24, background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", overflow: "hidden", animation: "slideUpModal .28s cubic-bezier(.22,1,.36,1)" }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: GL, border: `2px solid ${GB}`, fontSize: 18 }}>
                🎾
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>
                PádelPro
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9" }}>
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "10px 20px", fontSize: 13, fontWeight: 700,
                    color: tab === t ? G : "#94a3b8",
                    borderBottom: `2px solid ${tab === t ? G : "transparent"}`,
                    marginBottom: -2,
                    background: "none", border: "none",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {t === "login" ? "Iniciar sesión" : "Registrarse"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, flexShrink: 0, marginTop: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ paddingTop: 20 }}>
          {tab === "login" ? (
            <LoginTab onClose={onClose} callbackUrl={pathname} />
          ) : (
            <RegisterTab onSuccess={() => setTab("login")} />
          )}
        </div>

        {/* Footer switch */}
        <div style={{ paddingBottom: 20, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
          {tab === "login" ? (
            <>
              ¿No tenés cuenta?{" "}
              <button
                onClick={() => setTab("register")}
                style={{ fontWeight: 700, color: G, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                Registrate gratis
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button
                onClick={() => setTab("login")}
                style={{ fontWeight: 700, color: G, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                Iniciá sesión
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
