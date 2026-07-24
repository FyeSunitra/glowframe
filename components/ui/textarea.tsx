import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[14px] border-[1.5px] border-[var(--gf-brown-300)] bg-white px-3.5 py-3 text-sm text-[var(--gf-brown-900)] transition-colors outline-none placeholder:text-[var(--gf-brown-400)] focus-visible:border-[var(--gf-pink-400)] focus-visible:ring-2 focus-visible:ring-[var(--gf-pink-100)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
