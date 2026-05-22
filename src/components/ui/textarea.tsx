import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-deca-navy">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full resize-y rounded-lg border border-deca-navy/15 bg-white px-4 py-3 text-deca-navy min-h-[120px]",
          "placeholder:text-deca-navy/40 transition-colors duration-200",
          "focus:border-deca-gold focus:outline-none focus:ring-2 focus:ring-deca-gold/20",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-deca-navy/50">{hint}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
