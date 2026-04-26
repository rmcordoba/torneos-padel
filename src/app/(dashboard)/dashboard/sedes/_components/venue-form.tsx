"use client";

import { useActionState } from "react";
import { createVenue, updateVenue, type VenueActionState } from "@/modules/venues/actions";
import { Building2, MapPin, Link2, Loader2, Check, AlertCircle } from "lucide-react";

interface VenueFormProps { mode: "create"; }
interface VenueEditFormProps {
  mode: "edit";
  venueId: string;
  defaultValues: { name: string; address?: string | null; city?: string | null; mapUrl?: string | null; };
}
type Props = VenueFormProps | VenueEditFormProps;

const label = { fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 6 };
const fieldErr = { fontSize: 11, color: "#f87171", marginTop: 4 };

export function VenueForm(props: Props) {
  const action = props.mode === "edit" ? updateVenue.bind(null, props.venueId) : createVenue;
  const [state, formAction, isPending] = useActionState<VenueActionState, FormData>(action, null);
  const defaults = props.mode === "edit" ? props.defaultValues : undefined;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state?.error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} /> {state.error}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label style={label}>Nombre de la sede <span style={{ color: "#f87171" }}>*</span></label>
        <div style={{ position: "relative" }}>
          <Building2 size={15} color="var(--text-darkest)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input name="name" defaultValue={defaults?.name ?? ""} placeholder="Club de pádel, centro deportivo..." required className="field-input" style={{ paddingLeft: 36 }} />
        </div>
        {state?.fieldErrors?.name && <p style={fieldErr}>{state.fieldErrors.name[0]}</p>}
      </div>

      {/* Ciudad */}
      <div>
        <label style={label}>Ciudad</label>
        <div style={{ position: "relative" }}>
          <MapPin size={15} color="var(--text-darkest)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input name="city" defaultValue={defaults?.city ?? ""} placeholder="Buenos Aires, Córdoba..." className="field-input" style={{ paddingLeft: 36 }} />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label style={label}>Dirección</label>
        <input name="address" defaultValue={defaults?.address ?? ""} placeholder="Av. Corrientes 1234" className="field-input" />
      </div>

      {/* Mapa URL */}
      <div>
        <label style={label}>Link de Google Maps</label>
        <div style={{ position: "relative" }}>
          <Link2 size={15} color="var(--text-darkest)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input name="mapUrl" type="url" defaultValue={defaults?.mapUrl ?? ""} placeholder="https://maps.google.com/..." className="field-input" style={{ paddingLeft: 36 }} />
        </div>
        {state?.fieldErrors?.mapUrl && <p style={fieldErr}>{state.fieldErrors.mapUrl[0]}</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="submit" disabled={isPending} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Check size={14} /> {props.mode === "edit" ? "Guardar cambios" : "Crear sede"}</>}
        </button>
      </div>
    </form>
  );
}
