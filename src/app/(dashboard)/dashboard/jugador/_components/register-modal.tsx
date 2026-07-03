"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registerForTournamentCategory, type RegistrationState } from "@/modules/player/actions";
import { toast } from "@/hooks/use-toast";
import { X, Loader2 } from "lucide-react";

interface Props {
  categoryId: string;
  categoryName: string;
  tournamentName: string;
  spotsLeft: number;
  onClose: () => void;
}

export function RegisterModal({ categoryId, categoryName, tournamentName, spotsLeft, onClose }: Props) {
  const [state, action, isPending] = useActionState<RegistrationState, FormData>(
    registerForTournamentCategory,
    null,
  );
  const submitted = useRef(false);

  useEffect(() => {
    if (state?.success && !submitted.current) {
      submitted.current = true;
      toast({ type: "success", title: "¡Inscripción enviada!", description: "Tu inscripción está pendiente de aprobación." });
      onClose();
    }
  }, [state, onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 440,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
              Inscribirse
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-dimmer)" }}>
              {tournamentName} · {categoryName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.2)", fontSize: 12, color: "var(--accent)" }}>
          {spotsLeft} lugar{spotsLeft !== 1 ? "es" : ""} disponible{spotsLeft !== 1 ? "s" : ""}
        </div>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="tournamentCategoryId" value={categoryId} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              Email del/la compañero/a (opcional)
            </label>
            <input
              name="partnerEmail"
              type="email"
              placeholder="compañero@email.com"
              disabled={isPending}
              style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 13,
                background: "oklch(20% 0.012 250)",
                border: "1px solid oklch(30% 0.01 250)",
                color: "var(--text-primary)",
                outline: "none",
                width: "100%", boxSizing: "border-box",
              }}
            />
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)" }}>
              Si jugás solo/a, dejá este campo vacío.
            </p>
          </div>

          {state?.error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, color: "#f87171" }}>
              {state.error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "transparent", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: "var(--accent)", color: "#000", border: "none",
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {isPending ? "Enviando…" : "Confirmar inscripción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
