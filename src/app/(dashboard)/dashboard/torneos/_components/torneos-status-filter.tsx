"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "",                    label: "Todos los estados"       },
  { value: "IN_PROGRESS",         label: "En curso"                },
  { value: "REGISTRATION_OPEN",   label: "Inscripciones abiertas"  },
  { value: "REGISTRATION_CLOSED", label: "Inscripciones cerradas"  },
  { value: "PUBLISHED",           label: "Publicado"               },
  { value: "DRAFT",               label: "Borrador"                },
  { value: "COMPLETED",           label: "Finalizado"              },
  { value: "CANCELLED",           label: "Cancelado"               },
];

export function TorneosStatusFilter({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div style={{ position: "relative" }}>
      <select
        value={current}
        onChange={(e) => {
          const val = e.target.value;
          router.push(val ? `/dashboard/torneos?status=${val}` : "/dashboard/torneos");
        }}
        style={{
          height: 40, paddingLeft: 14, paddingRight: 34,
          borderRadius: 100,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: current ? "#e2e8f0" : "#64748b",
          fontSize: 13, fontWeight: current ? 700 : 500,
          fontFamily: "inherit",
          outline: "none", cursor: "pointer",
          appearance: "none",
          colorScheme: "dark",
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 10, color: "#64748b", pointerEvents: "none",
        }}
      >
        ▾
      </span>
    </div>
  );
}
