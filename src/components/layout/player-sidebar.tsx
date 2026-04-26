"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, ClipboardList, LogOut } from "lucide-react";
import { logout } from "@/modules/auth/actions";

const navItems = [
  { label: "Mi panel",  href: "/dashboard/jugador", icon: ClipboardList, exact: true },
  { label: "Mi Perfil", href: "/dashboard/perfil",  icon: UserCircle },
];

interface PlayerSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function PlayerSidebar({ userName, userEmail }: PlayerSidebarProps) {
  const pathname = usePathname();

  const userInitials = userName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "J";

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
              v1.0 · jugador
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <p style={{ padding: "0 12px", marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-darkest)" }}>
          Mi cuenta
        </p>
        {navItems.map((item) => {
          const isActive = "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <NavItem key={item.href} href={item.href} label={item.label} icon={<Icon size={15} />} isActive={isActive} />
          );
        })}
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
              {userName || "Jugador"}
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

function NavItem({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "9px 12px", borderRadius: 8, marginBottom: 2,
        background: isActive ? "var(--accent-15)" : "transparent",
        border: `1px solid ${isActive ? "var(--accent-30)" : "transparent"}`,
        color: isActive ? "var(--accent)" : "var(--text-faint)",
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        textDecoration: "none",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-muted)"; } }}
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
