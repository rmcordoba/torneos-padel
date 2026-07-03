"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import { PortalAuthModal } from "./portal-auth-modal";
import { logoutPortal } from "@/modules/auth/portal-actions";
import { LayoutDashboard, LogOut, ChevronDown, Search } from "lucide-react";

const ACCENT = "#a3e635";
const MAX    = 1140;

const NAV = [
  { id: "torneos",   label: "Torneos",   href: "/torneos"   },
  { id: "reservas",  label: "Reservar",  href: "/reservas"  },
  { id: "cuadros",   label: "Cuadros",   href: "/cuadros"   },
  { id: "agenda",    label: "Agenda",    href: "/agenda"    },
  { id: "ranking",   label: "Ranking",   href: "/ranking"   },
  { id: "jugadores", label: "Jugadores", href: "/jugadores" },
];

type SessionUser = {
  name?: string | null;
  email?: string | null;
  systemRole?: string | null;
  isOrganizer?: boolean;
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
  const isAdmin    = user.systemRole === "SUPER_ADMIN";
  const isOrganizer = user.isOrganizer ?? false;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px 6px 6px", borderRadius: 100,
          background: open ? "rgba(163,230,53,0.1)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(163,230,53,0.25)" : "rgba(255,255,255,0.08)"}`,
          cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "rgba(163,230,53,0.15)",
          border: "1.5px solid rgba(163,230,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: ACCENT,
          fontFamily: "var(--font-space), sans-serif",
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {firstName}
        </span>
        <ChevronDown style={{ width: 12, height: 12, color: "#64748b", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 10px)",
          background: "rgba(6,12,30,0.97)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRadius: 16, border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          minWidth: 210, zIndex: 300, overflow: "hidden",
          animation: "fadeInDrop .18s cubic-bezier(0.23,1,0.32,1)",
        }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{user.name ?? firstName}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{user.email}</div>
            {isAdmin && (
              <span style={{ marginTop: 8, display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                Super Admin
              </span>
            )}
          </div>

          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, color: ACCENT, borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}>
              <LayoutDashboard style={{ width: 15, height: 15 }} />Panel admin →
            </Link>
          )}
          {isOrganizer && (
            <Link href="/dashboard" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}>
              <LayoutDashboard style={{ width: 15, height: 15 }} />Mi dashboard
            </Link>
          )}
          {!isOrganizer && !isAdmin && (
            <Link href="/dashboard/jugador" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}>
              <LayoutDashboard style={{ width: 15, height: 15 }} />Mi panel
            </Link>
          )}

          <button
            onClick={() => { setOpen(false); startTransition(() => logoutPortal()); }}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", fontSize: 13, fontWeight: 600, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
            {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}

      <style>{`@keyframes fadeInDrop { from { opacity:0; transform:translateY(6px) scale(0.96) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

export function PortalHeader({
  sessionUser,
  basePath = "",
  brand,
  showBookings = true,
}: {
  sessionUser: SessionUser | null;
  basePath?: string;
  brand?: { name: string; logoUrl?: string | null } | null;
  showBookings?: boolean;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  const nav = showBookings ? NAV : NAV.filter((n) => n.id !== "reservas");
  const rel = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const activeTab = nav.find((n) => rel.startsWith(n.href))?.id ?? "torneos";
  const link = (href: string) => `${basePath}${href}`;

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.length > 1) router.push(`${basePath}/jugadores?q=${encodeURIComponent(val)}`);
    }, 400);
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <>
      <header style={{
        background: "rgba(5,12,24,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 200,
        boxShadow: "0 1px 0 rgba(163,230,53,0.04), 0 8px 32px rgba(0,0,0,0.3)",
      }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", height: 60, gap: 8 }}>

            {/* ── Logo ── */}
            <Link href={basePath || "/torneos"} style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0, marginRight: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: brand?.logoUrl ? "transparent" : "rgba(163,230,53,0.12)",
                border: "1.5px solid rgba(163,230,53,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0, overflow: "hidden",
                boxShadow: "0 0 16px rgba(163,230,53,0.15)",
              }}>
                {brand?.logoUrl
                  ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "🎾"}
              </div>
              <div style={{ lineHeight: 1 }}>
                {brand ? (
                  <div style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 15, color: "#f8fafc", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {brand.name}
                  </div>
                ) : (
                  <div style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 15 }}>
                    <span style={{ color: "#f8fafc" }}>Pádel</span>
                    <span style={{ color: ACCENT }}>Pro</span>
                  </div>
                )}
                <div style={{ fontSize: 9, color: "#334155", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>
                  {brand ? "PORTAL DEL CLUB" : "PORTAL PÚBLICO"}
                </div>
              </div>
            </Link>

            {/* ── Pill Navigation ── */}
            <nav style={{ display: "flex", gap: 2, overflowX: "auto", flex: 1 }}>
              {nav.map((t) => {
                const active = activeTab === t.id;
                return (
                  <Link
                    key={t.id}
                    href={link(t.href)}
                    className={`nav-pill${active ? " active" : ""}`}
                  >
                    {t.label}
                    {t.id === "agenda" && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 10,
                        background: active ? "rgba(163,230,53,0.2)" : "rgba(255,255,255,0.06)",
                        color: active ? ACCENT : "#475569",
                      }}>HOY</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── Search + Auth ── */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              {/* Search */}
              {searchOpen ? (
                <div style={{ position: "relative" }}>
                  <input
                    ref={searchRef}
                    value={q}
                    onChange={handleSearch}
                    onBlur={() => { if (!q) setSearchOpen(false); }}
                    placeholder="Buscar jugador…"
                    style={{
                      width: 200, height: 36, padding: "0 14px 0 36px",
                      borderRadius: 100, border: "1px solid rgba(163,230,53,0.25)",
                      fontSize: 13, color: "#e2e8f0",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#64748b", pointerEvents: "none" }} />
                </div>
              ) : (
                <button
                  onClick={openSearch}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
                >
                  <Search style={{ width: 14, height: 14 }} />
                </button>
              )}

              {/* Auth */}
              {sessionUser ? (
                <UserMenu user={sessionUser} />
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setAuthModal("login")}
                    style={{
                      height: 36, padding: "0 16px", borderRadius: 100,
                      background: "transparent", color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setAuthModal("register")}
                    style={{
                      height: 36, padding: "0 18px", borderRadius: 100,
                      background: ACCENT, color: "#080e1a",
                      border: "none", fontFamily: "inherit",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 0 20px rgba(163,230,53,0.3)",
                      transition: "all .15s",
                    }}
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {authModal && (
        <PortalAuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  );
}
