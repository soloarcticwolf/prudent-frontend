import { forwardRef, type ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";
  const styles =
    variant === "primary"
      ? "bg-forest text-white hover:bg-deepforest"
      : variant === "outline"
        ? "border border-line bg-surface text-ink hover:border-forest"
        : "text-forest hover:bg-subtle";
  return <button ref={ref} className={`${base} ${styles} ${className}`} {...rest} />;
});
