"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import { translateText } from "@/lib/menuI18n"
import { useAppStore } from "@/store/appStore"

function Input({ className, type, placeholder, ...props }: React.ComponentProps<"input">) {
  const locale = useAppStore((state) => state.locale)
  return (
    <InputPrimitive
      type={type}
      placeholder={typeof placeholder === "string" ? translateText(locale, placeholder) : placeholder}
      data-slot="input"
      className={cn(
        "h-[42px] w-full min-w-0 rounded-[14px] border-[1.5px] border-[var(--gf-brown-300)] !bg-white px-3.5 text-sm text-[var(--gf-brown-900)] transition-colors outline-none placeholder:text-[var(--gf-brown-400)] focus-visible:border-[var(--gf-pink-400)] focus-visible:ring-2 focus-visible:ring-[var(--gf-pink-100)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--gf-brown-900)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
