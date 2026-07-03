import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Iniciar sesión · PadelPro" };

export default function LoginPage() {
  return (
    <div style={{
      background: "rgba(10,20,42,0.7)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      animation: "hero-entry 0.6s cubic-bezier(0.23,1,0.32,1) both",
    }}>
      <div style={{ padding: "36px 38px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 24, fontWeight: 900, color: "#f8fafc",
            fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.02em", margin: 0,
          }}>
            Bienvenido de vuelta
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>
            Ingresá tus credenciales para acceder a tu panel
          </p>
        </div>
        <LoginForm />

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            ¿Organizás torneos?{" "}
            <Link href="/registrar-club" style={{ fontWeight: 700, color: "#a3e635", textDecoration: "none" }}>
              Registrá tu club
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
