import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "gold";

const variants: Record<BadgeVariant, string> = {
  default: "bg-deca-navy/10 text-deca-navy",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  gold: "bg-deca-gold/20 text-deca-gold-muted",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
