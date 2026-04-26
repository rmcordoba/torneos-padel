"use client";

import { useTransition, useState } from "react";
import { recalculateRanking } from "@/modules/rankings/actions";
import { RefreshCw, Loader2 } from "lucide-react";

export function RecalculateButton({ tableId }: { tableId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await recalculateRanking(tableId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "6px 12px", borderRadius: 7,
          background: "transparent", border: "1px solid var(--border-default)",
          color: "var(--text-faint)", fontSize: 11, fontWeight: 600,
          cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        Recalcular
      </button>
      {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
    </div>
  );
}
