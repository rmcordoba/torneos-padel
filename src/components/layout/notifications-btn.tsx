"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationsBtn({ pendingCount }: { pendingCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: open ? "var(--bg-elevated)" : "var(--bg-surface)",
          border: `1px solid ${open ? "var(--border-subtle)" : "var(--border-default)"}`,
          color: open ? "var(--text-primary)" : "var(--text-faint)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .12s",
        }}
      >
        <Bell size={15} />
      </button>

      {/* Badge */}
      {pendingCount > 0 && (
        <span style={{
          position: "absolute", top: -4, right: -4,
          minWidth: 16, height: 16, padding: "0 4px",
          background: "#fbbf24", borderRadius: 20,
          fontSize: 9, fontWeight: 800, color: "#0a0f0a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-space), sans-serif",
          pointerEvents: "none",
        }}>
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 280, borderRadius: 12,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 8px 32px rgba(0,0,0,.35)",
          overflow: "hidden", zIndex: 100,
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
              Notificaciones
            </span>
          </div>

          {pendingCount > 0 ? (
            <>
              <Link
                href="/dashboard/inscripciones"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", textDecoration: "none",
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  📋
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Inscripciones pendientes hoy
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                    {pendingCount} nueva{pendingCount !== 1 ? "s" : ""} solicitud{pendingCount !== 1 ? "es" : ""} hoy
                  </div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-faint)" }}>→</span>
              </Link>

              <div style={{ padding: "10px 16px" }}>
                <Link
                  href="/dashboard/inscripciones"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block", textAlign: "center", padding: "7px",
                    borderRadius: 8, background: "rgba(163,230,53,.1)",
                    border: "1px solid rgba(163,230,53,.25)",
                    fontSize: 12, fontWeight: 700, color: "#a3e635",
                    textDecoration: "none",
                  }}
                >
                  Ver todas las inscripciones
                </Link>
              </div>
            </>
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Todo al día</div>
              <div style={{ fontSize: 11, color: "var(--text-darkest)", marginTop: 4 }}>
                No hay notificaciones pendientes
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
