"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { translateText } from "@/lib/menuI18n"
import { useAppStore } from "@/store/appStore"

function Label({ className, children, ...props }: React.ComponentProps<"label">) {
  const locale = useAppStore((state) => state.locale)
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-[13px] leading-none font-semibold text-[var(--gf-brown-800)] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? translateText(locale, children) : children}
    </label>
  )
}

export { Label }
