"use client";

import { useActionState, useEffect } from "react";
import { updateOrganizerSettings, type ConfigActionState } from "@/modules/config/actions";
import { toast } from "@/hooks/use-toast";
import type { getOrganizerConfig } from "@/modules/config/queries";

type Settings = NonNullable<Awaited<ReturnType<typeof getOrganizerConfig>>>["settings"];

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

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, isPending] = useActionState<ConfigActionState, FormData>(
    updateOrganizerSettings,
    null
  );

  useEffect(() => {
    if (state?.success) toast({ type: "success", title: state.success });
  }, [state]);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state?.error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 12 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div>
          <label style={lbl}>Sets por partido (default)</label>
          <input name="defaultSetsPerMatch" type="number" min={1} max={5} defaultValue={settings?.defaultSetsPerMatch ?? 3} style={inp} />
        </div>
        <div>
          <label style={lbl}>Games por set (default)</label>
          <input name="defaultGamesPerSet" type="number" min={1} max={12} defaultValue={settings?.defaultGamesPerSet ?? 6} style={inp} />
        </div>
        <div>
          <label style={lbl}>Equipos máx. por categoría</label>
          <input name="defaultMaxTeamsPerCat" type="number" min={2} max={128} defaultValue={settings?.defaultMaxTeamsPerCat ?? 16} style={inp} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: "1px solid oklch(24% 0.01 250)" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
          <input type="hidden" name="allowPublicRegistration" value="false" />
          <input
            type="checkbox"
            name="allowPublicRegistration"
            value="true"
            defaultChecked={settings?.allowPublicRegistration ?? false}
            style={{ marginTop: 2, accentColor: "var(--accent)", width: 15, height: 15 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>Inscripción pública</p>
            <p style={{ fontSize: 11, color: "var(--text-darkest)" }}>Los jugadores pueden inscribirse desde el portal público</p>
          </div>
        </label>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
          <input type="hidden" name="requirePayment" value="false" />
          <input
            type="checkbox"
            name="requirePayment"
            value="true"
            defaultChecked={settings?.requirePayment ?? false}
            style={{ marginTop: 2, accentColor: "var(--accent)", width: 15, height: 15 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>Requiere pago</p>
            <p style={{ fontSize: 11, color: "var(--text-darkest)" }}>Las inscripciones quedan pendientes hasta confirmar el pago</p>
          </div>
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "9px 22px", borderRadius: 8,
            background: isPending ? "oklch(24% 0.01 250)" : "var(--accent)",
            border: "none", color: isPending ? "var(--text-faint)" : "#0f172a",
            fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
