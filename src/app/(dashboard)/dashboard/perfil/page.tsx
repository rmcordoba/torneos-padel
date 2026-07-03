import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlayerProfile } from "@/modules/player/queries";
import { PlayerProfileForm } from "./_components/player-profile-form";
import { ChangePasswordForm } from "./_components/change-password-form";
import { UserCircle, Lock, Contact } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi Perfil" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, playerProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, password: true, createdAt: true },
    }),
    getPlayerProfile(session.user.id),
  ]);

  if (!user) redirect("/login");

  const hasPassword = !!user.password;
  const initials = user.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const profileInitial = playerProfile
    ? {
        firstName: playerProfile.firstName,
        lastName: playerProfile.lastName,
        phone: playerProfile.phone,
        birthDate: playerProfile.birthDate
          ? playerProfile.birthDate.toISOString().slice(0, 10)
          : null,
        dni: playerProfile.dni,
      }
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>

      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
          Mi Perfil
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569" }}>
          Información de tu cuenta
        </p>
      </div>

      {/* Account info */}
      <Card icon={<UserCircle size={15} />} title="Datos de la cuenta">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "rgba(163,230,53,0.12)", border: "2px solid rgba(163,230,53,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#a3e635",
            fontFamily: "var(--font-space), sans-serif",
          }}>
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{user.email}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Cuenta creada el{" "}
              {user.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </Card>

      {/* Player profile */}
      <Card icon={<Contact size={15} />} title={playerProfile ? "Datos de jugador" : "Completar perfil de jugador"}>
        {!playerProfile && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
            fontSize: 12, color: "#fbbf24",
          }}>
            Completá tu perfil para poder inscribirte en torneos
          </div>
        )}
        <PlayerProfileForm initialData={profileInitial} />
      </Card>

      {/* Change password */}
      <Card icon={<Lock size={15} />} title="Cambiar contraseña">
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
            Tu cuenta usa inicio de sesión externo (Google u otro proveedor). No podés cambiar la contraseña desde aquí.
          </p>
        )}
      </Card>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(12,20,40,0.7)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "#a3e635" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
