import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-all duration-200 ease-out outline-none hover:border-primary/40 hover:shadow-sm focus-visible:border-primary/70 focus-visible:ring-primary/30 focus-visible:ring-[3px] focus-visible:shadow-md aria-invalid:border-destructive/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
