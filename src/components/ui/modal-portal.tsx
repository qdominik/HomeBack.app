"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode } from "react";

type ModalPortalProps = {
  children: ReactNode;
};

const emptySubscribe = () => () => {};

export function ModalPortal({ children }: ModalPortalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  return mounted ? createPortal(children, document.body) : null;
}