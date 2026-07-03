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
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: "#e2e8f0",
  outline: "none", fontFamily: "inherit",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", marginBottom: 6,
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
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "8px 18px", borderRadius: 8, background: isPending ? "rgba(255,255,255,0.06)" : "#a3e635", border: "none", color: isPending ? "#64748b" : "#080e1a", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer" }}
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
      border: `1px solid ${category.isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)"}`,
      background: category.isActive ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
      padding: "12px 14px",
      opacity: category.isActive ? 1 : 0.6,
    }}>
      {editing ? (
        <CategoryForm mode="edit" category={category} onDone={() => setEditing(false)} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{category.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{GENDER_LABELS[category.gender]}</span>
              {category.level && (
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", color: "#64748b", borderRadius: 5, padding: "2px 7px" }}>{category.level}</span>
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
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
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

const PAGE_SIZE = 4;

function Pager({ page, total, onPrev, onNext }: {
  page: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  const btn: React.CSSProperties = {
    padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", fontSize: 11, fontWeight: 600, fontFamily: "inherit", lineHeight: 1,
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
      <button type="button" onClick={onPrev} disabled={page === 1}
        style={{ ...btn, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "rgba(255,255,255,0.14)" : "#64748b" }}>
        ← Anterior
      </button>
      <span style={{ fontSize: 11, color: "#334155" }}>{page} / {total}</span>
      <button type="button" onClick={onNext} disabled={page === total}
        style={{ ...btn, cursor: page === total ? "not-allowed" : "pointer", color: page === total ? "rgba(255,255,255,0.14)" : "#64748b" }}>
        Siguiente →
      </button>
    </div>
  );
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages   = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const visibleCats  = categories.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>{categories.length} categoría{categories.length !== 1 ? "s" : ""} registrada{categories.length !== 1 ? "s" : ""}</span>
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
        <div style={{ padding: "36px 0", textAlign: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "#64748b" }}>Sin categorías aún</p>
          <p style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Creá tu primera categoría para usarla en torneos</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleCats.map((cat) => (
          <CategoryRow key={cat.id} category={cat} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pager
          page={safePage}
          total={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}
