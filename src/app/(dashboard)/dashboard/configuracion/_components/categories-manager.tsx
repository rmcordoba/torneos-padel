"use client";

import { useActionState, useTransition, useRef, useEffect, useState } from "react";
import {
  createCategory,
  updateCategory,
  toggleCategoryActive,
  type ConfigActionState,
} from "@/modules/config/actions";
import type { getCategoriesByOrganizer } from "@/modules/config/queries";

type Category = Awaited<ReturnType<typeof getCategoriesByOrganizer>>[number];

const A = "#a3e635";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  MIXED: "Mixto",
  OPEN: "Open",
};

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "oklch(20% 0.012 250)",
  border: "1px solid oklch(30% 0.01 250)",
  borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: "var(--text-secondary)",
  outline: "none", fontFamily: "inherit",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-faint)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.06em",
};

function CategoryForm({
  mode,
  category,
  onDone,
}: {
  mode: "create" | "edit";
  category?: Category;
  onDone?: () => void;
}) {
  const action = mode === "edit" && category
    ? updateCategory.bind(null, category.id)
    : createCategory;

  const [state, formAction, isPending] = useActionState<ConfigActionState, FormData>(action, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) {
      submitted.current = false;
      onDone?.();
    }
  }, [isPending, state, onDone]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {state?.error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "9px 12px", color: "#f87171", fontSize: 12 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Nombre *</label>
          <input name="name" defaultValue={category?.name ?? ""} required style={inp} />
          {state?.fieldErrors?.name && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div>
          <label style={lbl}>Género</label>
          <select name="gender" defaultValue={category?.gender ?? "OPEN"} style={inp}>
            <option value="OPEN">Open</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="MIXED">Mixto</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Nivel</label>
          <input name="level" defaultValue={category?.level ?? ""} placeholder="1ra, 2da..." style={inp} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Descripción</label>
          <input name="description" defaultValue={category?.description ?? ""} style={inp} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "8px 18px", borderRadius: 8, background: isPending ? "oklch(24% 0.01 250)" : "var(--accent)", border: "none", color: isPending ? "var(--text-faint)" : "#0f172a", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer" }}
        >
          {isPending ? "Guardando..." : mode === "edit" ? "Guardar" : "Crear categoría"}
        </button>
      </div>
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${category.isActive ? "oklch(26% 0.01 250)" : "oklch(22% 0.01 250)"}`,
      background: category.isActive ? "oklch(18% 0.012 250)" : "oklch(16% 0.01 250)",
      padding: "12px 14px",
      opacity: category.isActive ? 1 : 0.6,
    }}>
      {editing ? (
        <CategoryForm mode="edit" category={category} onDone={() => setEditing(false)} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 3 }}>{category.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{GENDER_LABELS[category.gender]}</span>
              {category.level && (
                <span style={{ fontSize: 10, background: "oklch(22% 0.01 250)", color: "var(--text-faint)", borderRadius: 5, padding: "2px 7px" }}>{category.level}</span>
              )}
              {!category.isActive && (
                <span style={{ fontSize: 10, background: "rgba(239,68,68,.15)", color: "#f87171", borderRadius: 5, padding: "2px 7px" }}>Inactiva</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            >
              Editar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => toggleCategoryActive(category.id, !category.isActive))}
              style={{
                padding: "5px 10px", borderRadius: 7, border: "none", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                background: category.isActive ? "rgba(239,68,68,.12)" : "rgba(163,230,53,.12)",
                color: category.isActive ? "#f87171" : A,
              }}
            >
              {category.isActive ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{categories.length} categoría{categories.length !== 1 ? "s" : ""} registrada{categories.length !== 1 ? "s" : ""}</span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(163,230,53,.12)", border: "1px solid rgba(163,230,53,.3)", color: A, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          + Nueva categoría
        </button>
      </div>

      {showCreate && (
        <div style={{ borderRadius: 10, border: "1px solid rgba(163,230,53,.25)", background: "rgba(163,230,53,.05)", padding: "14px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: A, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nueva categoría</p>
          <CategoryForm mode="create" onDone={() => setShowCreate(false)} />
        </div>
      )}

      {categories.length === 0 && !showCreate && (
        <div style={{ padding: "36px 0", textAlign: "center", border: "1px dashed oklch(26% 0.01 250)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin categorías aún</p>
          <p style={{ fontSize: 11, color: "var(--text-darkest)", marginTop: 4 }}>Creá tu primera categoría para usarla en torneos</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {categories.map((cat) => (
          <CategoryRow key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}
