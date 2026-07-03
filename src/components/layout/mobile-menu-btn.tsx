"use client";

import { Menu } from "lucide-react";
import { openMobileNav } from "@/hooks/use-mobile-nav";

export function MobileMenuBtn() {
  return (
    <button
      type="button"
      aria-label="Abrir menú"
      className="dash-menu-btn"
      onClick={openMobileNav}
      style={{
        width: 36, height: 36, flexShrink: 0,
        alignItems: "center", justifyContent: "center",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        color: "#94a3b8", cursor: "pointer",
      }}
    >
      <Menu size={17} />
    </button>
  );
}
