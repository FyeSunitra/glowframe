'use client'

import { Label } from '@/components/ui/label'

interface FieldProps {
  label: string
  children: React.ReactNode
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
