import { getPublicPlayerDirectory } from "@/modules/public/queries";
import { JugadoresGrid } from "./_components/jugadores-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jugadores — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const players = await getPublicPlayerDirectory(q?.trim());

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
          Jugadores
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          {players.length} jugador{players.length !== 1 ? "es" : ""} registrado{players.length !== 1 ? "s" : ""} · Temporada 2026
        </p>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 24 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o apellido…"
            style={{
              width: "100%", height: 44, paddingLeft: 40, paddingRight: 16,
              borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff",
              fontSize: 13, color: "#334155", fontFamily: "inherit",
              outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          />
        </div>
      </form>

      {/* Grid */}
      <JugadoresGrid players={players} />
    </div>
  );
}
