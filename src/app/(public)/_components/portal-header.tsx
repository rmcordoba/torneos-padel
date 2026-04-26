"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import { PortalAuthModal } from "./portal-auth-modal";
import { logoutPortal } from "@/modules/auth/portal-actions";
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";

const G  = "#16a34a";
const GL = "#f0fdf4";
const GB = "#dcfce7";
const MAX = 1140;

const NAV = [
  { id: "torneos",   label: "Torneos",   href: "/torneos"   },
  { id: "cuadros",   label: "Cuadros",   href: "/cuadros"   },
  { id: "agenda",    label: "Agenda",    href: "/agenda"    },
  { id: "ranking",   label: "Ranking",   href: "/ranking"   },
  { id: "jugadores", label: "Jugadores", href: "/jugadores" },
];

type SessionUser = {
  name?: string | null;
  email?: string | null;
  systemRole?: string | null;
};

function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (user.name ?? user.email ?? "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const firstName = user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Usuario";
  const isAdmin = user.systemRole === "SUPER_ADMIN";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px 6px 6px", borderRadius: 10,
          background: open ? GL : "#f8fafc",
          border: `1.5px solid ${open ? GB : "#e2e8f0"}`,
          cursor: "pointer", transition: "all .15s",
          fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `rgba(22,163,74,0.12)`, border: `1.5px solid rgba(22,163,74,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: G,
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {firstName}
        </span>
        <ChevronDown style={{ width: 12, height: 12, color: "#94a3b8", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)",
          background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
          boxShadow: "0 8px 28px rgba(0,0,0,0.12)", minWidth: 200,
          zIndex: 300, overflow: "hidden",
          animation: "fadeInDrop .15s ease",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{user.name ?? firstName}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{user.email}</div>
            {isAdmin && (
              <span style={{ marginTop: 6, display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fef9c3", color: "#a16207" }}>
                Super Admin
              </span>
            )}
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: G, borderBottom: "1px solid #f1f5f9", textDecoration: "none" }}
            >
              <LayoutDashboard style={{ width: 16, height: 16 }} />
              Panel admin →
            </Link>
          )}

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#475569", borderBottom: "1px solid #f1f5f9", textDecoration: "none" }}
          >
            <LayoutDashboard style={{ width: 16, height: 16 }} />
            Mi dashboard
          </Link>

          <button
            onClick={() => { setOpen(false); startTransition(() => logoutPortal()); }}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}

      <style>{`@keyframes fadeInDrop { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

export function PortalHeader({ sessionUser }: { sessionUser: SessionUser | null }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [q, setQ]             = useState("");
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTab = NAV.find((n) => pathname.startsWith(n.href))?.id ?? "torneos";

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.length > 1) router.push(`/jugadores?q=${encodeURIComponent(val)}`);
    }, 400);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <>
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 200,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Top row ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0 11px" }}>

            {/* Logo */}
            <Link href="/torneos" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: GL,
                border: `2px solid ${GB}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                🎾
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1 }}>
                  PádelPro
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
                  Portal público · 2026
                </div>
              </div>
            </Link>

            {/* Search + auth */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <input
                  value={q}
                  onChange={handleSearch}
                  placeholder="Buscar jugador o torneo…"
                  style={{
                    padding: "8px 14px 8px 36px", borderRadius: 9,
                    border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
                    background: "#f8fafc", fontFamily: "inherit", width: 220,
                    color: "#334155", transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = G)}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#cbd5e1", fontSize: 14, pointerEvents: "none" }}>
                  🔍
                </span>
              </div>

              {/* Auth */}
              {sessionUser ? (
                <UserMenu user={sessionUser} />
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setAuthModal("login")}
                    style={{
                      padding: "8px 14px", borderRadius: 9,
                      background: "transparent", color: "#475569",
                      border: "1px solid #e2e8f0", fontFamily: "inherit",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => setAuthModal("register")}
                    style={{
                      padding: "8px 16px", borderRadius: 9, background: G,
                      color: "#fff", border: "none", fontFamily: "inherit",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(22,163,74,.2)",
                    }}
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Tab nav ── */}
          <div style={{ display: "flex", gap: 0, borderTop: "1px solid #f1f5f9", overflowX: "auto" }}>
            {NAV.map((t) => {
              const active = activeTab === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "11px 18px", textDecoration: "none",
                    borderBottom: `2px solid ${active ? G : "transparent"}`,
                    color: active ? G : "#64748b",
                    fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                    marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {t.label}
                  {t.id === "agenda" && (
                    <span style={{
                      padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 800,
                      background: active ? "#dcfce7" : "#f1f5f9",
                      color: active ? G : "#94a3b8",
                    }}>
                      HOY
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

        </div>
      </header>

      {authModal && (
        <PortalAuthModal
          defaultTab={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
}
