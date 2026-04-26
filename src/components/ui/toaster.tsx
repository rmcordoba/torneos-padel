"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { X, CheckCircle2, XCircle, Info } from "lucide-react";
import { useToasts } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToasts();

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          open
          onOpenChange={(open) => { if (!open) dismiss(t.id); }}
          className={[
            "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl w-80",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-2",
            t.type === "success" ? "bg-slate-900 border-emerald-700/60 text-slate-100" : "",
            t.type === "error"   ? "bg-slate-900 border-red-700/60 text-slate-100"     : "",
            t.type === "info"    ? "bg-slate-900 border-slate-600 text-slate-100"       : "",
          ].join(" ")}
        >
          <span className="mt-0.5 shrink-0">
            {t.type === "success" && <CheckCircle2 size={15} className="text-emerald-400" />}
            {t.type === "error"   && <XCircle      size={15} className="text-red-400"     />}
            {t.type === "info"    && <Info         size={15} className="text-slate-400"   />}
          </span>
          <div className="flex-1 min-w-0">
            <RadixToast.Title className="text-sm font-semibold leading-tight">
              {t.title}
            </RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-xs mt-0.5 text-slate-400 leading-snug">
                {t.description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close
            onClick={() => dismiss(t.id)}
            className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  );
}
