import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all duration-200 ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-primary/40 hover:shadow-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary/70 focus-visible:ring-primary/30 focus-visible:ring-[3px] focus-visible:shadow-md",
        "aria-invalid:border-destructive/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
