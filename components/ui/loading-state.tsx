"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export const LoadingState = ({
  size = "md",
  fullScreen = false,
  message,
  className,
}: LoadingStateProps) => {
  const content = (
    <div
      data-testid="loading-state"
      role="status"
      aria-live="polite"
      className={cn("text-muted-foreground", className)}
    >
      <Loader2 className={cn(sizeClasses[size], "animate-spin")} />
      <span className="sr-only">Loading</span>
    </div>
  );

  if (!fullScreen && !message) {
    return content;
  }

  const body = (
    <div className="flex flex-col items-center">
      {content}
      {message && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  );

  if (!fullScreen) {
    return body;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {body}
    </div>
  );
};
