import { auth } from "@/lib/auth";
import { PortalHeader } from "./_components/portal-header";
import { getPublicLiveMatches } from "@/modules/public/queries";
import { getOrganizersByUser } from "@/modules/organizers/queries";

const MAX = 1140;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, liveMatches] = await Promise.all([auth(), getPublicLiveMatches()]);

  let isOrganizer = false;
  if (session?.user?.id) {
    const memberships = await getOrganizersByUser(session.user.id);
    isOrganizer = memberships.length > 0;
  }

  const sessionUser = session?.user
    ? { name: session.user.name, email: session.user.email, systemRole: session.user.systemRole, isOrganizer }
    : null;

  return (
    <div className="portal-bg">
      <PortalHeader sessionUser={sessionUser} />

      {/* Live ticker */}
      {liveMatches.length > 0 && (
        <div style={{
          background: "rgba(163,230,53,0.06)",
          borderBottom: "1px solid rgba(163,230,53,0.15)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "8px 0",
          overflow: "hidden",
        }}>
          <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              fontSize: 10, fontWeight: 800, color: "#a3e635",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a3e635", display: "inline-block", animation: "pulse-dot 1.5s infinite" }} />
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
                  <span key={m.id} style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", flexShrink: 0 }}>
                    <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{names1} vs {names2}</span>
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
      <footer style={{
        marginTop: 48,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(6,14,30,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "24px 0",
      }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(163,230,53,0.12)",
              border: "1px solid rgba(163,230,53,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>
              🎾
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>PádelPro</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Gestión de torneos de pádel</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#334155" }}>Powered by PádelPro · 2026</span>
        </div>
      </footer>
    </div>
  );
}
