"use client";

import { useActionState, useTransition, useEffect, useRef, useState } from "react";
import { Building2, Trophy, Users, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
  type AdminActionState,
} from "@/modules/admin/actions";
import type { getAllOrganizersAdmin } from "@/modules/admin/queries";

type Organizer = Awaited<ReturnType<typeof getAllOrganizersAdmin>>[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "9px 12px",
  fontSize: 13, color: "#e2e8f0",
  outline: "none", fontFamily: "inherit",
};

const label: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  fontSize: 11, fontWeight: 600, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.06em",
};

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateForm({ onClose }: { onClose: () => void }) {
  const [state, action, isPending] = useActionState<AdminActionState, FormData>(createOrganizer, null);
  const [slugValue, setSlugValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state?.success) {
      formRef.current?.reset();
      setSlugValue("");
      onClose();
    }
  }, [isPending, state, onClose]);

  return (
    <form ref={formRef} action={action}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={label}>
          Nombre *
          <input
            name="name"
            required
            style={inp}
            onChange={(e) => setSlugValue(slugify(e.target.value))}
          />
        </label>
        <label style={label}>
          Slug *
          <input
            name="slug"
            required
            value={slugValue}
            onChange={(e) => setSlugValue(e.target.value)}
            style={inp}
            placeholder="mi-organizador"
          />
        </label>
        <label style={label}>
          Email de contacto
          <input name="email" type="email" style={inp} />
        </label>
        <label style={label}>
          Teléfono
          <input name="phone" style={inp} />
        </label>
        <label style={label}>
          Sitio web
          <input name="website" type="url" style={inp} placeholder="https://..." />
        </label>
        <label style={label}>
          Email del propietario (owner)
          <input name="ownerEmail" type="email" style={inp} placeholder="usuario@ejemplo.com" />
        </label>
        <label style={{ ...label, gridColumn: "1 / -1" }}>
          Descripción
          <textarea name="description" rows={2} style={{ ...inp, resize: "vertical" }} />
        </label>
      </div>

      {state?.error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{state.error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: isPending ? "rgba(255,255,255,0.06)" : "#a3e635", color: isPending ? "#64748b" : "#080e1a", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          {isPending ? "Creando..." : "Crear organizador"}
        </button>
      </div>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ org, onClose }: { org: Organizer; onClose: () => void }) {
  const boundAction = updateOrganizer.bind(null, org.id);
  const [state, action, isPending] = useActionState<AdminActionState, FormData>(boundAction, null);

  useEffect(() => {
    if (!isPending && state?.success) onClose();
  }, [isPending, state, onClose]);

  return (
    <form action={action}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={label}>
          Nombre *
          <input name="name" required defaultValue={org.name} style={inp} />
        </label>
        <label style={label}>
          Slug *
          <input name="slug" required defaultValue={org.slug} style={inp} />
        </label>
        <label style={label}>
          Email de contacto
          <input name="email" type="email" defaultValue={org.email ?? ""} style={inp} />
        </label>
        <label style={label}>
          Teléfono
          <input name="phone" defaultValue={org.phone ?? ""} style={inp} />
        </label>
        <label style={{ ...label, gridColumn: "1 / -1" }}>
          Sitio web
          <input name="website" type="url" defaultValue={org.website ?? ""} style={inp} placeholder="https://..." />
        </label>
        <label style={{ ...label, gridColumn: "1 / -1" }}>
          Descripción
          <textarea name="description" rows={2} defaultValue={org.description ?? ""} style={{ ...inp, resize: "vertical" }} />
        </label>
      </div>

      {state?.error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{state.error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: isPending ? "rgba(255,255,255,0.06)" : "#a3e635", color: isPending ? "#64748b" : "#080e1a", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

// ─── Organizer row ────────────────────────────────────────────────────────────

function OrganizerRow({ org }: { org: Organizer }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteOrganizer(org.id);
      if (result?.error) {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <>
      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", opacity: org.isActive ? 1 : 0.55 }}>
        {/* Organizer */}
        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
              background: org.isActive ? "rgba(163,230,53,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${org.isActive ? "rgba(163,230,53,0.28)" : "rgba(255,255,255,0.07)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800,
              color: org.isActive ? "#a3e635" : "#94a3b8",
              fontFamily: "var(--font-space), sans-serif",
            }}>
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                {org.name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>/{org.slug}</p>
            </div>
          </div>
        </td>

        {/* Torneos */}
        <td style={{ padding: "12px 16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
            <Trophy size={11} /> {org._count.tournaments}
          </span>
        </td>

        {/* Miembros */}
        <td style={{ padding: "12px 16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
            <Users size={11} /> {org._count.members}
          </span>
        </td>

        {/* Email */}
        <td style={{ padding: "12px 16px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{org.email || "—"}</p>
        </td>

        {/* Estado */}
        <td style={{ padding: "12px 16px" }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: "2px 8px", borderRadius: 20,
            background: org.isActive ? "rgba(163,230,53,0.12)" : "rgba(100,116,139,0.12)",
            color: org.isActive ? "#a3e635" : "#94a3b8",
          }}>
            {org.isActive ? "Activo" : "Inactivo"}
          </span>
        </td>

        {/* Acciones */}
        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMode(mode === "edit" ? "view" : "edit")}
              style={{
                padding: "5px 10px", borderRadius: 6,
                border: "1px solid rgba(163,230,53,0.35)",
                background: mode === "edit" ? "rgba(163,230,53,0.1)" : "transparent",
                color: "#a3e635", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Editar {mode === "edit" ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === "delete" ? "view" : "delete"); setDeleteError(null); }}
              style={{
                padding: "5px 10px", borderRadius: 6,
                border: "1px solid rgba(248,113,113,0.35)",
                background: mode === "delete" ? "rgba(248,113,113,0.1)" : "transparent",
                color: "#f87171", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {/* Edit panel */}
      {mode === "edit" && (
        <tr>
          <td colSpan={6} style={{ padding: "0 16px 16px", background: "rgba(12,20,40,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ paddingTop: 16 }}>
              <EditForm org={org} onClose={() => setMode("view")} />
            </div>
          </td>
        </tr>
      )}

      {/* Delete confirmation */}
      {mode === "delete" && (
        <tr>
          <td colSpan={6} style={{ padding: "0 16px 14px", background: "rgba(12,20,40,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ paddingTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>
                ¿Eliminar <strong>{org.name}</strong>? Esta acción no se puede deshacer.
              </p>
              {deleteError && (
                <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{deleteError}</p>
              )}
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(248,113,113,0.12)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? "Eliminando..." : "Confirmar eliminación"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrganizadoresManager({ organizers }: { organizers: Organizer[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Create panel */}
      {showCreate && (
        <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
              Nuevo organizador
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex" }}
            >
              <X size={16} />
            </button>
          </div>
          <CreateForm onClose={() => setShowCreate(false)} />
        </div>
      )}

      {/* Table */}
      <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {organizers.length} organizador{organizers.length !== 1 ? "es" : ""}
          </p>
          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#a3e635", color: "#080e1a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              + Nuevo organizador
            </button>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Organizador", "Torneos", "Miembros", "Email", "Estado", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organizers.map((org) => (
              <OrganizerRow key={org.id} org={org} />
            ))}
          </tbody>
        </table>

        {organizers.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <Building2 size={40} color="rgba(255,255,255,0.1)" />
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Sin organizadores registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
