"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addRankingRule, deleteRankingRule, deleteRankingTable } from "@/modules/rankings/actions";
import { Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";

interface Rule { id: string; placement: number; points: number; description: string | null; }
interface Props { tableId: string; tableName: string; rules: Rule[]; }

const PLACEMENT_LABELS: Record<number, string> = {
  1: "1° (campeón)", 2: "2° (finalista)", 3: "3°", 4: "4°", 99: "Participación",
};
function placementLabel(p: number) { return PLACEMENT_LABELS[p] ?? `${p}°`; }

export function RankingRulesManager({ tableId, tableName, rules }: Props) {
  const router = useRouter();
  const [addPending, startAdd] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingTable, startDeleteTable] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const placement = Number(fd.get("placement"));
    const points = Number(fd.get("points"));
    const description = (fd.get("description") as string) || undefined;
    if (!placement || !points) return;
    startAdd(async () => {
      await addRankingRule(tableId, placement, points, description);
      formRef.current?.reset();
      router.refresh();
    });
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditPoints(String(rule.points));
    setEditDesc(rule.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(rule: Rule) {
    const points = Number(editPoints);
    if (!points) return;
    setSavingId(rule.id);
    startAdd(async () => {
      await addRankingRule(tableId, rule.placement, points, editDesc || undefined);
      setSavingId(null);
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDeleteRule(ruleId: string) {
    setDeletingId(ruleId);
    startAdd(async () => {
      await deleteRankingRule(ruleId);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleDeleteTable() {
    if (!confirm(`¿Eliminar la tabla "${tableName}"? Se perderán todos los datos.`)) return;
    startDeleteTable(async () => {
      await deleteRankingTable(tableId);
      router.refresh();
    });
  }

  return (
    <div style={{ background: "rgba(12,20,40,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
          Reglas de puntuación
        </h3>
        <button
          type="button"
          onClick={handleDeleteTable}
          disabled={deletingTable}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600, color: "var(--text-dimmer)",
            opacity: deletingTable ? 0.5 : 1,
          }}
        >
          {deletingTable ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Eliminar tabla
        </button>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Info */}
        <div style={{ fontSize: 12, color: "var(--text-faint)", background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border-subtle)" }}>
          Usá posición <strong style={{ color: "var(--text-muted)" }}>99</strong> para puntos de participación. Sin reglas se aplican defaults (1°=100, 2°=60, 3°=40, 4°=20, participación=10).
        </div>

        {/* Reglas existentes */}
        {rules.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rules.map((rule) => {
              const isEditing = editingId === rule.id;
              const isSaving = savingId === rule.id;

              return (
                <div key={rule.id} style={{
                  borderRadius: 8,
                  background: isEditing ? "var(--bg-surface)" : "var(--bg-elevated)",
                  border: `1px solid ${isEditing ? "var(--border-strong)" : "var(--border-subtle)"}`,
                  overflow: "hidden",
                }}>
                  {/* View row */}
                  {!isEditing && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {placementLabel(rule.placement)}
                        </span>
                        {rule.description && (
                          <span style={{ fontSize: 11, color: "var(--text-dimmer)", marginLeft: 8 }}>· {rule.description}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-space), sans-serif", flexShrink: 0 }}>
                        {rule.points} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(rule)}
                        disabled={addPending}
                        title="Editar"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", opacity: addPending ? 0.4 : 1, padding: "2px 4px" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deletingId === rule.id || addPending}
                        title="Eliminar"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-darkest)", opacity: (deletingId === rule.id || addPending) ? 0.5 : 1, padding: "2px 4px" }}
                      >
                        {deletingId === rule.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  )}

                  {/* Edit row */}
                  {isEditing && (
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          Posición
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", padding: "7px 10px", background: "var(--bg-elevated)", borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
                          {placementLabel(rule.placement)}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Puntos</label>
                        <input
                          type="number" min={0} max={9999} required
                          value={editPoints}
                          onChange={(e) => setEditPoints(e.target.value)}
                          className="field-input"
                          style={{ width: 80, fontSize: 12 }}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Descripción (opcional)</label>
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="field-input"
                          style={{ fontSize: 12 }}
                          placeholder="Ej: campeón de zona"
                        />
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(rule)}
                          disabled={isSaving || !editPoints}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "9px 12px", borderRadius: 8, border: "none",
                            background: "var(--accent)", color: "#0a0f0a",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            opacity: isSaving ? 0.6 : 1,
                          }}
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "9px 12px", borderRadius: 8,
                            border: "1px solid var(--border-default)", background: "transparent",
                            color: "var(--text-faint)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          <X size={12} /> Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Agregar regla */}
        <form ref={formRef} onSubmit={handleAdd} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Posición</label>
            <select name="placement" required className="field-input" style={{ width: "auto", fontSize: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 99].map((p) => (
                <option key={p} value={p}>{placementLabel(p)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Puntos</label>
            <input name="points" type="number" min={0} max={9999} required placeholder="100"
              className="field-input" style={{ width: 80, fontSize: 12 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Descripción (opcional)</label>
            <input name="description" placeholder="Ej: campeón de zona"
              className="field-input" style={{ fontSize: 12 }} />
          </div>
          <button type="submit" disabled={addPending} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "9px 14px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "#0a0f0a",
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            opacity: addPending ? 0.6 : 1,
          }}>
            {addPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
