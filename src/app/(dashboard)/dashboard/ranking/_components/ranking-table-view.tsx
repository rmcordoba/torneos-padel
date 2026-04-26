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

export function RankingTableView({ entries, tableRules }: {
  entries: Entry[];
  tableRules: Rule[];
}) {
  if (entries.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
        <TrendingUp size={36} color="var(--border-strong)" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-faint)" }}>Sin datos aún</p>
        <p style={{ fontSize: 12, color: "var(--text-dimmer)", marginTop: 4, maxWidth: 240 }}>
          Presioná "Recalcular" para procesar los torneos completados.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", width: 48 }}>#</th>
            <th style={{ textAlign: "left",   padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Jugador</th>
            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Torneos</th>
            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const name = `${entry.playerProfile.firstName} ${entry.playerProfile.lastName}`;
            const initials = `${entry.playerProfile.firstName[0]}${entry.playerProfile.lastName[0]}`.toUpperCase();
            const posColor = POS_COLOR[entry.position] ?? "var(--accent)";
            const isTop = entry.position <= 3;

            return (
              <tr
                key={entry.id}
                style={{
                  borderBottom: idx < entries.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  background: entry.position === 1 ? "rgba(251,191,36,0.04)" : "transparent",
                }}
              >
                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                  {isTop
                    ? <span style={{ fontSize: 16 }}>{MEDAL[entry.position]}</span>
                    : <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dimmer)" }}>{entry.position}</span>
                  }
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${posColor}22`, border: `1px solid ${posColor}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: posColor,
                      fontFamily: "Space Grotesk, sans-serif",
                    }}>
                      {initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isTop ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-dimmer)" }}>{entry.playerProfile.user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{entry.tournamentsPlayed}</span>
                </td>
                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: posColor, fontFamily: "Space Grotesk, sans-serif" }}>
                    {entry.points.toLocaleString("es-AR")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tableRules.length > 0 && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Puntos por posición</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tableRules.map((rule) => (
              <span key={rule.id} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 6,
                background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
              }}>
                {rule.placement === 99 ? "Participación" : `${rule.placement}°`} → {rule.points} pts
                {rule.description && ` (${rule.description})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
