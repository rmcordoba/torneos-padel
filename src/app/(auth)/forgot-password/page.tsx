import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 18, border: "1px solid var(--border-subtle)", padding: "36px 32px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", textAlign: "center", margin: "0 0 24px" }}>
        Recuperar contraseña
      </h2>
      <ForgotPasswordForm />
    </div>
  );
}
