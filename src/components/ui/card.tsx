import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "purple";
}) {
  const variants = {
    default: "bg-gray-800 text-gray-300 border-gray-700",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    danger: "bg-red-950/60 text-red-400 border-red-800/60",
    purple: "bg-indigo-950/60 text-indigo-400 border-indigo-800/60",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-800 bg-gray-900/60 p-5 shadow-sm backdrop-blur transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
