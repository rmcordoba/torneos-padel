import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
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

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;

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
          <h1 className="page-title">Ranking</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            Puntuación acumulada de jugadores por categoría
          </p>
        </div>

        {/* Crear tabla */}
        <CreateRankingForm categories={categories} />
      </div>

      {tables.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed var(--border-strong)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BarChart2 size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
            Sin tablas de ranking
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 280 }}>
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
                    padding: "8px 16px", borderRadius: 8, textDecoration: "none",
                    background: isActive ? "var(--accent)" : "var(--bg-surface)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-default)"}`,
                    color: isActive ? "#0a0f0a" : "var(--text-faint)",
                    fontSize: 13, fontWeight: 600, transition: "all 0.12s",
                  }}
                >
                  {t.name}
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 20,
                    background: isActive ? "rgba(0,0,0,0.15)" : "var(--bg-elevated)",
                    color: isActive ? "#0a0f0a" : "var(--text-faint)",
                  }}>
                    {t._count.entries}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Tabla activa */}
          {activeTable && (
            <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>
                  {activeTable.name}
                </h2>
                <RecalculateButton tableId={activeTable.id} />
              </div>
              <RankingTableView entries={entries} tableRules={activeTable.rules} />
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
