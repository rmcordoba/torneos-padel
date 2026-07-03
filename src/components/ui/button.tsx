import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/* ─── Dark-theme button matching design reference ────────────────────────── */

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(163,230,53,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d1a] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANTS: Record<string, string> = {
  default:     "bg-[#a3e635] text-[#0a0f0a] hover:bg-[#bef264] active:scale-[0.98]",
  destructive: "bg-[rgba(248,113,113,0.15)] text-[#f87171] border border-[rgba(248,113,113,0.30)] hover:bg-[rgba(248,113,113,0.22)] active:scale-[0.98]",
  outline:     "border border-[oklch(30%_0.01_250)] bg-transparent text-[#94a3b8] hover:bg-[oklch(22%_0.012_250)] hover:text-[#e2e8f0] active:scale-[0.98]",
  secondary:   "bg-[oklch(22%_0.012_250)] text-[#e2e8f0] border border-[oklch(28%_0.01_250)] hover:bg-[oklch(26%_0.012_250)] active:scale-[0.98]",
  ghost:       "bg-transparent text-[#94a3b8] border border-[oklch(28%_0.01_250)] hover:bg-[oklch(22%_0.012_250)] hover:text-[#e2e8f0] active:scale-[0.98]",
  link:        "text-[#a3e635] underline-offset-4 hover:underline",
  success:     "bg-[rgba(163,230,53,0.15)] text-[#a3e635] border border-[rgba(163,230,53,0.30)] hover:bg-[rgba(163,230,53,0.22)] active:scale-[0.98]",
  sport:       "bg-[#a3e635] text-[#0a0f0a] hover:bg-[#bef264] active:scale-[0.98]",
};

const SIZES: Record<string, string> = {
  default: "h-9 px-4 py-2",
  sm:      "h-8 px-3 text-xs rounded-md",
  lg:      "h-11 px-8 text-base",
  icon:    "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(BASE, VARIANTS[variant] ?? VARIANTS.default, SIZES[size] ?? SIZES.default, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export const buttonVariants = ({ variant = "default", size = "default" }: { variant?: string; size?: string } = {}) =>
  cn(BASE, VARIANTS[variant] ?? VARIANTS.default, SIZES[size] ?? SIZES.default);
