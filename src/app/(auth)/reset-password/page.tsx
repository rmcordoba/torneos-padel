import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./_components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: 18, border: "1px solid var(--border-subtle)", padding: "36px 32px" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif", textAlign: "center", margin: "0 0 8px" }}>
        Nueva contraseña
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", margin: "0 0 24px" }}>
        Elegí una contraseña segura de al menos 8 caracteres.
      </p>
      <ResetPasswordForm token={token} />
    </div>
  );
}
