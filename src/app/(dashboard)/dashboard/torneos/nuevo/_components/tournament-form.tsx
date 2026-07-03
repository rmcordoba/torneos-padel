"use client";

import { useActionState, useState, useId } from "react";
import { createTournament, type TournamentActionState } from "@/modules/tournaments/actions";
import { Plus, Trash2, Trophy, Users, ChevronRight, GitBranch, LayoutGrid, AlertCircle, Check, Loader2, Globe, Lock, Shield, RefreshCw, Shuffle } from "lucide-react";
import type { Category, Venue } from "@prisma/client";

type CompFormat = "SINGLE_ELIMINATION" | "GROUP_PLAYOFF" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "AMERICANO" | "MEXICANO";

interface CategoryEntry {
  _localId: string;
  categoryId: string;
  categoryName: string;
  format: CompFormat;
  maxTeams: number;
  setsPerMatch: number;
  gamesPerSet: number;
  pricePerTeam?: number;
  groupSize?: number;
  numGroups?: number;
  teamsAdvancePerGroup?: number;
  mexicanoRounds?: number;
}

interface TournamentFormProps {
  venues: (Venue & { courts: { id: string; name: string }[] })[];
  categories: Category[];
  organizerDefaults: { defaultSetsPerMatch: number; defaultGamesPerSet: number; defaultMaxTeamsPerCat: number; };
}

const QUICK_TEAMS = [8, 16, 32];

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};

const FORMAT_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  SINGLE_ELIMINATION: { bg: "rgba(96,165,250,0.15)",   color: "#60a5fa" },
  GROUP_PLAYOFF:      { bg: "rgba(167,139,250,0.15)",  color: "#a78bfa" },
  DOUBLE_ELIMINATION: { bg: "rgba(251,146,60,0.15)",   color: "#fb923c" },
  ROUND_ROBIN:        { bg: "rgba(45,212,191,0.15)",   color: "#2dd4bf" },
  AMERICANO:          { bg: "rgba(192,132,252,0.15)",  color: "#c084fc" },
  MEXICANO:           { bg: "rgba(244,114,182,0.15)",  color: "#f472b6" },
};

function FormatBadge({ format }: { format: CompFormat }) {
  const s = FORMAT_BADGE_STYLE[format] ?? FORMAT_BADGE_STYLE.SINGLE_ELIMINATION;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color }}>
      {FORMAT_LABELS[format] ?? format}
    </span>
  );
}

const lbl = { fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block", marginBottom: 6 };
const pillActive = { borderColor: "var(--accent-30)", background: "var(--accent-10)", color: "var(--accent)" };
const fieldErr = { fontSize: 11, color: "#f87171", marginTop: 4 };

export function TournamentForm({ venues, categories, organizerDefaults }: TournamentFormProps) {
  const [state, action, isPending] = useActionState<TournamentActionState, FormData>(createTournament, null);
  const [categoryEntries, setCategoryEntries] = useState<CategoryEntry[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [hasWeekdayPlay, setHasWeekdayPlay] = useState(false);

  return (
    <form action={action} style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

      {/* ── Left column ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {state?.error && (
          <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} /> {state.error}
          </div>
        )}

        {/* Section 1: Info */}
        <FormSection step={1} title="Información del torneo" icon={<Trophy size={14} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Nombre del torneo <span style={{ color: "#f87171" }}>*</span></label>
              <input name="name" placeholder="Ej: Copa Verano 2025" disabled={isPending} className="field-input" style={{ fontSize: 14 }} />
              {state?.fieldErrors?.name && <p style={fieldErr}>{state.fieldErrors.name[0]}</p>}
            </div>

            <div>
              <label style={lbl}>Descripción</label>
              <textarea name="description" placeholder="Descripción del torneo, premios, requisitos..." rows={3} disabled={isPending} className="field-input" style={{ resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Fecha de inicio <span style={{ color: "#f87171" }}>*</span></label>
                <input name="startDate" type="date" disabled={isPending} className="field-input" />
                {state?.fieldErrors?.startDate && <p style={fieldErr}>{state.fieldErrors.startDate[0]}</p>}
              </div>
              <div>
                <label style={lbl}>Fecha de fin <span style={{ color: "#f87171" }}>*</span></label>
                <input name="endDate" type="date" disabled={isPending} className="field-input" />
                {state?.fieldErrors?.endDate && <p style={fieldErr}>{state.fieldErrors.endDate[0]}</p>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Cierre de inscripción</label>
                <input name="registrationDeadline" type="date" disabled={isPending} className="field-input" />
              </div>
              <div>
                <label style={lbl}>Sede principal</label>
                <select name="venueId" disabled={isPending || venues.length === 0} className="field-input">
                  <option value="">Sin sede asignada</option>
                  {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Public toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-elevated)", padding: "12px 16px" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Publicar en portal público</p>
                <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>Visible para espectadores sin login</p>
              </div>
              <button type="button" role="switch" aria-checked={isPublic} onClick={() => setIsPublic((v) => !v)}
                style={{ position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", background: isPublic ? "var(--accent)" : "var(--border-strong)", cursor: "pointer", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 2, left: isPublic ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: isPublic ? "#0a0f0a" : "var(--bg-elevated)", transition: "left 0.2s", display: "block" }} />
              </button>
              <input type="hidden" name="isPublic" value={String(isPublic)} />
            </div>

            {/* Weekday play toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-elevated)", padding: "12px 16px" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Se juega entre semana (L–V)</p>
                <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>Pedir disponibilidad horaria a las parejas al inscribirse</p>
              </div>
              <button type="button" role="switch" aria-checked={hasWeekdayPlay} onClick={() => setHasWeekdayPlay((v) => !v)}
                style={{ position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", background: hasWeekdayPlay ? "var(--accent)" : "var(--border-strong)", cursor: "pointer", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 2, left: hasWeekdayPlay ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: hasWeekdayPlay ? "#0a0f0a" : "var(--bg-elevated)", transition: "left 0.2s", display: "block" }} />
              </button>
              <input type="hidden" name="hasWeekdayPlay" value={String(hasWeekdayPlay)} />
            </div>
          </div>
        </FormSection>

        {/* Section 2: Categories */}
        <FormSection step={2} title="Categorías del torneo" icon={<Users size={14} />}>
          {state?.fieldErrors?.categoriesJson && (
            <p style={{ ...fieldErr, display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
              <AlertCircle size={13} /> {state.fieldErrors.categoriesJson[0]}
            </p>
          )}

          <input type="hidden" name="categoriesJson" value={JSON.stringify(categoryEntries.map(({ _localId, categoryName, ...rest }) => rest))} />

          {categoryEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {categoryEntries.map((entry) => (
                <CategoryCard key={entry._localId} entry={entry} onRemove={() => setCategoryEntries((p) => p.filter((e) => e._localId !== entry._localId))} />
              ))}
            </div>
          )}

          {addingCategory ? (
            <AddCategoryForm
              categories={categories}
              usedCategoryIds={categoryEntries.map((e) => e.categoryId)}
              organizerDefaults={organizerDefaults}
              onAdd={(entry) => { setCategoryEntries((p) => [...p, { ...entry, _localId: crypto.randomUUID() }]); setAddingCategory(false); }}
              onCancel={() => setAddingCategory(false)}
            />
          ) : (
            <button type="button" onClick={() => setAddingCategory(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, border: "2px dashed var(--border-strong)", padding: "16px", fontSize: 13, fontWeight: 600, color: "var(--text-faint)", background: "transparent", cursor: "pointer" }}>
              <Plus size={16} /> Agregar categoría
            </button>
          )}

          {categories.length === 0 && (
            <p style={{ fontSize: 12, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
              No hay categorías configuradas. Creá categorías en Configuración primero.
            </p>
          )}
        </FormSection>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <a href="/dashboard/torneos" style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Cancelar
          </a>
          <button type="submit" disabled={isPending || categoryEntries.length === 0}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 24px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: categoryEntries.length === 0 ? "not-allowed" : "pointer", opacity: (isPending || categoryEntries.length === 0) ? 0.5 : 1 }}>
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Creando torneo...</> : <><Trophy size={14} /> Crear torneo</>}
          </button>
        </div>
      </div>

      {/* ── Right column: summary ── */}
      <div style={{ position: "sticky", top: 24 }}>
        <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", background: "var(--accent-15)", borderBottom: "1px solid var(--accent-30)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Resumen</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 2, fontFamily: "var(--font-space), sans-serif" }}>Vista previa</p>
          </div>
          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Categorías ({categoryEntries.length})
              </p>
              {categoryEntries.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-dimmer)", fontStyle: "italic" }}>Sin categorías aún</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {categoryEntries.map((entry) => (
                    <div key={entry._localId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.categoryName}</p>
                        <p style={{ fontSize: 11, color: "var(--text-dimmer)" }}>{entry.maxTeams} parejas · {FORMAT_LABELS[entry.format] ?? entry.format}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Visibilidad</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 12px", background: isPublic ? "var(--accent-15)" : "var(--bg-elevated)", border: `1px solid ${isPublic ? "var(--accent-30)" : "var(--border-default)"}` }}>
                {isPublic ? <Globe size={13} color="var(--accent)" /> : <Lock size={13} color="var(--text-faint)" />}
                <span style={{ fontSize: 12, fontWeight: 600, color: isPublic ? "var(--accent)" : "var(--text-faint)" }}>
                  {isPublic ? "Público — visible en portal" : "Privado — solo organizadores"}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
              <p style={{ fontSize: 11, color: "var(--text-dimmer)", lineHeight: 1.5 }}>
                El torneo se crea en estado <strong style={{ color: "var(--text-muted)" }}>Borrador</strong>. Podés publicarlo y abrir inscripciones desde el detalle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────
function CategoryCard({ entry, onRemove }: { entry: CategoryEntry; onRemove: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-elevated)", padding: "12px 14px" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Users size={15} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{entry.categoryName}</p>
          <FormatBadge format={entry.format} />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>
          {entry.maxTeams} parejas · {entry.setsPerMatch} sets de {entry.gamesPerSet} games{entry.pricePerTeam ? ` · $${entry.pricePerTeam}` : ""}
        </p>
      </div>
      <button type="button" onClick={onRemove} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-darkest)" }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── AddCategoryForm ──────────────────────────────────────────────────────────
function AddCategoryForm({ categories, usedCategoryIds, organizerDefaults, onAdd, onCancel }: {
  categories: Category[];
  usedCategoryIds: string[];
  organizerDefaults: TournamentFormProps["organizerDefaults"];
  onAdd: (entry: Omit<CategoryEntry, "_localId">) => void;
  onCancel: () => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [format, setFormat] = useState<CompFormat>("SINGLE_ELIMINATION");
  const [maxTeams, setMaxTeams] = useState(organizerDefaults.defaultMaxTeamsPerCat);
  const [setsPerMatch, setSetsPerMatch] = useState(organizerDefaults.defaultSetsPerMatch);
  const [gamesPerSet, setGamesPerSet] = useState(organizerDefaults.defaultGamesPerSet);
  const [pricePerTeam, setPricePerTeam] = useState("");
  const [groupSize, setGroupSize] = useState(4);
  const [groupingMode, setGroupingMode] = useState<"size" | "count">("size");
  const [numGroups, setNumGroups] = useState(4);
  const [teamsAdvance, setTeamsAdvance] = useState(2);
  const [mexicanoRounds, setMexicanoRounds] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const uid = useId();

  const availableCategories = categories.filter((c) => !usedCategoryIds.includes(c.id));

  function handleSubmit() {
    if (!selectedCategoryId) return;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (!cat) return;
    onAdd({
      categoryId: selectedCategoryId,
      categoryName: cat.name,
      format,
      maxTeams,
      setsPerMatch,
      gamesPerSet,
      pricePerTeam: pricePerTeam ? Number(pricePerTeam) : undefined,
      groupSize: format === "GROUP_PLAYOFF" && groupingMode === "size" ? groupSize : undefined,
      numGroups: format === "GROUP_PLAYOFF" && groupingMode === "count" ? numGroups : undefined,
      teamsAdvancePerGroup: format === "GROUP_PLAYOFF" ? teamsAdvance : undefined,
      mexicanoRounds: format === "MEXICANO" ? mexicanoRounds : undefined,
    });
  }

  return (
    <div style={{ borderRadius: 10, border: "2px solid var(--accent-30)", background: "var(--accent-15)", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Nueva categoría</p>

      {/* Categoría */}
      <div>
        <label style={lbl}>Categoría <span style={{ color: "#f87171" }}>*</span></label>
        {availableCategories.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text-faint)", fontStyle: "italic" }}>Todas las categorías ya fueron agregadas.</p>
        ) : (
          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="field-input">
            <option value="">Seleccioná una categoría</option>
            {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Formato */}
      <div>
        <label style={lbl}>Formato de competencia</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FormatCard id={`${uid}-elim`}    selected={format === "SINGLE_ELIMINATION"} onClick={() => setFormat("SINGLE_ELIMINATION")} icon={<GitBranch size={18} />} title="Eliminación directa"     description="Cuadro de llaves. Perdés y salís." />
          <FormatCard id={`${uid}-groups`}  selected={format === "GROUP_PLAYOFF"}      onClick={() => setFormat("GROUP_PLAYOFF")}      icon={<LayoutGrid size={18} />} title="Grupos + Playoff"         description="Fase de grupos y luego eliminación." />
          <FormatCard id={`${uid}-de`}      selected={format === "DOUBLE_ELIMINATION"} onClick={() => setFormat("DOUBLE_ELIMINATION")} icon={<Shield size={18} />}     title="Doble eliminación"        description="Segunda oportunidad en cuadro B." />
          <FormatCard id={`${uid}-rr`}      selected={format === "ROUND_ROBIN"}        onClick={() => setFormat("ROUND_ROBIN")}        icon={<RefreshCw size={18} />}  title="Liga"                     description="Todos contra todos. Gana el mejor." />
          <FormatCard id={`${uid}-amer`}    selected={format === "AMERICANO"}          onClick={() => setFormat("AMERICANO")}          icon={<Shuffle size={18} />}    title="Americano"                description="Todos contra todos, gana por games." />
          <FormatCard id={`${uid}-mex`}     selected={format === "MEXICANO"}           onClick={() => setFormat("MEXICANO")}           icon={<Shuffle size={18} />}    title="Mexicano"                 description="Parejas dinámicas por puntaje acumulado." />
        </div>
      </div>

      {/* Config: Grupos + Playoff */}
      {format === "GROUP_PLAYOFF" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
          <div>
            <label style={lbl}>Armado de grupos</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setGroupingMode("size")} className="filter-pill" style={groupingMode === "size" ? pillActive : undefined}>
                Por tamaño de grupo
              </button>
              <button type="button" onClick={() => setGroupingMode("count")} className="filter-pill" style={groupingMode === "count" ? pillActive : undefined}>
                Por cantidad de grupos
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {groupingMode === "size" ? (
              <div>
                <label style={lbl}>Equipos por grupo</label>
                <select value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} className="field-input">
                  {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} equipos</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={lbl}>Cantidad de grupos</label>
                <select value={numGroups} onChange={(e) => setNumGroups(Number(e.target.value))} className="field-input">
                  {[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map((n) => <option key={n} value={n}>{n} grupos</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>Clasifican al playoff</label>
              <select value={teamsAdvance} onChange={(e) => setTeamsAdvance(Number(e.target.value))} className="field-input">
                {[1, 2, 3].map((n) => <option key={n} value={n}>{n} por grupo</option>)}
              </select>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {groupingMode === "count"
              ? `Las parejas se reparten balanceadas en ${numGroups} grupos (difieren a lo sumo en 1). Ej: 19 parejas en 6 grupos → cinco de 3 y uno de 4.`
              : "La cantidad de grupos se calcula según las parejas inscriptas."}
            {" "}En el playoff, los byes les tocan a los mejores de la fase de grupos.
          </p>
        </div>
      )}

      {/* Config: Mexicano */}
      {format === "MEXICANO" && (
        <div style={{ padding: 14, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
          <label style={lbl}>Cantidad de rondas</label>
          <select value={mexicanoRounds} onChange={(e) => setMexicanoRounds(Number(e.target.value))} className="field-input">
            {[5, 6, 7, 8, 9, 10, 12].map((n) => <option key={n} value={n}>{n} rondas</option>)}
          </select>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
            Cada ronda se genera automáticamente basada en el ranking acumulado.
          </p>
        </div>
      )}

      {/* Cupo */}
      <div>
        <label style={lbl}>Cupo máximo de parejas</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {QUICK_TEAMS.map((n) => (
            <button key={n} type="button" onClick={() => setMaxTeams(n)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${maxTeams === n ? "var(--accent)" : "var(--border-default)"}`, background: maxTeams === n ? "var(--accent-15)" : "var(--bg-surface)", color: maxTeams === n ? "var(--accent)" : "var(--text-faint)", cursor: "pointer" }}>
              {n}
            </button>
          ))}
          <input type="number" min={2} max={256} value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))} className="field-input" style={{ width: 80, textAlign: "center" }} placeholder="Otro" />
        </div>
      </div>

      {/* Precio */}
      <div>
        <label style={lbl}>Precio por pareja (opcional)</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", fontSize: 13, fontWeight: 600 }}>$</span>
          <input type="number" min={0} step={0.01} placeholder="0.00" value={pricePerTeam} onChange={(e) => setPricePerTeam(e.target.value)} className="field-input" style={{ paddingLeft: 28 }} />
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button type="button" onClick={() => setShowAdvanced((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer" }}>
          <ChevronRight size={14} style={{ transform: showAdvanced ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          Configuración avanzada del partido
        </button>
        {showAdvanced && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10, padding: 14, borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
            <div>
              <label style={lbl}>Sets por partido</label>
              <select value={setsPerMatch} onChange={(e) => setSetsPerMatch(Number(e.target.value))} className="field-input">
                {[1, 3, 5].map((n) => <option key={n} value={n}>{n} set{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Games por set</label>
              <select value={gamesPerSet} onChange={(e) => setGamesPerSet(Number(e.target.value))} className="field-input">
                {[4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} games</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: "1px solid var(--accent-30)" }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit} disabled={!selectedCategoryId || availableCategories.length === 0}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 7, border: "none", background: "var(--accent)", color: "#0a0f0a", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: (!selectedCategoryId || availableCategories.length === 0) ? 0.4 : 1 }}>
          <Check size={13} /> Agregar categoría
        </button>
      </div>
    </div>
  );
}

// ─── FormatCard ───────────────────────────────────────────────────────────────
function FormatCard({ id, selected, onClick, icon, title, description }: {
  id: string; selected: boolean; onClick: () => void;
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <button type="button" id={id} onClick={onClick}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, borderRadius: 10, border: `2px solid ${selected ? "var(--accent)" : "var(--border-default)"}`, padding: 14, textAlign: "left", cursor: "pointer", background: selected ? "var(--accent-15)" : "var(--bg-surface)", transition: "all 0.12s" }}>
      {selected && (
        <div style={{ position: "absolute", top: 10, right: 10, width: 16, height: 16, borderRadius: "50%", background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={10} color="var(--accent)" />
        </div>
      )}
      <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--accent-15)" : "var(--bg-elevated)", color: selected ? "var(--accent)" : "var(--text-faint)" }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: selected ? "var(--accent)" : "var(--text-primary)" }}>{title}</p>
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2, lineHeight: 1.4 }}>{description}</p>
      </div>
    </button>
  );
}

// ─── FormSection ──────────────────────────────────────────────────────────────
function FormSection({ step, title, icon, children }: {
  step: number; title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0a0f0a", flexShrink: 0 }}>
          {step}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
          {icon} {title}
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}
