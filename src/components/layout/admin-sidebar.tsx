"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Shield, ArrowLeft, LogOut, CreditCard } from "lucide-react";
import { logout } from "@/modules/auth/actions";
import { ResponsiveAside } from "@/components/layout/responsive-aside";

const navItems = [
  { label: "Overview",       href: "/admin",                  icon: LayoutDashboard, exact: true },
  { label: "Organizadores",  href: "/admin/organizadores",    icon: Building2 },
  { label: "Suscripciones",  href: "/admin/suscripciones",    icon: CreditCard },
  { label: "Usuarios",       href: "/admin/usuarios",         icon: Users },
  { label: "Auditoría",      href: "/admin/auditoria",        icon: Shield },
];

interface AdminSidebarProps {
  userName?: string;
  userEmail?: string;
  hasDashboard?: boolean;
}

export function AdminSidebar({ userName, userEmail, hasDashboard }: AdminSidebarProps) {
  const pathname = usePathname();

  const userInitials = userName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "A";

  return (
    <ResponsiveAside
      width={220}
      style={{
        background: "rgba(8,14,30,0.92)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >

      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={16} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", lineHeight: 1.2 }}>
              PadelPro
            </div>
            <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <p style={{ padding: "0 12px", marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>
          Panel Admin
        </p>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                background: isActive ? "rgba(239,68,68,0.12)" : "transparent",
                border: `1px solid ${isActive ? "rgba(239,68,68,0.25)" : "transparent"}`,
                color: isActive ? "#ef4444" : "#64748b",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
                transition: "all 0.12s",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex" }}><Icon size={15} /></span>
              {item.label}
            </Link>
          );
        })}

        {hasDashboard && (
          <>
            <div style={{ margin: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            <Link
              href="/dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 12px", borderRadius: 8,
                color: "#475569", fontSize: 13,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={15} />
              Volver al dashboard
            </Link>
          </>
        )}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#ef4444",
            fontFamily: "var(--font-space), sans-serif",
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName || "Admin"}
            </div>
            {userEmail && (
              <div style={{ fontSize: 10, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </div>
            )}
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </ResponsiveAside>
  );
}
