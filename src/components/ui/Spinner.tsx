import React from "react";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "slate" | "current";
  label?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 22,
  lg: 32,
  xl: 44,
};

const colorMap = {
  primary: "text-[#0a4d8c]",
  white: "text-white",
  slate: "text-slate-400",
  current: "text-current",
};

export function Spinner({
  size = "md",
  color = "primary",
  label = "Memuat data...",
  className = "",
  ...props
}: SpinnerProps) {
  const pixelSize = sizeMap[size];
  const colorClass = colorMap[color];

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <Loader2
        size={pixelSize}
        className={`animate-spin ${colorClass}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
