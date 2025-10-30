"use client";

import { Toaster } from "sonner";

export default function CQGToast() {
  return (
    <Toaster
      richColors
      closeButton
      duration={3000}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-gradient-to-br from-[#0f0f10] to-[#1a1a1d] border border-[rgba(255,215,0,0.30)] text-white rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.20)] backdrop-blur-md px-4 py-3 text-sm",
          title: "font-medium tracking-wide",
          description: "text-[13px] opacity-90",
          closeButton: "text-white/80 hover:text-white",
          success:
            "[--toast-color:theme(colors.amber.400)] border-amber-300/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]",
          error:
            "[--toast-color:theme(colors.red.400)] border-red-400/40 shadow-[0_0_20px_rgba(248,113,113,0.25)]",
          warning:
            "[--toast-color:theme(colors.amber.400)] border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]",
          info:
            "[--toast-color:theme(colors.sky.300)] border-sky-300/40 shadow-[0_0_20px_rgba(125,211,252,0.20)]",
        },
      }}
      gap={10}
      visibleToasts={5}
      expand
      /** Move to bottom-center on small screens */
      offset={12}
    />
  );
}




