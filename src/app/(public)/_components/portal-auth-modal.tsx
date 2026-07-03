"use client";

import { useActionState, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { loginPortal, registerPortal, type PortalAuthState } from "@/modules/auth/portal-actions";
import { loginWithGoogle } from "@/modules/auth/actions";

const ACCENT        = "#a3e635";
const ACCENT_BG     = "rgba(163,230,53,0.10)";
const ACCENT_BORDER = "rgba(163,230,53,0.22)";
const GLASS_BG      = "rgba(8,16,36,0.96)";
const BORDER        = "rgba(255,255,255,0.08)";
const INPUT_BG      = "rgba(255,255,255,0.05)";

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
        {required && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: "100%", height: 40, padding: "0 14px",
          borderRadius: 10,
          border: `1px solid ${focused ? ACCENT_BORDER : BORDER}`,
          fontSize: 13, color: "#f1f5f9",
          background: INPUT_BG,
          outline: "none",
          opacity: disabled ? 0.6 : 1,
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && (
        <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

function LoginTab({ onClose, callbackUrl }: { onClose: () => void; callbackUrl: string }) {
  const [state, action, pending] = useActionState<PortalAuthState, FormData>(loginPortal, null);

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <style>{`@keyframes am-spin { to { transform: rotate(360deg); } } .am-spin { animation: am-spin 0.8s linear infinite; }`}</style>

      {/* Google */}
      <form action={loginWithGoogle} style={{ marginBottom: 16 }}>
        <button
          type="submit"
          style={{
            width: "100%", height: 44, borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.05)",
            color: "#e2e8f0", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: "pointer", fontFamily: "inherit",
            transition: "background .15s",
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.05em" }}>O CON EMAIL</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <form action={action} style={{ margin: 0 }}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <AField label="Email" name="email" type="email" placeholder="tu@email.com" required disabled={pending} error={state?.fieldErrors?.email?.[0]} />
        <AField label="Contraseña" name="password" type="password" placeholder="••••••••" required disabled={pending} error={state?.fieldErrors?.password?.[0]} />

        <div style={{ textAlign: "right", marginTop: -8, marginBottom: 14 }}>
          <a href="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {state?.error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%", height: 44, borderRadius: 12, border: "none",
            background: pending ? "rgba(163,230,53,0.4)" : ACCENT,
            color: "#0f172a", fontSize: 14, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: pending ? "not-allowed" : "pointer",
            boxShadow: pending ? "none" : "0 0 20px rgba(163,230,53,0.3)",
            fontFamily: "inherit",
            transition: "all .15s",
          }}
        >
          {pending ? (
            <><span className="am-spin" style={{ display: "inline-block" }}>⟳</span> Ingresando…</>
          ) : (
            "Ingresar →"
          )}
        </button>
      </form>
    </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%", height: 44, borderRadius: 12, border: "none",
          background: pending ? "rgba(163,230,53,0.4)" : ACCENT,
          color: "#0f172a", fontSize: 14, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: pending ? "not-allowed" : "pointer",
          boxShadow: pending ? "none" : "0 0 20px rgba(163,230,53,0.3)",
          fontFamily: "inherit",
          transition: "all .15s",
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
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,6,18,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%", maxWidth: 420, borderRadius: 24,
          background: GLASS_BG,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          overflow: "hidden",
          animation: "slideUpModal .28s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10, background: ACCENT_BG,
                border: `1.5px solid ${ACCENT_BORDER}`,
                fontSize: 18,
                boxShadow: "0 0 16px rgba(163,230,53,0.12)",
              }}>
                🎾
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
                PádelPro
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "10px 20px", fontSize: 13, fontWeight: 700,
                    color: tab === t ? ACCENT : "#475569",
                    borderTop: "none", borderLeft: "none", borderRight: "none",
                    borderBottom: `2px solid ${tab === t ? ACCENT : "transparent"}`,
                    marginBottom: -1,
                    background: "none",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "color .15s",
                    textShadow: tab === t ? "0 0 12px rgba(163,230,53,0.4)" : "none",
                  }}
                >
                  {t === "login" ? "Iniciar sesión" : "Registrarse"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "#64748b", fontSize: 14, flexShrink: 0, marginTop: 4 }}
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
        <div style={{ paddingBottom: 20, textAlign: "center", fontSize: 12, color: "#475569" }}>
          {tab === "login" ? (
            <>
              ¿No tenés cuenta?{" "}
              <button
                onClick={() => setTab("register")}
                style={{ fontWeight: 700, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                Registrate gratis
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button
                onClick={() => setTab("login")}
                style={{ fontWeight: 700, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                Iniciá sesión
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
