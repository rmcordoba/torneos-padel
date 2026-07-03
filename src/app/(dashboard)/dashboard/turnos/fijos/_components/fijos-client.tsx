"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Loader2, Check, X, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createRecurringBooking, deleteRecurringBooking,
  type RecurringActionState,
} from "@/modules/bookings/actions";

const VIOLET = "#a78bfa";
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface Template {
  id: string;
  weekday: number;
  startMinute: number;
  durationMin: number;
  validFrom: string;
  validUntil: string | null;
  customerName: string;
  customerPhone: string | null;
  price: number | null;
  courtName: string;
  venueName: string;
  occurrences: number;
}

interface Venue {
  id: string;
  name: string;
  courts: { id: string; name: string; bookingPrice: number | null }[];
}

function minutesToLabel(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function FijosClient({ templates, venues }: { templates: Template[]; venues: Venue[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ maxWidth: 840, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Breadcrumb + header */}
      <div>
        <Link href="/dashboard/turnos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 12 }}>
          <ChevronLeft size={14} /> Turnos
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <CalendarClock size={24} color={VIOLET} />
              <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
                Turnos fijos
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "#475569" }}>
              Reservas recurrentes semanales. Se generan automáticamente hacia adelante.
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10,
              background: VIOLET, color: "#080e1a", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 0 20px rgba(167,139,250,0.3)", flexShrink: 0,
            }}>
              <Plus size={15} /> Nuevo turno fijo
            </button>
          )}
        </div>
      </div>

      {/* Form de creación */}
      {showForm && (
        <CreateForm venues={venues} onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); router.refresh(); }} />
      )}

      {/* Lista */}
      {templates.length === 0 ? (
        <div style={{ borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center" }}>
          <CalendarClock size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#94a3b8", fontFamily: "var(--font-space), sans-serif", marginBottom: 6 }}>Sin turnos fijos</h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 320, margin: "0 auto" }}>
            Creá un turno fijo para reservar automáticamente la misma cancha y horario cada semana.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map((t) => <TemplateRow key={t.id} t={t} onDone={() => router.refresh()} />)}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ t, onDone }: { t: Template; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remove = () => {
    if (!confirm(`¿Eliminar el turno fijo de ${t.customerName} (${DAYS[t.weekday]} ${minutesToLabel(t.startMinute)})? Se quitarán las reservas futuras.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteRecurringBooking(t.id);
      if (r?.error) setError(r.error);
      else onDone();
    });
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14,
      background: "rgba(12,20,40,0.7)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(167,139,250,0.18)",
      borderLeft: "3px solid #a78bfa",
    }}>
      {/* Día + hora */}
      <div style={{ flexShrink: 0, width: 86, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: VIOLET, textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAYS[t.weekday].slice(0, 3)}</div>
        <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color: "#f8fafc", lineHeight: 1.1 }}>{minutesToLabel(t.startMinute)}</div>
        <div style={{ fontSize: 10, color: "#475569" }}>{t.durationMin} min</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>{t.customerName}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {t.courtName} · {t.venueName}{t.customerPhone ? ` · ${t.customerPhone}` : ""}
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
          Desde {t.validFrom}{t.validUntil ? ` hasta ${t.validUntil}` : " · sin fin"}
          {t.price != null && ` · $${t.price.toLocaleString("es-AR")}`}
        </div>
      </div>

      {/* Ocurrencias + eliminar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: VIOLET, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", padding: "4px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>
          {t.occurrences} próx.
        </span>
        <button onClick={remove} disabled={pending} title="Eliminar turno fijo" style={{
          width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.1)",
          color: "#fb7185", cursor: pending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
      {error && <span style={{ fontSize: 11, color: "#fb7185" }}>{error}</span>}
    </div>
  );
}

function CreateForm({ venues, onClose, onDone }: { venues: Venue[]; onClose: () => void; onDone: () => void }) {
  const [state, action, pending] = useActionState<RecurringActionState, FormData>(createRecurringBooking, null);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [courtId, setCourtId] = useState(venues[0]?.courts[0]?.id ?? "");
  const [weekday, setWeekday] = useState("1");
  const [time, setTime] = useState("20:00");
  const [duration, setDuration] = useState("90");

  const courts = venues.find((v) => v.id === venueId)?.courts ?? [];
  const selectedCourt = courts.find((c) => c.id === courtId);
  const startMinute = (() => { const [h, m] = time.split(":").map(Number); return h * 60 + (m || 0); })();

  // Cerrar al crear con éxito
  useEffect(() => {
    if (state && "ok" in state) {
      const tmo = setTimeout(onDone, 1400);
      return () => clearTimeout(tmo);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = state && "ok" in state ? state : null;
  const err = state && "error" in state ? state.error : null;

  return (
    <form action={action} style={{
      borderRadius: 18, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(12,20,40,0.7)",
      backdropFilter: "blur(16px)", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(167,139,250,0.08)" }}>
        <span style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>Nuevo turno fijo</span>
        <button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
      </div>

      {/* hidden inputs derivados */}
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="weekday" value={weekday} />
      <input type="hidden" name="startMinute" value={startMinute} />
      <input type="hidden" name="durationMin" value={duration} />

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {ok && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#a3e635" }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            Turno fijo creado. Se generaron <b>{ok.created}</b> reserva{ok.created !== 1 ? "s" : ""}
            {ok.skipped > 0 && <> · <span style={{ color: "#fb923c" }}>{ok.skipped} omitida{ok.skipped !== 1 ? "s" : ""} por superposición</span></>}.
          </div>
        )}
        {err && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fb7185" }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {err}
          </div>
        )}

        {/* Sede + cancha */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <L label="Sede">
            <select value={venueId} onChange={(e) => { setVenueId(e.target.value); const c = venues.find(v => v.id === e.target.value)?.courts[0]?.id ?? ""; setCourtId(c); }} style={sel}>
              {venues.map((v) => <option key={v.id} value={v.id} style={opt}>{v.name}</option>)}
            </select>
          </L>
          <L label="Cancha">
            <select value={courtId} onChange={(e) => setCourtId(e.target.value)} style={sel}>
              {courts.map((c) => <option key={c.id} value={c.id} style={opt}>{c.name}</option>)}
            </select>
          </L>
        </div>

        {/* Día + hora + duración */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12 }}>
          <L label="Día de la semana">
            <select value={weekday} onChange={(e) => setWeekday(e.target.value)} style={sel}>
              {DAYS.map((d, i) => <option key={i} value={i} style={opt}>{d}</option>)}
            </select>
          </L>
          <L label="Hora">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...sel, colorScheme: "dark" }} />
          </L>
          <L label="Duración">
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={sel}>
              <option value="60" style={opt}>60 min</option>
              <option value="90" style={opt}>90 min</option>
              <option value="120" style={opt}>120 min</option>
            </select>
          </L>
        </div>

        {/* Cliente */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
          <L label="Cliente"><input name="customerName" required placeholder="Nombre y apellido" style={sel} /></L>
          <L label="Teléfono"><input name="customerPhone" placeholder="Opcional" style={sel} /></L>
        </div>

        {/* Vigencia + precio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <L label="Desde"><input name="validFrom" type="date" required defaultValue={todayStr()} style={{ ...sel, colorScheme: "dark" }} /></L>
          <L label="Hasta (opcional)"><input name="validUntil" type="date" style={{ ...sel, colorScheme: "dark" }} /></L>
          <L label="Precio"><input name="price" type="number" min={0} step="100" defaultValue={selectedCourt?.bookingPrice ?? ""} placeholder="0" style={sel} /></L>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose} style={{ padding: "9px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
          <button type="submit" disabled={pending} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 10, border: "none",
            background: VIOLET, color: "#080e1a", fontSize: 13, fontWeight: 800, cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "inherit", boxShadow: "0 0 18px rgba(167,139,250,0.3)", opacity: pending ? 0.6 : 1,
          }}>
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Crear y generar
          </button>
        </div>
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}

const sel: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  // Hace que el navegador dibuje el desplegable nativo en oscuro (texto visible sin pasar el mouse)
  colorScheme: "dark",
};

// Cuando el <select> tiene un fondo personalizado, Chromium en Windows deja de aplicar
// colorScheme al desplegable y pinta las opciones con fondo blanco. Forzamos colores explícitos.
const opt: React.CSSProperties = { background: "#0f172a", color: "#f1f5f9" };
