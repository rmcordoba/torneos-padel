import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getRankingTablesByOrganizer, getRankingEntries, getCategoriesForOrganizer } from "@/modules/rankings/queries";
import { RankingTableView } from "./_components/ranking-table-view";
import { RankingRulesManager } from "./_components/ranking-rules-manager";
import { CreateRankingForm } from "./_components/create-ranking-form";
import { RecalculateButton } from "./_components/recalculate-button";
import { BarChart2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking" };

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { table: selectedTableId } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizerId = membership.organizerId;

  const [tables, categories] = await Promise.all([
    getRankingTablesByOrganizer(organizerId),
    getCategoriesForOrganizer(organizerId),
  ]);

  const activeTable = selectedTableId
    ? tables.find((t) => t.id === selectedTableId)
    : tables[0];

  const entries = activeTable ? await getRankingEntries(activeTable.id) : [];

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6 }}>
            Ranking
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            Puntuación acumulada de jugadores por categoría
          </p>
        </div>

        {/* Crear tabla */}
        <CreateRankingForm categories={categories} />
      </div>

      {tables.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)", textAlign: "center",
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 24px rgba(163,230,53,0.12)" }}>
            <BarChart2 size={24} color="#a3e635" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 8, fontFamily: "var(--font-space), sans-serif" }}>
            Sin tablas de ranking
          </h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 300 }}>
            Creá una tabla de ranking para acumular puntos de torneos completados.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Selector de tablas */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tables.map((t) => {
              const isActive = activeTable?.id === t.id;
              return (
                <a
                  key={t.id}
                  href={`/dashboard/ranking?table=${t.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 18px", borderRadius: 100, textDecoration: "none",
                    background: isActive ? "#a3e635" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                    color: isActive ? "#080e1a" : "#64748b",
                    fontSize: 13, fontWeight: isActive ? 800 : 600, transition: "all 0.12s",
                    boxShadow: isActive ? "0 0 16px rgba(163,230,53,0.25)" : "none",
                  }}
                >
                  {t.name}
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 20,
                    background: isActive ? "rgba(8,14,26,0.2)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "#080e1a" : "#64748b",
                  }}>
                    {t._count.entries}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Tabla activa */}
          {activeTable && (
            <div style={{ background: "rgba(12,20,40,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
                  {activeTable.name}
                </h2>
                <RecalculateButton tableId={activeTable.id} />
              </div>
              <RankingTableView key={activeTable.id} entries={entries} tableRules={activeTable.rules} />
            </div>
          )}

          {activeTable && (
            <RankingRulesManager
              tableId={activeTable.id}
              tableName={activeTable.name}
              rules={activeTable.rules}
            />
          )}
        </div>
      )}
    </div>
  );
}
