"use client";

import { useState, useEffect, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type Listener = (toasts: Toast[]) => void;

let _toasts: Toast[] = [];
const _listeners = new Set<Listener>();
let _seq = 0;

function _emit() {
  _listeners.forEach((l) => l([..._toasts]));
}

export function toast(opts: Omit<Toast, "id"> & { duration?: number }) {
  const id = String(++_seq);
  const duration = opts.duration ?? 4000;
  _toasts = [..._toasts, { id, title: opts.title, description: opts.description, type: opts.type }];
  _emit();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    _emit();
  }, duration);
}

export function dismissToast(id: string) {
  _toasts = _toasts.filter((t) => t.id !== id);
  _emit();
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    setState([..._toasts]);
    _listeners.add(setState);
    return () => { _listeners.delete(setState); };
  }, []);

  const dismiss = useCallback((id: string) => dismissToast(id), []);
  return { toasts: state, dismiss };
}
