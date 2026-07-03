"use client";

import { useState } from "react";
import type { WeekdayTimeBand } from "@prisma/client";
import { WEEKDAY_TIME_BANDS } from "@/modules/registrations/validations";

const ACCENT = "#a3e635";
const ACCENT_BG = "rgba(163,230,53,0.10)";
const ACCENT_BD = "rgba(163,230,53,0.30)";

const ALL_VALUES = WEEKDAY_TIME_BANDS.map((b) => b.value);

interface Props {
  /** name de los inputs enviados en el FormData (uno por franja seleccionada). */
  name?: string;
  /** Franjas ya seleccionadas (para edición). */
  defaultValue?: WeekdayTimeBand[];
}

/**
 * Selector de disponibilidad horaria para partidos entre semana (L–V).
 * El jugador elige una o varias franjas, o "Disponibilidad total" (las 3).
 * Los fines de semana se asume disponibilidad total (no se pregunta).
 */
export function WeekdayAvailabilityPicker({ name = "weekdayAvailability", defaultValue = [] }: Props) {
  const [selected, setSelected] = useState<Set<WeekdayTimeBand>>(new Set(defaultValue));

  const isFull = selected.size === ALL_VALUES.length;

  function toggle(band: WeekdayTimeBand) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  }

  function selectFull() {
    setSelected(isFull ? new Set() : new Set(ALL_VALUES));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Inputs ocultos: uno por franja seleccionada */}
      {[...selected].map((band) => (
        <input key={band} type="hidden" name={name} value={band} />
      ))}

      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
        Disponibilidad entre semana (L–V)
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {WEEKDAY_TIME_BANDS.map((b) => {
          const on = selected.has(b.value);
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => toggle(b.value)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                background: on ? ACCENT_BG : "rgba(255,255,255,0.04)",
                border: `1px solid ${on ? ACCENT_BD : "rgba(255,255,255,0.09)"}`,
                color: on ? ACCENT : "#94a3b8", transition: "all .12s",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700 }}>{b.label}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{b.range}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={selectFull}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 12px", borderRadius: 10, cursor: "pointer",
          background: isFull ? ACCENT : "rgba(255,255,255,0.04)",
          border: `1px solid ${isFull ? ACCENT : "rgba(255,255,255,0.09)"}`,
          color: isFull ? "#0f172a" : "#94a3b8", fontSize: 12, fontWeight: 800,
          transition: "all .12s",
        }}
      >
        {isFull ? "✓ Disponibilidad total" : "Marcar disponibilidad total"}
      </button>

      <p style={{ fontSize: 11, color: "#475569" }}>
        Los fines de semana se asume disponibilidad completa. Elegí tus franjas para los partidos entre semana.
      </p>
    </div>
  );
}
