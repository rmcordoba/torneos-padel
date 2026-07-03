"use client";

import { useRef } from "react";

interface Props {
  showAll: boolean;
  from?: string;
  to?: string;
}

export function InscripcionesFilters({ showAll, from, to }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef   = useRef<HTMLInputElement>(null);

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      if (fromRef.current) fromRef.current.value = "";
      if (toRef.current)   toRef.current.value   = "";
    }
    formRef.current?.submit();
  }

  const inputStyle = (disabled: boolean): React.CSSProperties => ({
    height: 34, padding: "0 12px",
    borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: disabled ? "#334155" : "#e2e8f0",
    fontSize: 12, fontFamily: "inherit",
    outline: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    colorScheme: "dark",
  });

  return (
    <form ref={formRef} method="GET">
      <div
        style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
          padding: "14px 18px",
          background: "rgba(12,20,40,0.6)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
        }}
      >
        {/* Checkbox "mostrar todas" */}
        <label
          style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", userSelect: "none", flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            name="showAll"
            value="1"
            defaultChecked={showAll}
            onChange={handleCheckboxChange}
            style={{ width: 15, height: 15, accentColor: "#a3e635", cursor: "pointer" }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
            Mostrar todas
          </span>
        </label>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>Desde</span>
          <input
            ref={fromRef}
            type="date"
            name="from"
            defaultValue={from ?? ""}
            disabled={showAll}
            style={inputStyle(showAll)}
          />
          <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>hasta</span>
          <input
            ref={toRef}
            type="date"
            name="to"
            defaultValue={to ?? ""}
            disabled={showAll}
            style={inputStyle(showAll)}
          />
          <button
            type="submit"
            disabled={showAll}
            style={{
              height: 34, paddingInline: 16,
              borderRadius: 9,
              background: showAll ? "rgba(255,255,255,0.05)" : "#a3e635",
              border: "none",
              color: showAll ? "#334155" : "#080e1a",
              fontSize: 12, fontWeight: 800, fontFamily: "inherit",
              cursor: showAll ? "not-allowed" : "pointer",
              opacity: showAll ? 0.45 : 1,
              boxShadow: showAll ? "none" : "0 0 16px rgba(163,230,53,0.25)",
              transition: "opacity .12s",
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </form>
  );
}
