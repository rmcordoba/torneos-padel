"use client";

import { useState, useTransition } from "react";
import { deleteTournamentCategory } from "@/modules/tournaments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteCategoryButton({
  tournamentCategoryId,
  categoryName,
}: {
  tournamentCategoryId: string;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteTournamentCategory(tournamentCategoryId);
      if (result?.error) {
        toast({ type: "error", title: "No se pudo eliminar", description: result.error });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        title="Eliminar categoría"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 6,
          border: "1px solid rgba(248,113,113,0.3)",
          background: "transparent",
          color: "#f87171",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.5 : 1,
        }}
      >
        {pending ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Eliminar categoría "${categoryName}"?`}
        description="Se eliminarán también todas las inscripciones y el fixture de esta categoría. Esta acción no se puede deshacer."
        confirmLabel="Eliminar categoría"
        onConfirm={handleConfirm}
      />
    </>
  );
}
