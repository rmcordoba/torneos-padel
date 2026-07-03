"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTournamentStatus, deleteTournament } from "@/modules/tournaments/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Globe, ClipboardList, Lock, Swords, CheckCircle2,
  XCircle, Loader2, Trash2,
} from "lucide-react";
import type { TournamentStatus } from "@prisma/client";

interface Props {
  tournamentId: string;
  status: TournamentStatus;
}

const PRIMARY: Partial<Record<TournamentStatus, {
  to: TournamentStatus;
  label: string;
  icon: React.ReactNode;
}>> = {
  DRAFT:              { to: "PUBLISHED",           label: "Publicar torneo",        icon: <Globe className="h-4 w-4" /> },
  PUBLISHED:          { to: "REGISTRATION_OPEN",   label: "Abrir inscripciones",    icon: <ClipboardList className="h-4 w-4" /> },
  REGISTRATION_OPEN:  { to: "IN_PROGRESS",         label: "Iniciar torneo",         icon: <Swords className="h-4 w-4" /> },
  REGISTRATION_CLOSED:{ to: "IN_PROGRESS",         label: "Iniciar torneo",         icon: <Swords className="h-4 w-4" /> },
  IN_PROGRESS:        { to: "COMPLETED",           label: "Finalizar torneo",       icon: <CheckCircle2 className="h-4 w-4" /> },
};

const SECONDARY: Partial<Record<TournamentStatus, {
  to: TournamentStatus;
  label: string;
  icon: React.ReactNode;
}>> = {
  REGISTRATION_OPEN: { to: "REGISTRATION_CLOSED", label: "Cerrar inscripciones", icon: <Lock className="h-4 w-4" /> },
};

const CANCELABLE: TournamentStatus[] = ["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"];
const DELETABLE: TournamentStatus[] = ["DRAFT", "CANCELLED"];

export function StatusActions({ tournamentId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  const primary = PRIMARY[status];
  const secondary = SECONDARY[status];
  const canCancel = CANCELABLE.includes(status);
  const canDelete = DELETABLE.includes(status);

  function handleTransition(newStatus: TournamentStatus) {
    startTransition(async () => {
      const result = await updateTournamentStatus(tournamentId, newStatus);
      if (result.error) {
        toast({ type: "error", title: "Error", description: result.error });
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTournament(tournamentId);
      if (result?.error) {
        toast({ type: "error", title: "No se pudo eliminar", description: result.error });
      } else {
        router.push("/dashboard/torneos");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {primary && (
          <button
            onClick={() => handleTransition(primary.to)}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 rounded-lg disabled:opacity-60 px-4 py-2 text-xs font-extrabold transition-colors"
            style={{ background: "#a3e635", color: "#080e1a", boxShadow: "0 0 20px rgba(163,230,53,0.3)" }}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : primary.icon}
            {primary.label}
          </button>
        )}

        {secondary && (
          <button
            onClick={() => handleTransition(secondary.to)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            {secondary.icon}
            {secondary.label}
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => setCancelOpen(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-red-400/40 hover:bg-red-500/20 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancelar torneo
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-red-600/50 hover:bg-red-600/20 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Eliminar torneo
          </button>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="¿Cancelar este torneo?"
        description="Esta acción no se puede deshacer. El torneo quedará marcado como cancelado."
        confirmLabel="Cancelar torneo"
        variant="warning"
        onConfirm={() => handleTransition("CANCELLED")}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar este torneo?"
        description="Se eliminarán permanentemente todas las categorías, inscripciones y fixture. Esta acción no se puede deshacer."
        confirmLabel="Eliminar permanentemente"
        onConfirm={handleDelete}
      />
    </>
  );
}
