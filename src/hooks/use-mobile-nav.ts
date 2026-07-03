"use client";

import { useState, useEffect } from "react";

type Listener = (open: boolean) => void;

let _open = false;
const _listeners = new Set<Listener>();

function _emit() {
  _listeners.forEach((l) => l(_open));
}

export function openMobileNav() {
  _open = true;
  _emit();
}

export function closeMobileNav() {
  _open = false;
  _emit();
}

export function useMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(_open);
    _listeners.add(setOpen);
    return () => { _listeners.delete(setOpen); };
  }, []);

  return open;
}
