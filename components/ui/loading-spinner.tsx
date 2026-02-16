"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  fullScreen?: boolean;
  variant?: "default" | "minimal" | "card";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LoadingSpinner({
  size = "md",
  text,
  className,
  fullScreen = false,
  variant = "default",
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {/* Outer ring */}
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-muted",
              sizeClasses[size]
            )}
            style={{
              borderTopColor: "transparent",
              borderRightColor: "transparent",
            }}
          />
          {/* Inner ring for extra visual appeal */}
          <div
            className={cn(
              "absolute inset-0 animate-spin rounded-full border border-primary/20",
              sizeClasses[size]
            )}
            style={{
              animationDirection: "reverse",
              animationDuration: "1.5s",
            }}
          />
        </div>
        {text && (
          <p
            className={cn(
              "text-muted-foreground font-medium animate-pulse",
              textSizeClasses[size]
            )}
          >
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card rounded-lg shadow-lg p-8 border">{spinner}</div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2
          className={cn("animate-spin text-primary", sizeClasses[size])}
        />
        {text && (
          <span
            className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="bg-card rounded-lg border p-8 shadow-sm">{spinner}</div>
    );
  }

  return spinner;
}

// Specialized loading components for common use cases
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function CardLoading({ text = "Loading..." }: { text?: string }) {
  return <LoadingSpinner variant="card" size="lg" text={text} />;
}

export function InlineLoading({ text }: { text?: string }) {
  return <LoadingSpinner variant="minimal" size="sm" text={text} />;
}

export function OverlayLoading({ text = "Loading..." }: { text?: string }) {
  return <LoadingSpinner fullScreen text={text} size="xl" />;
}

// Loading skeleton components
export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
          }}
        />
      ))}
    </div>
  );
}

export function TableLoadingSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-muted rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-lg border p-6 space-y-4", className)}>
      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
      </div>
      <div className="flex space-x-2">
        <div className="h-8 bg-muted rounded animate-pulse w-20" />
        <div className="h-8 bg-muted rounded animate-pulse w-24" />
      </div>
    </div>
  );
}
