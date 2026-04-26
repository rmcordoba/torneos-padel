import type { Metadata } from "next";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = { title: "Crear cuenta · PadelPro" };

export default function RegisterPage() {
  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: 16,
      border: "1px solid var(--border-default)",
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    }}>
      {/* Franja accent */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #a3e635 0%, rgba(163,230,53,0.3) 100%)" }} />

      <div style={{ padding: "32px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", margin: 0 }}>
            Crear cuenta
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 6 }}>
            Completá tus datos para empezar a jugar torneos
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
