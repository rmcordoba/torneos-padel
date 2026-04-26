"use client";

import { useActionState, useEffect } from "react";
import { updateOrganizerInfo, type ConfigActionState } from "@/modules/config/actions";
import { toast } from "@/hooks/use-toast";
import type { getOrganizerConfig } from "@/modules/config/queries";

type Organizer = NonNullable<Awaited<ReturnType<typeof getOrganizerConfig>>>;

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

export function OrganizerInfoForm({ organizer }: { organizer: Organizer }) {
  const [state, action, isPending] = useActionState<ConfigActionState, FormData>(
    updateOrganizerInfo,
    null
  );

  useEffect(() => {
    if (state?.success) toast({ type: "success", title: state.success });
  }, [state]);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {state?.error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 12 }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Nombre del organizador *</label>
          <input name="name" defaultValue={organizer.name} required style={inp} />
          {state?.fieldErrors?.name && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Descripción</label>
          <textarea
            name="description"
            defaultValue={organizer.description ?? ""}
            rows={3}
            style={{ ...inp, resize: "none" }}
          />
        </div>

        <div>
          <label style={lbl}>Email</label>
          <input name="email" type="email" defaultValue={organizer.email ?? ""} style={inp} />
          {state?.fieldErrors?.email && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label style={lbl}>Teléfono</label>
          <input name="phone" defaultValue={organizer.phone ?? ""} style={inp} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lbl}>Sitio web</label>
          <input name="website" type="url" placeholder="https://" defaultValue={organizer.website ?? ""} style={inp} />
          {state?.fieldErrors?.website && (
            <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{state.fieldErrors.website[0]}</p>
          )}
        </div>
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
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
