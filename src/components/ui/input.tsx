import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-deca-navy dark:text-white/90"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-lg border border-deca-navy/15 bg-white px-4 py-2.5 text-deca-navy",
          "placeholder:text-deca-navy/40 transition-colors duration-200",
          "dark:border-white/15 dark:bg-deca-navy dark:text-white dark:placeholder:text-white/40",
          "focus:border-deca-gold focus:outline-none focus:ring-2 focus:ring-deca-gold/20",
          error && "border-red-400 focus:border-red-400 focus:ring-red-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
