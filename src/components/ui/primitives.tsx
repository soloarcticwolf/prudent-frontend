import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(32,48,45,0.06)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <h3 className="font-serif text-lg text-ink">{title}</h3>
      {sub ? <p className="mt-1 text-sm text-secondary">{sub}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "good" }) {
  const map = {
    neutral: "bg-subtle text-ink",
    warn: "bg-[#F6E7DE] text-[#8A4A33]",
    good: "bg-[#E4EDE4] text-forest",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-subtle ${className}`} />;
}

export function Alert({ kind, children }: { kind: "error" | "warn" | "info"; children: ReactNode }) {
  const map = {
    error: "border-[#D9A08C] bg-[#FBF1EB] text-[#7A3B28]",
    warn: "border-[#D9C48C] bg-[#FBF6E9] text-[#6E5420]",
    info: "border-line bg-subtle text-ink",
  } as const;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${map[kind]}`}>
      {children}
    </div>
  );
}
