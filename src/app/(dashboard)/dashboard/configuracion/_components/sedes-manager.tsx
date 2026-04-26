"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useActionState } from "react";
import {
  createVenueConfig,
  updateVenueConfig,
  deleteVenueConfig,
  createCourtConfig,
  updateCourtConfig,
  deleteCourtConfig,
  type VenueConfigState,
} from "@/modules/venues/config-actions";
import type { getVenuesWithCourts } from "@/modules/scheduling/queries";

type Venue = Awaited<ReturnType<typeof getVenuesWithCourts>>[number];
type Court = Venue["courts"][number];

const A = "#a3e635";

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

// ─── Venue form ───────────────────────────────────────────────────────────────

function VenueForm({
  mode,
  venue,
  onDone,
}: {
  mode: "create" | "edit";
  venue?: Venue;
  onDone: () => void;
}) {
  const action = mode === "edit" && venue
    ? updateVenueConfig.bind(null, venue.id)
    : createVenueConfig;

  const [state, formAction, isPending] = useActionState<VenueConfigState, FormData>(action, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) {
      submitted.current = false;
      onDone();
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
          <label style={lbl}>Nombre de la sede *</label>
          <input name="name" defaultValue={venue?.name ?? ""} required style={inp} />
          {state?.fieldErrors?.name && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div>
          <label style={lbl}>Dirección</label>
          <input name="address" defaultValue={venue?.address ?? ""} style={inp} />
        </div>
        <div>
          <label style={lbl}>Ciudad</label>
          <input name="city" defaultValue={venue?.city ?? ""} style={inp} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>URL en mapa (Google Maps, etc.)</label>
          <input name="mapUrl" type="url" placeholder="https://" defaultValue={venue?.mapUrl ?? ""} style={inp} />
          {state?.fieldErrors?.mapUrl && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.mapUrl[0]}</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="button"
          onClick={onDone}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "8px 18px", borderRadius: 8, background: isPending ? "oklch(24% 0.01 250)" : "var(--accent)", border: "none", color: isPending ? "var(--text-faint)" : "#0f172a", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer" }}
        >
          {isPending ? "Guardando..." : mode === "edit" ? "Guardar sede" : "Crear sede"}
        </button>
      </div>
    </form>
  );
}

// ─── Court form ───────────────────────────────────────────────────────────────

function CourtForm({
  venueId,
  court,
  onDone,
}: {
  venueId: string;
  court?: Court;
  onDone: () => void;
}) {
  const action = court
    ? updateCourtConfig.bind(null, court.id)
    : createCourtConfig.bind(null, venueId);

  const [state, formAction, isPending] = useActionState<VenueConfigState, FormData>(action, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) {
      submitted.current = false;
      onDone();
    }
  }, [isPending, state, onDone]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {state?.error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 7, padding: "7px 10px", color: "#f87171", fontSize: 11 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ ...lbl, fontSize: 10 }}>Nombre *</label>
          <input name="name" defaultValue={court?.name ?? ""} required style={{ ...inp, fontSize: 12, padding: "7px 10px" }} />
          {state?.fieldErrors?.name && (
            <p style={{ fontSize: 10, color: "#f87171", marginTop: 3 }}>{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div>
          <label style={{ ...lbl, fontSize: 10 }}>Superficie</label>
          <input name="surface" defaultValue={court?.surface ?? ""} placeholder="Cristal, cemento..." style={{ ...inp, fontSize: 12, padding: "7px 10px" }} />
        </div>
        <div>
          <label style={{ ...lbl, fontSize: 10 }}>Tipo</label>
          <select name="isIndoor" defaultValue={court?.isIndoor ? "true" : "false"} style={{ ...inp, fontSize: 12, padding: "7px 10px" }}>
            <option value="false">Exterior</option>
            <option value="true">Interior</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7 }}>
        <button
          type="button"
          onClick={onDone}
          style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "6px 14px", borderRadius: 7, background: isPending ? "oklch(24% 0.01 250)" : "var(--accent)", border: "none", color: isPending ? "var(--text-faint)" : "#0f172a", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer" }}
        >
          {isPending ? "Guardando..." : court ? "Guardar" : "Agregar cancha"}
        </button>
      </div>
    </form>
  );
}

// ─── Court row ────────────────────────────────────────────────────────────────

function CourtRow({ court, venueId }: { court: Court; venueId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div style={{ padding: "10px 12px", borderRadius: 8, background: "oklch(20% 0.012 250)", border: "1px solid rgba(163,230,53,.2)" }}>
        <CourtForm venueId={venueId} court={court} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "oklch(20% 0.012 250)", border: "1px solid oklch(26% 0.01 250)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>{court.isIndoor ? "🏢" : "🌤️"}</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{court.name}</p>
          {court.surface && (
            <p style={{ fontSize: 10, color: "var(--text-darkest)" }}>{court.surface} · {court.isIndoor ? "Interior" : "Exterior"}</p>
          )}
          {!court.surface && (
            <p style={{ fontSize: 10, color: "var(--text-darkest)" }}>{court.isIndoor ? "Interior" : "Exterior"}</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          Editar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteCourtConfig(court.id))}
          style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.08)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          Quitar
        </button>
      </div>
    </div>
  );
}

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: Venue }) {
  const [expanded, setExpanded]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ borderRadius: 12, border: "1px solid oklch(26% 0.01 250)", background: "oklch(18% 0.012 250)", overflow: "hidden" }}>
      {/* Venue header */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, textAlign: "left" }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🏟️</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 1 }}>{venue.name}</p>
            <p style={{ fontSize: 11, color: "var(--text-darkest)" }}>
              {[venue.city, venue.address].filter(Boolean).join(" · ") || "Sin dirección"}
              <span style={{ marginLeft: 8, color: "var(--text-darkest)" }}>· {venue.courts.length} cancha{venue.courts.length !== 1 ? "s" : ""}</span>
            </p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-darkest)", paddingRight: 4 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </button>

        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { setEditing((v) => !v); setExpanded(true); }}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            Editar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm(`¿Eliminar la sede "${venue.name}"?`)) {
                startTransition(() => deleteVenueConfig(venue.id));
              }
            }}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.08)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Edit venue form */}
      {editing && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid oklch(22% 0.01 250)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 10px" }}>Editar sede</p>
          <VenueForm mode="edit" venue={venue} onDone={() => setEditing(false)} />
        </div>
      )}

      {/* Courts section */}
      {expanded && !editing && (
        <div style={{ borderTop: "1px solid oklch(22% 0.01 250)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Canchas
            </span>
            <button
              type="button"
              onClick={() => setShowAddCourt((v) => !v)}
              style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(163,230,53,.1)", border: "1px solid rgba(163,230,53,.25)", color: A, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              + Agregar cancha
            </button>
          </div>

          {showAddCourt && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "oklch(16% 0.012 250)", border: "1px solid rgba(163,230,53,.2)" }}>
              <CourtForm venueId={venue.id} onDone={() => setShowAddCourt(false)} />
            </div>
          )}

          {venue.courts.length === 0 && !showAddCourt && (
            <div style={{ padding: "20px 0", textAlign: "center", border: "1px dashed oklch(24% 0.01 250)", borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: "var(--text-darkest)" }}>Sin canchas registradas</p>
            </div>
          )}

          {venue.courts.map((court) => (
            <CourtRow key={court.id} court={court} venueId={venue.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SedesManager({ venues }: { venues: Venue[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {venues.length} sede{venues.length !== 1 ? "s" : ""} registrada{venues.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(163,230,53,.12)", border: "1px solid rgba(163,230,53,.3)", color: A, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          + Nueva sede
        </button>
      </div>

      {showCreate && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(163,230,53,.25)", background: "rgba(163,230,53,.04)", padding: "16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Nueva sede</p>
          <VenueForm mode="create" onDone={() => setShowCreate(false)} />
        </div>
      )}

      {venues.length === 0 && !showCreate && (
        <div style={{ padding: "40px 0", textAlign: "center", border: "1px dashed oklch(26% 0.01 250)", borderRadius: 12 }}>
          <p style={{ fontSize: 24, marginBottom: 10 }}>🏟️</p>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin sedes registradas</p>
          <p style={{ fontSize: 11, color: "var(--text-darkest)", marginTop: 4 }}>Agregá una sede para asignarle canchas y programar partidos</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
}
