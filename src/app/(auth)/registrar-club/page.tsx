import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { CreateClubForm } from "./_components/create-club-form";

export const metadata: Metadata = { title: "Registrá tu club · PadelPro" };

export default async function RegistrarClubPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

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
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.02em", margin: 0 }}>
            Registrá tu club
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>
            {isLoggedIn
              ? "Creá el espacio de tu club para administrar torneos, canchas y ranking."
              : "Creá tu cuenta y el espacio de tu club en un solo paso."}
          </p>
        </div>
        <CreateClubForm isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
