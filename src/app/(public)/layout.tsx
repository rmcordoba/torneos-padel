import { auth } from "@/lib/auth";
import { PortalHeader } from "./_components/portal-header";
import { getPublicLiveMatches } from "@/modules/public/queries";

const MAX = 1140;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, liveMatches] = await Promise.all([auth(), getPublicLiveMatches()]);

  const sessionUser = session?.user
    ? { name: session.user.name, email: session.user.email, systemRole: session.user.systemRole }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#1e293b", fontFamily: "DM Sans, sans-serif" }}>
      <PortalHeader sessionUser={sessionUser} />

      {/* Live ticker */}
      {liveMatches.length > 0 && (
        <div style={{ background: "#0f172a", padding: "9px 0", overflow: "hidden" }}>
          <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 10, fontWeight: 800, color: "#a3e635", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a3e635", display: "inline-block", animation: "pulse 1.2s infinite" }} />
              En vivo
            </span>
            <div style={{ display: "flex", gap: 20, overflowX: "auto" }}>
              {liveMatches.map((m) => {
                const t1 = m.teams.find((t) => t.side === 1);
                const t2 = m.teams.find((t) => t.side === 2);
                const names1 = t1?.team.players.map((p) => p.playerProfile.lastName).join("/") ?? "TBD";
                const names2 = t2?.team.players.map((p) => p.playerProfile.lastName).join("/") ?? "TBD";
                const cat = m.stage.tournamentCategory.category.name;
                return (
                  <span key={m.id} style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                    <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{names1} vs {names2}</span>
                    <span style={{ color: "#475569" }}> · {cat}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {children}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", background: "#fff", padding: "24px 0" }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎾</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>PádelPro</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Gestión de torneos de pádel</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#cbd5e1" }}>Powered by PádelPro · 2026</span>
        </div>
      </footer>
    </div>
  );
}
