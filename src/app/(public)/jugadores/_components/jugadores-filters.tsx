"use client";

import { useRef } from "react";

interface Props {
  q?: string;
  cat?: string;
  categories: string[];
}

const GLASS_BD  = "rgba(255,255,255,0.08)";
const ACCENT_BD = "rgba(163,230,53,0.22)";

export function JugadoresFilters({ q, cat, categories }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="GET" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#475569", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o apellido…"
            style={{
              width: "100%", height: 44, paddingLeft: 40, paddingRight: 16,
              borderRadius: 12,
              border: `1px solid ${GLASS_BD}`,
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(8px)",
              fontSize: 13, color: "#e2e8f0", fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_BD)}
            onBlur={(e) =>  (e.currentTarget.style.borderColor = GLASS_BD)}
          />
        </div>

        {/* Category dropdown */}
        <div style={{ position: "relative", flex: "0 1 220px" }}>
          <select
            name="cat"
            defaultValue={cat ?? ""}
            onChange={() => formRef.current?.submit()}
            style={{
              width: "100%", height: 44, paddingLeft: 14, paddingRight: 36,
              borderRadius: 12,
              border: `1px solid ${GLASS_BD}`,
              background: "rgba(255,255,255,0.04)",
              fontSize: 13, color: "#94a3b8", fontFamily: "inherit",
              outline: "none",
              appearance: "none", cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="sin-categoria">Sin categoría</option>
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#475569", pointerEvents: "none" }}>
            ▾
          </span>
        </div>
      </div>
    </form>
  );
}
