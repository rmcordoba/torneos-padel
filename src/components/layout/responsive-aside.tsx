"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMobileNav, closeMobileNav } from "@/hooks/use-mobile-nav";

/**
 * Shell responsive para las sidebars del dashboard.
 * En desktop es una columna sticky; en <1024px se convierte en un
 * drawer off-canvas controlado por el store de use-mobile-nav.
 */
export function ResponsiveAside({
  width,
  className = "",
  style,
  children,
}: {
  width: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const open = useMobileNav();
  const pathname = usePathname();

  useEffect(() => { closeMobileNav(); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileNav();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div
        className={`dash-overlay${open ? " open" : ""}`}
        onClick={closeMobileNav}
        aria-hidden
      />
      <aside
        className={`dash-aside${open ? " open" : ""}${className ? ` ${className}` : ""}`}
        style={{ width, ...style }}
      >
        {children}
      </aside>
    </>
  );
}
