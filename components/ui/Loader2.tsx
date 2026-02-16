// src/components/ui/loader.tsx
import { Loader2 as LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader2({ className }: { className?: string }) {
  return <LoaderIcon className={cn("h-5 w-5 animate-spin", className)} />;
}
