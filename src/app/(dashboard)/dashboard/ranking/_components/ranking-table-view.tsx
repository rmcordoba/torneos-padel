"use client";

import { useState } from "react";
import type { getRankingEntries, getRankingTablesByOrganizer } from "@/modules/rankings/queries";
import { TrendingUp } from "lucide-react";

type Entry = Awaited<ReturnType<typeof getRankingEntries>>[number];
type Rule = Awaited<ReturnType<typeof getRankingTablesByOrganizer>>[number]["rules"][number];

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const POS_COLOR: Record<number, string> = {
  1: "#fbbf24",
  2: "#94a3b8",
  3: "#fb923c",
};
const PAGE_SIZE = 8;

export function RankingTableView({ entries, tableRules }: {
  entries: Entry[];
  tableRules: Rule[];
}) {
  const [currentPage, setCurrentPage] = useState(1);

  if (entries.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
        <TrendingUp size={36} color="#334155" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Sin datos aún</p>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 4, maxWidth: 240 }}>
          Presioná &quot;Recalcular&quot; para procesar los torneos completados.
        </p>
      </div>
    );
  }

  const totalPages       = Math.ceil(entries.length / PAGE_SIZE);
  const safePage         = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedEntries = entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <th style={{ textAlign: "center", padding: "11px 16px", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", width: 48 }}>#</th>
            <th style={{ textAlign: "left",   padding: "11px 16px", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>Jugador</th>
            <th style={{ textAlign: "center", padding: "11px 16px", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>Torneos</th>
            <th style={{ textAlign: "center", padding: "11px 16px", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEntries.map((entry, idx) => {
            const name = `${entry.playerProfile.firstName} ${entry.playerProfile.lastName}`;
            const initials = `${entry.playerProfile.firstName[0]}${entry.playerProfile.lastName[0]}`.toUpperCase();
            const posColor = POS_COLOR[entry.position] ?? "#a3e635";
            const isTop = entry.position <= 3;

            return (
              <tr
                key={entry.id}
                style={{
                  borderBottom: idx < paginatedEntries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: entry.position === 1 ? "rgba(251,191,36,0.05)" : "transparent",
                }}
              >
                <td style={{ textAlign: "center", padding: "13px 16px" }}>
                  {isTop
                    ? <span style={{ fontSize: 18 }}>{MEDAL[entry.position]}</span>
                    : <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", fontFamily: "var(--font-space), sans-serif" }}>{entry.position}</span>
                  }
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${posColor}22`, border: `1.5px solid ${posColor}55`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: posColor,
                      fontFamily: "var(--font-space), sans-serif",
                    }}>
                      {initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
                        {name}
                      </p>
                      <p style={{ fontSize: 11, color: "#475569" }}>{entry.playerProfile.user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "center", padding: "13px 16px" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{entry.tournamentsPlayed}</span>
                </td>
                <td style={{ textAlign: "center", padding: "13px 16px" }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: posColor, fontFamily: "var(--font-space), sans-serif" }}>
                    {entry.points.toLocaleString("es-AR")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{
              padding: "7px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)", cursor: safePage === 1 ? "not-allowed" : "pointer",
              background: "rgba(255,255,255,0.04)",
              color: safePage === 1 ? "#334155" : "#94a3b8", fontFamily: "inherit",
            }}
          >
            ← Anterior
          </button>

          <span style={{ fontSize: 12, color: "#475569" }}>
            Página {safePage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{
              padding: "7px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)", cursor: safePage === totalPages ? "not-allowed" : "pointer",
              background: "rgba(255,255,255,0.04)",
              color: safePage === totalPages ? "#334155" : "#94a3b8", fontFamily: "inherit",
            }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {tableRules.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Puntos por posición</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tableRules.map((rule) => (
              <span key={rule.id} style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8",
              }}>
                {rule.placement === 99 ? "Participación" : `${rule.placement}°`} → <span style={{ color: "#a3e635", fontWeight: 800 }}>{rule.points} pts</span>
                {rule.description && ` (${rule.description})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
