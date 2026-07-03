"use client";

import { useActionState, useEffect, useRef } from "react";
import { upsertPlayerProfile, type PlayerProfileState } from "@/modules/player/actions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string | null;
    birthDate: string | null;
    dni: string | null;
  } | null;
}

const INPUT_STYLE: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8, fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f8fafc",
  outline: "none",
  width: "100%", boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 6, display: "block",
};

export function PlayerProfileForm({ initialData }: Props) {
  const [state, action, isPending] = useActionState<PlayerProfileState, FormData>(upsertPlayerProfile, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (state?.error === "__saved__" && !submitted.current) {
      submitted.current = true;
      toast({ type: "success", title: "Perfil guardado", description: "Tu información fue actualizada correctamente." });
    }
    if (state?.error && state.error !== "__saved__" && !state.fieldErrors) {
      toast({ type: "error", title: "Error", description: state.error });
    }
  }, [state]);

  useEffect(() => { submitted.current = false; }, [state]);

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Nombre *" error={fe.firstName?.[0]}>
          <input
            name="firstName"
            defaultValue={initialData?.firstName ?? ""}
            required
            disabled={isPending}
            style={INPUT_STYLE}
          />
        </Field>
        <Field label="Apellido *" error={fe.lastName?.[0]}>
          <input
            name="lastName"
            defaultValue={initialData?.lastName ?? ""}
            required
            disabled={isPending}
            style={INPUT_STYLE}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Teléfono" error={fe.phone?.[0]}>
          <input
            name="phone"
            type="tel"
            defaultValue={initialData?.phone ?? ""}
            placeholder="+54 9 11 1234-5678"
            disabled={isPending}
            style={INPUT_STYLE}
          />
        </Field>
        <Field label="DNI" error={fe.dni?.[0]}>
          <input
            name="dni"
            defaultValue={initialData?.dni ?? ""}
            placeholder="12345678"
            disabled={isPending}
            style={INPUT_STYLE}
          />
        </Field>
      </div>

      <Field label="Fecha de nacimiento" error={fe.birthDate?.[0]}>
        <input
          name="birthDate"
          type="date"
          defaultValue={initialData?.birthDate ?? ""}
          disabled={isPending}
          style={{ ...INPUT_STYLE, colorScheme: "dark" }}
        />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: "#a3e635", color: "#000", border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {isPending ? "Guardando…" : initialData ? "Guardar cambios" : "Crear perfil"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
      {error && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>{error}</p>}
    </div>
  );
}
