'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { masterDataService } from '@/services/masterData'
import type { Brand } from '@/types/masterData'
import { cn } from '@/lib/utils'

const brandSchema = z.object({ name: z.string().min(1, 'Brand name is required') })
type BrandForm = z.infer<typeof brandSchema>

export default function BrandsPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<Brand | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ['admin', 'master', 'brands'],
    queryFn: async () => unwrapApiResponse(await masterDataService.brands.list()).items,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'master', 'brands'] })

  const saveMutation = useMutation({
    mutationFn: (data: BrandForm & { id?: number }) => {
      const { id, ...body } = data
      return id
        ? masterDataService.brands.update(id, body).then(unwrapApiResponse)
        : masterDataService.brands.create(body).then(unwrapApiResponse)
    },
    onSuccess: () => { invalidate(); showToast('Brand saved') },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      masterDataService.brands.update(id, { active }).then(unwrapApiResponse),
    onSuccess: (_, vars) => { invalidate(); showToast(vars.active ? 'Brand activated' : 'Brand deactivated') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterDataService.brands.delete(id).then(unwrapApiResponse),
    onSuccess: () => { invalidate(); showToast('Brand deleted') },
  })

  const form = useForm<BrandForm>({ resolver: zodResolver(brandSchema) })

  const COLUMNS = [
    { key: 'name', header: 'Brand name', render: (r: Brand) => (
      <span className="font-semibold">{r.name}</span>
    )},
    { key: 'activeListings', header: 'Active listings', render: (r: Brand) => r.activeListings },
    { key: 'active', header: 'Active', render: (r: Brand) => (
      <button
        onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-semibold',
          r.active ? 'bg-gf-green text-white' : 'bg-gf-line text-gf-muted',
        )}
      >
        <span className="w-[8px] h-[8px] rounded-full bg-white inline-block" />
        {r.active ? 'On' : 'Off'}
      </button>
    )},
    { key: 'actions', header: '', render: (r: Brand) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => {
            setEditTarget(r)
            form.reset({ name: r.name })
            setFormOpen(true)
          }}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
          >
            {r.active ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteTarget(r)}
            // Disabled when brand has listings — rendered but styled muted
            className={cn(r.activeListings > 0 && 'pointer-events-none opacity-40')}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Master Data', 'Camera Brands']}
        title="Camera Brands"
        action={
          <button
            onClick={() => { setEditTarget(null); form.reset({ name: '' }); setFormOpen(true) }}
            className="[border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold bg-transparent cursor-pointer"
          >
            + Add brand
          </button>
        }
      />

      <DataTable
        columns={COLUMNS}
        data={brands}
        loading={isLoading}
        empty={
          <EmptyState
            icon={Tag}
            heading="No brands yet"
            sub="Add at least one brand before owners can list cameras."
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? 'Edit Brand' : 'Add Brand'}
        submitLabel={editTarget ? 'Save changes' : 'Add brand'}
        onSubmit={form.handleSubmit(data => {
          saveMutation.mutate({ ...data, id: editTarget?.id })
          setFormOpen(false)
        })}
      >
        <form>
          <Label>Brand name</Label>
          <Input
            {...form.register('name')}
            placeholder="e.g. Canon"
            className="[margin-top:6px]"
          />
          {form.formState.errors.name && (
            <span className="text-[12px] text-gf-red [margin-top:4px] block">
              {form.formState.errors.name.message}
            </span>
          )}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This brand will be permanently removed. This cannot be undone."
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
