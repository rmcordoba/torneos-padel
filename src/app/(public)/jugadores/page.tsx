import { getPublicPlayerDirectory, getPublicPlayerCategories } from "@/modules/public/queries";
import { scopedOrg, plink } from "@/lib/portal-scope";
import { JugadoresGrid } from "./_components/jugadores-client";
import { JugadoresFilters } from "./_components/jugadores-filters";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jugadores — PádelPro" };

const MAX   = 1140;
const ACCENT = "#a3e635";
const GLASS_BD = "rgba(255,255,255,0.08)";

function buildUrl(params: { q?: string; cat?: string; page: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return plink(`/jugadores${qs ? `?${qs}` : ""}`);
}

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const { q, cat, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const organizerId = scopedOrg();
  const [{ players, total, pageSize }, categories] = await Promise.all([
    getPublicPlayerDirectory({ search: q?.trim(), category: cat?.trim(), page, organizerId }),
    getPublicPlayerCategories(organizerId),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const btnBase = {
    height: 36, paddingInline: 16 as number, display: "flex" as const, alignItems: "center" as const,
    borderRadius: 10, border: `1px solid ${GLASS_BD}`,
    background: "rgba(255,255,255,0.04)",
    fontSize: 13, fontWeight: 600, color: "#94a3b8",
    textDecoration: "none",
  };

  const btnDisabled = {
    ...btnBase,
    border: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.02)",
    color: "#334155",
  };

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px 48px" }}>
      {/* Header */}
      <div style={{
        padding: "32px 0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 24,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: 28, fontWeight: 900, color: "#f8fafc",
              letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              Jugadores
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: ACCENT,
              background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.22)",
              padding: "4px 12px", borderRadius: 100, letterSpacing: "0.04em",
            }}>
              {total} {total === 1 ? "jugador" : "jugadores"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            Directorio de la comunidad
            {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
            {" · "}Temporada 2026
          </p>
        </div>
      </div>

      {/* Filters */}
      <JugadoresFilters q={q} cat={cat} categories={categories} />

      {/* Grid */}
      <JugadoresGrid players={players} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 32 }}>
          {page > 1 ? (
            <a href={buildUrl({ q, cat, page: page - 1 })} style={btnBase}>← Anterior</a>
          ) : (
            <span style={btnDisabled}>← Anterior</span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} style={{ fontSize: 13, color: "#475569", paddingInline: 4 }}>…</span>
              ) : (
                <a
                  key={p}
                  href={buildUrl({ q, cat, page: p as number })}
                  style={{
                    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10,
                    border: p === page ? "none" : `1px solid ${GLASS_BD}`,
                    background: p === page ? ACCENT : "rgba(255,255,255,0.04)",
                    fontSize: 13, fontWeight: p === page ? 800 : 600,
                    color: p === page ? "#0f172a" : "#94a3b8",
                    textDecoration: "none",
                    boxShadow: p === page ? "0 0 12px rgba(163,230,53,0.3)" : "none",
                  }}
                >
                  {p}
                </a>
              )
            )}

          {page < totalPages ? (
            <a href={buildUrl({ q, cat, page: page + 1 })} style={btnBase}>Siguiente →</a>
          ) : (
            <span style={btnDisabled}>Siguiente →</span>
          )}
        </div>
      )}
    </div>
  );
}
