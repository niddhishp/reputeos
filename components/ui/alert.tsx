import * as React from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "destructive";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-red-500/30 text-red-700 bg-red-50"
          : "border-neutral-200 text-neutral-900 bg-white",
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm", className)} {...props} />;
}