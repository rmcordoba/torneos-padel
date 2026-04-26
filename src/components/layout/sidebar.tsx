"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Trophy, Users, ClipboardList,
  Calendar, BarChart2, Settings,
  FileBarChart, Shield, Globe, LogOut, ShieldAlert,
} from "lucide-react";
import { logout } from "@/modules/auth/actions";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",               icon: LayoutDashboard, exact: true },
  { label: "Torneos",       href: "/dashboard/torneos",       icon: Trophy },
  { label: "Jugadores",     href: "/dashboard/jugadores",     icon: Users },
  { label: "Inscripciones", href: "/dashboard/inscripciones", icon: ClipboardList },
  { label: "Calendario",    href: "/dashboard/calendario",    icon: Calendar },
  { label: "Ranking",       href: "/dashboard/ranking",       icon: BarChart2 },
];

const secondaryItems = [
  { label: "Portal público", href: "/torneos",                 icon: Globe },
  { label: "Reportes",       href: "/dashboard/reportes",      icon: FileBarChart },
  { label: "Auditoría",      href: "/dashboard/auditoria",     icon: Shield },
  { label: "Configuración",  href: "/dashboard/configuracion", icon: Settings },
];

interface SidebarProps {
  organizerName?: string;
  organizerSlug?: string;
  userName?: string;
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export function Sidebar({ organizerName, organizerSlug, userName, userEmail, isSuperAdmin }: SidebarProps) {
  const pathname = usePathname();

  const orgInitials = organizerName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "CP";

  const userInitials = userName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "var(--accent-15)",
            border: "1px solid var(--accent-30)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PadelIcon />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.2 }}>
              PadelPro
            </div>
            <div style={{ fontSize: 10, color: "var(--text-dimmer)", fontWeight: 500 }}>
              v1.0 · organizador
            </div>
          </div>
        </div>
      </div>

      {/* Organizer card */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 9,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: "var(--accent-15)",
            border: "1px solid var(--accent-30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "var(--accent)",
            fontFamily: "Space Grotesk, sans-serif",
          }}>
            {orgInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {organizerName ?? "Mi club"}
            </div>
            {organizerSlug && (
              <div style={{ fontSize: 10, color: "var(--text-dimmer)" }}>/{organizerSlug}</div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <NavGroup label="Gestión" items={navItems} pathname={pathname} />
        <div style={{ margin: "10px 0", borderTop: "1px solid var(--border-subtle)" }} />
        <NavGroup label="Sistema" items={secondaryItems} pathname={pathname} />
        {isSuperAdmin && (
          <>
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--border-subtle)" }} />
            <p style={{ padding: "0 12px", marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ef4444", opacity: 0.7 }}>
              Administración
            </p>
            <NavItem
              href="/admin"
              label="Panel Admin"
              icon={<ShieldAlert size={15} />}
              isActive={pathname.startsWith("/admin")}
              accent
            />
          </>
        )}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
          <Link href="/dashboard/perfil" title="Mi perfil" style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              {userInitials}
            </div>
          </Link>
          <Link href="/dashboard/perfil" style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName || "Admin"}
            </div>
            {userEmail && (
              <div style={{ fontSize: 10, color: "var(--text-darkest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
            )}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              style={{ background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ label, items, pathname }: {
  label: string;
  items: typeof navItems;
  pathname: string;
}) {
  return (
    <div>
      <p style={{ padding: "0 12px", marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-darkest)" }}>
        {label}
      </p>
      {items.map((item) => {
        const isActive = "exact" in item && item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <NavItem key={item.href} href={item.href} label={item.label} icon={<Icon size={15} />} isActive={isActive} />
        );
      })}
    </div>
  );
}

function NavItem({ href, label, icon, isActive, accent }: { href: string; label: string; icon: React.ReactNode; isActive: boolean; accent?: boolean }) {
  const activeColor = accent ? "#ef4444" : "var(--accent)";
  const activeBg = accent ? "rgba(239,68,68,0.12)" : "var(--accent-15)";
  const activeBorder = accent ? "rgba(239,68,68,0.25)" : "var(--accent-30)";

  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "9px 12px", borderRadius: 8, marginBottom: 2,
        background: isActive ? activeBg : "transparent",
        border: `1px solid ${isActive ? activeBorder : "transparent"}`,
        color: isActive ? activeColor : "var(--text-faint)",
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        textDecoration: "none",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = accent ? "#ef4444" : "var(--text-muted)"; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-faint)"; } }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}

function PadelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.5" />
      <path d="M5 10 Q8 6 12 10 Q16 6 19 10" />
      <path d="M5 14 Q8 18 12 14 Q16 18 19 14" />
    </svg>
  );
}
