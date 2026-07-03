import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTournamentCategory } from "@/modules/tournaments/actions";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar categoría" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const { id: tournamentId, catId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: catId },
    include: {
      tournament: { select: { id: true, name: true, organizerId: true } },
      category: { select: { name: true } },
      _count: { select: { stages: true } },
    },
  });

  if (!tc || tc.tournament.id !== tournamentId) notFound();

  const fixtureGenerated = tc._count.stages > 0;

  async function action(formData: FormData) {
    "use server";
    await updateTournamentCategory(catId, null, formData);
  }

  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href={`/dashboard/torneos/${tournamentId}`} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> {tc.tournament.name}
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{tc.category.name}</span>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ color: "var(--text-dimmer)" }}>Editar</span>
      </nav>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif", margin: 0 }}>
          Editar categoría
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>{tc.category.name}</p>
      </div>

      {fixtureGenerated && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", fontSize: 13, color: "#fbbf24" }}>
          El fixture ya fue generado. Solo podés editar el precio; cupo y partidos están bloqueados.
        </div>
      )}

      <form
        action={action}
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <Field
          label="Cupo máximo (parejas)"
          name="maxTeams"
          type="number"
          defaultValue={tc.maxTeams}
          min={2}
          max={256}
          disabled={fixtureGenerated}
        />

        <Field
          label="Precio por pareja ($)"
          name="pricePerTeam"
          type="number"
          defaultValue={tc.pricePerTeam != null ? Number(tc.pricePerTeam) : ""}
          min={0}
          placeholder="Sin costo"
        />

        <Field
          label="Sets por partido"
          name="setsPerMatch"
          type="number"
          defaultValue={tc.setsPerMatch}
          min={1}
          max={5}
          disabled={fixtureGenerated}
        />

        <Field
          label="Games por set"
          name="gamesPerSet"
          type="number"
          defaultValue={tc.gamesPerSet}
          min={4}
          max={10}
          disabled={fixtureGenerated}
        />

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <Link
            href={`/dashboard/torneos/${tournamentId}`}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, type, defaultValue, min, max, placeholder, disabled,
}: {
  label: string; name: string; type: string; defaultValue?: string | number;
  min?: number; max?: number; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-default)",
          background: disabled ? "var(--bg-elevated)" : "var(--bg-surface)",
          color: disabled ? "var(--text-dimmer)" : "var(--text-primary)",
          fontSize: 14,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "auto",
        }}
      />
    </div>
  );
}
