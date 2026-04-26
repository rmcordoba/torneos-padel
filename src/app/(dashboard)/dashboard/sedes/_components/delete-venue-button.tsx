"use client";

import { useState, useTransition } from "react";
import { deleteVenue } from "@/modules/venues/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteVenueButton({ venueId, venueName }: { venueId: string; venueName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteVenue(venueId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 7,
          background: "transparent", border: "1px solid var(--border-default)",
          color: "var(--text-faint)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Eliminar sede "${venueName}"?`}
        description="Esta acción no se puede deshacer. Se eliminarán también todas las canchas asociadas."
        confirmLabel="Eliminar sede"
        onConfirm={handleConfirm}
      />
    </>
  );
}
