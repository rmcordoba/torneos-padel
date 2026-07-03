import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getPlayersByOrganizer } from "@/modules/players/queries";
import { Users, UserPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jugadores" };

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizerId = membership.organizerId;
  const { players, total, pageSize } = await getPlayersByOrganizer(organizerId, q?.trim() || undefined, page);

  const totalPages = Math.ceil(total / pageSize);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/dashboard/jugadores${qs ? `?${qs}` : ""}`;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div style={{ maxWidth: 840, display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Jugadores
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#a3e635",
              background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.22)",
              padding: "4px 12px", borderRadius: 100,
            }}>
              {total}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            Jugadores de tu organización
          </p>
        </div>
        <Link href="/dashboard/jugadores/nuevo" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 18px", borderRadius: 10,
          background: "#a3e635", color: "#080e1a",
          fontSize: 13, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 0 20px rgba(163,230,53,0.3)", flexShrink: 0,
        }}>
          <UserPlus size={15} /> Agregar jugador
        </Link>
      </div>

      {/* Search */}
      <form method="GET">
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, apellido, DNI o email..."
            className="dash-search"
            style={{
              width: "100%", height: 44, padding: "0 16px 0 40px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </form>

      {/* Results */}
      {players.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)", textAlign: "center",
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 24px rgba(163,230,53,0.12)" }}>
            <Users size={24} color="#a3e635" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 8, fontFamily: "var(--font-space), sans-serif" }}>
            {q ? `Sin resultados para "${q}"` : "Sin jugadores aún"}
          </h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 300 }}>
            {q
              ? "Probá con otro nombre, apellido o DNI."
              : "Los jugadores aparecen aquí cuando se inscriben a un torneo."}
          </p>
        </div>
      ) : (
        <>
          {/* List count */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {total} jugador{total !== 1 ? "es" : ""}{q && ` para "${q}"`}
            </span>
            {totalPages > 1 && (
              <span style={{ fontSize: 11, color: "#475569" }}>{from}–{to} de {total}</span>
            )}
          </div>

          {/* Player rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {players.map((player, idx) => {
              const initials = `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();
              const accentColors = ["#a3e635", "#38bdf8", "#a78bfa", "#fbbf24", "#fb923c"];
              const ac = accentColors[(player.firstName.charCodeAt(0) + player.lastName.charCodeAt(0)) % accentColors.length];

              return (
                <Link
                  key={player.id}
                  href={`/dashboard/jugadores/${player.id}`}
                  className={`dash-row vib-in card-d${Math.min(idx, 5)}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", textDecoration: "none",
                    borderRadius: 14,
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: `${ac}22`, border: `1.5px solid ${ac}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: ac,
                    fontFamily: "var(--font-space), sans-serif",
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
                      {player.lastName}, {player.firstName}
                    </p>
                    <p style={{ fontSize: 11, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {player.user.email}
                      {player.dni && ` · DNI ${player.dni}`}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#94a3b8",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      padding: "4px 10px", borderRadius: 100,
                    }}>
                      {player._count.teamPlayers} pareja{player._count.teamPlayers !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 4 }}>
              {page > 1 ? (
                <Link href={pageHref(page - 1)} style={pgBtn}>‹ Anterior</Link>
              ) : (
                <span style={pgDisabled}>‹ Anterior</span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 100, fontSize: 13, fontWeight: n === page ? 800 : 600,
                    textDecoration: "none",
                    border: n === page ? "none" : "1px solid rgba(255,255,255,0.08)",
                    background: n === page ? "#a3e635" : "rgba(255,255,255,0.04)",
                    color: n === page ? "#080e1a" : "#94a3b8",
                    boxShadow: n === page ? "0 0 14px rgba(163,230,53,0.3)" : "none",
                  }}
                >
                  {n}
                </Link>
              ))}

              {page < totalPages ? (
                <Link href={pageHref(page + 1)} style={pgBtn}>Siguiente ›</Link>
              ) : (
                <span style={pgDisabled}>Siguiente ›</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const pgBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: 36, padding: "0 16px",
  borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#94a3b8",
};
const pgDisabled: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: 36, padding: "0 16px",
  borderRadius: 100, fontSize: 13, fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)", color: "#334155",
};
