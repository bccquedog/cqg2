"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { toast } from "sonner";

type ToastContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  success: (message: string, opts?: { important?: boolean; actionLabel?: string; onAction?: () => void }) => void;
  error: (message: string, opts?: { important?: boolean; actionLabel?: string; onAction?: () => void }) => void;
  info: (message: string, opts?: { important?: boolean; actionLabel?: string; onAction?: () => void }) => void;
  warning: (message: string, opts?: { important?: boolean; actionLabel?: string; onAction?: () => void }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  const common = useCallback(
    (
      kind: "success" | "error" | "info" | "warning",
      message: string,
      opts?: { important?: boolean; actionLabel?: string; onAction?: () => void }
    ) => {
      if (!enabled) return;
      const duration = opts?.important ? Infinity : 4000;
      const action = opts?.actionLabel && opts?.onAction ? { label: opts.actionLabel, onClick: opts.onAction } : undefined;
      console.log(`[toast:${kind}]`, message);
      switch (kind) {
        case "success":
          toast.success(message, { duration, action });
          break;
        case "error":
          toast.error(message, { duration, action });
          break;
        case "warning":
          toast.warning(message, { duration, action });
          break;
        default:
          toast.info(message, { duration, action });
      }
    },
    [enabled]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      enabled,
      setEnabled,
      success: (m, o) => common("success", m, o),
      error: (m, o) => common("error", m, o),
      info: (m, o) => common("info", m, o),
      warning: (m, o) => common("warning", m, o),
    }),
    [enabled, common]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within <ToastProvider>");
  return ctx;
}




