"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-deca-navy/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full rounded-2xl bg-white shadow-2xl animate-slide-up",
          "max-h-[90vh] overflow-hidden flex flex-col",
          sizeClass
        )}
      >
        <div className="flex items-center justify-between border-b border-deca-navy/10 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-deca-navy">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-deca-navy/50 transition-colors hover:bg-deca-navy/5 hover:text-deca-navy"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
