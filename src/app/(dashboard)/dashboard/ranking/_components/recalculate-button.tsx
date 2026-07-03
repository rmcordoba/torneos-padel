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
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 9,
          background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.25)",
          color: "#a3e635", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
          cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Recalcular
      </button>
      {error && <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>}
    </div>
  );
}
