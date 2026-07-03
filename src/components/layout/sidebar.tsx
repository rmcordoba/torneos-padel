"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import {
  LayoutDashboard, Trophy, Users, ClipboardList,
  Calendar, CalendarClock, BarChart2, Settings,
  FileBarChart, Globe, LogOut, ShieldAlert, Check, ChevronsUpDown, CreditCard,
} from "lucide-react";
import { logout } from "@/modules/auth/actions";
import { setActiveOrganizer } from "@/modules/organizers/actions";
import { ResponsiveAside } from "@/components/layout/responsive-aside";
import { DashSearch } from "@/components/layout/dash-search";

const ACCENT = "#a3e635";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",               icon: LayoutDashboard, exact: true },
  { label: "Torneos",       href: "/dashboard/torneos",       icon: Trophy },
  { label: "Turnos",        href: "/dashboard/turnos",        icon: CalendarClock, requiresBookings: true },
  { label: "Jugadores",     href: "/dashboard/jugadores",     icon: Users },
  { label: "Inscripciones", href: "/dashboard/inscripciones", icon: ClipboardList },
  { label: "Calendario",    href: "/dashboard/calendario",    icon: Calendar },
  { label: "Ranking",       href: "/dashboard/ranking",       icon: BarChart2 },
];

const secondaryItems = [
  { label: "Portal público", href: "/torneos",                 icon: Globe },
  { label: "Reportes",       href: "/dashboard/reportes",      icon: FileBarChart },
  { label: "Facturación",    href: "/dashboard/facturacion",   icon: CreditCard },
  { label: "Configuración",  href: "/dashboard/configuracion", icon: Settings },
];

interface OrganizerOption {
  id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  organizerName?: string;
  organizerSlug?: string;
  activeOrganizerId?: string;
  organizers?: OrganizerOption[];
  hasBookings?: boolean;
  userName?: string;
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export function Sidebar({ organizerName, organizerSlug, activeOrganizerId, organizers = [], hasBookings = false, userName, userEmail, isSuperAdmin }: SidebarProps) {
  const pathname = usePathname();
  const mainNav = navItems.filter((i) => !("requiresBookings" in i) || hasBookings);

  const orgInitials = organizerName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "CP";
  const userInitials = userName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  return (
    <ResponsiveAside width={232} className="dash-sidebar">

      {/* Logo */}
      <div style={{ padding: "20px 18px 16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: "rgba(163,230,53,0.12)",
            border: "1.5px solid rgba(163,230,53,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 18px rgba(163,230,53,0.15)",
          }}>
            🎾
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-space), sans-serif" }}>
              <span style={{ color: "#f8fafc" }}>Pádel</span>
              <span style={{ color: ACCENT }}>Pro</span>
            </div>
            <div style={{ fontSize: 9, color: "#334155", fontWeight: 600, letterSpacing: "0.04em", marginTop: 3 }}>
              PANEL ORGANIZADOR
            </div>
          </div>
        </Link>
      </div>

      {/* Organizer card / switcher */}
      <div style={{ padding: "0 14px 14px" }}>
        <ClubSwitcher
          organizerName={organizerName}
          organizerSlug={organizerSlug}
          orgInitials={orgInitials}
          activeOrganizerId={activeOrganizerId}
          organizers={organizers}
        />
      </div>

      {/* Búsqueda global — visible solo en móvil, donde el header la oculta */}
      <div className="dash-drawer-search" style={{ padding: "0 14px 12px" }}>
        <DashSearch fullWidth />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px" }}>
        <NavGroup label="Gestión" items={mainNav} pathname={pathname} />
        <div style={{ margin: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
        <NavGroup label="Sistema" items={secondaryItems} pathname={pathname} />
        {isSuperAdmin && (
          <>
            <div style={{ margin: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            <p style={navLabelStyle("#fb7185")}>Administración</p>
            <NavItem
              href="/admin"
              label="Panel Admin"
              icon={<ShieldAlert size={16} />}
              isActive={pathname.startsWith("/admin")}
              danger
            />
          </>
        )}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
          borderRadius: 10, background: "rgba(255,255,255,0.02)",
        }}>
          <Link href="/dashboard/perfil" title="Mi perfil" style={{ textDecoration: "none", display: "flex", flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#94a3b8",
              fontFamily: "var(--font-space), sans-serif",
            }}>
              {userInitials}
            </div>
          </Link>
          <Link href="/dashboard/perfil" style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName || "Admin"}
            </div>
            {userEmail && (
              <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
            )}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 5, borderRadius: 7, display: "flex", alignItems: "center", transition: "color .12s, background .12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fb7185"; e.currentTarget.style.background = "rgba(244,63,94,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "none"; }}
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </ResponsiveAside>
  );
}

function ClubSwitcher({
  organizerName, organizerSlug, orgInitials, activeOrganizerId, organizers,
}: {
  organizerName?: string;
  organizerSlug?: string;
  orgInitials: string;
  activeOrganizerId?: string;
  organizers: OrganizerOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const multi = organizers.length > 1;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectOrg(id: string) {
    setOpen(false);
    if (id === activeOrganizerId) return;
    startTransition(async () => {
      await setActiveOrganizer(id);
      router.refresh();
    });
  }

  const card = (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: "10px 12px", borderRadius: 12,
      background: "linear-gradient(135deg, rgba(163,230,53,0.08) 0%, rgba(255,255,255,0.02) 60%)",
      border: "1px solid rgba(163,230,53,0.15)",
      cursor: multi ? "pointer" : "default",
      opacity: isPending ? 0.6 : 1,
      textAlign: "left", fontFamily: "inherit",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: "rgba(163,230,53,0.15)",
        border: "1px solid rgba(163,230,53,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900, color: ACCENT,
        fontFamily: "var(--font-space), sans-serif",
      }}>
        {orgInitials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {organizerName ?? "Mi club"}
        </div>
        {organizerSlug && (
          <div style={{ fontSize: 10, color: "#475569" }}>/{organizerSlug}</div>
        )}
      </div>
      {multi && <ChevronsUpDown size={14} color="#475569" style={{ flexShrink: 0 }} />}
    </div>
  );

  if (!multi) return card;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        style={{ all: "unset", display: "block", width: "100%", boxSizing: "border-box" }}
      >
        {card}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#0b1424", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: 6, boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
        }}>
          <p style={{ padding: "6px 8px 4px", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155" }}>
            Cambiar de club
          </p>
          {organizers.map((o) => {
            const isActive = o.id === activeOrganizerId;
            return (
              <button
                key={o.id}
                onClick={() => selectOrg(o.id)}
                style={{
                  all: "unset", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  background: isActive ? "rgba(163,230,53,0.1)" : "transparent",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? ACCENT : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>/{o.slug}</div>
                </div>
                {isActive && <Check size={14} color={ACCENT} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function navLabelStyle(color = "#334155"): React.CSSProperties {
  return {
    padding: "0 12px", marginBottom: 8, fontSize: 10, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.1em", color,
  };
}

function NavGroup({ label, items, pathname }: {
  label: string;
  items: typeof navItems;
  pathname: string;
}) {
  return (
    <div>
      <p style={navLabelStyle()}>{label}</p>
      {items.map((item) => {
        const isActive = "exact" in item && item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <NavItem key={item.href} href={item.href} label={item.label} icon={<Icon size={16} />} isActive={isActive} />
        );
      })}
    </div>
  );
}

function NavItem({ href, label, icon, isActive, danger }: { href: string; label: string; icon: React.ReactNode; isActive: boolean; danger?: boolean }) {
  return (
    <Link
      href={href}
      className={`dnav${danger ? " danger" : ""}${isActive ? " active" : ""}`}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}
