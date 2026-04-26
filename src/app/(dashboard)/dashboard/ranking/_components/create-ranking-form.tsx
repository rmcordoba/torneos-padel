"use client";

import { useActionState } from "react";
import { createRankingTable } from "@/modules/rankings/actions";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  categories: { id: string; name: string }[];
}

export function CreateRankingForm({ categories }: Props) {
  const [state, action, isPending] = useActionState(createRankingTable, null);

  return (
    <form action={action} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <select name="categoryId" className="field-input" style={{ width: "auto", fontSize: 12 }}>
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        name="name"
        placeholder="Nombre del ranking..."
        required
        className="field-input"
        style={{ width: 160, fontSize: 12 }}
      />
      <button
        type="submit"
        disabled={isPending}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "9px 14px", borderRadius: 8, border: "none",
          background: "var(--accent)", color: "#0a0f0a",
          fontSize: 12, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap", opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Crear
      </button>
      {state?.error && (
        <span style={{ fontSize: 12, color: "#ef4444" }}>{state.error}</span>
      )}
    </form>
  );
}
