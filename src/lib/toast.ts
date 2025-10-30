"use client";

import { toast } from "sonner";

export const showSuccess = (message: string) =>
  toast.success(message, {
    icon: "✅",
  });

export const showError = (message: string) =>
  toast.error(message, {
    icon: "⚠️",
  });

export const showInfo = (message: string) =>
  toast.info(message, {
    icon: "ℹ️",
  });

export const showWarning = (message: string) =>
  toast.warning(message, {
    icon: "⚠️",
  });




