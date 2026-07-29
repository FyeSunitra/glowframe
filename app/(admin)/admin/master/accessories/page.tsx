'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Pagination } from '@/components/common/Pagination'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { masterDataService } from '@/services/masterData'
import type { Accessory, MasterListResult } from '@/types/masterData'
import { cn } from '@/lib/utils'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

type AccForm = { name: string }

export default function AccessoriesPage() {
  const locale = useAppStore((state) => state.locale)
  const masterText = getPageText(locale, 'adminMasterData')
  const t = masterText.accessories
  const accSchema = z.object({ name: z.string().trim().min(1, t.required) })
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<Accessory | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Accessory | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data: accessoryResult, isLoading } = useQuery<MasterListResult<Accessory>>({
    queryKey: ['admin', 'master', 'accessories', page, limit],
    queryFn: async () =>
      unwrapApiResponse(await masterDataService.accessories.list({ page, limit })),
  })
  const accessories = accessoryResult?.items ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'master', 'accessories'] })

  const saveMutation = useMutation({
    mutationFn: (data: AccForm & { id?: number }) => {
      const { id, ...body } = data
      return id
        ? masterDataService.accessories.update(id, body).then(unwrapApiResponse)
        : masterDataService.accessories.create(body).then(unwrapApiResponse)
    },
    onSuccess: () => { invalidate(); showToast(t.saved) },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      masterDataService.accessories.update(id, { active }).then(unwrapApiResponse),
    onSuccess: (_, vars) => { invalidate(); showToast(vars.active ? t.activated : t.deactivated) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterDataService.accessories.delete(id).then(unwrapApiResponse),
    onSuccess: () => {
      if (accessories.length === 1 && page > 1) setPage((current) => current - 1)
      invalidate()
      showToast(t.deleted)
    },
  })

  const form = useForm<AccForm>({ resolver: zodResolver(accSchema) })

  const COLUMNS = [
    { key: 'name', header: t.name, render: (r: Accessory) => (
      <span className="font-semibold">{r.name}</span>
    )},
    { key: 'usedInListings', header: masterText.usedInListings, render: (r: Accessory) => r.usedInListings },
    { key: 'active', header: masterText.active, render: (r: Accessory) => (
      <button
        onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-semibold',
          r.active ? 'bg-gf-green text-white' : 'bg-gf-line text-gf-muted',
        )}
      >
        <span className="w-[8px] h-[8px] rounded-full bg-white inline-block" />
        {r.active ? masterText.on : masterText.off}
      </button>
    )},
    { key: 'actions', header: '', render: (r: Accessory) => (
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
            {masterText.edit}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}
          >
            {r.active ? masterText.deactivate : masterText.activate}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteTarget(r)}
            className={cn(r.usedInListings > 0 && 'pointer-events-none opacity-40')}
          >
            {masterText.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', masterText.breadcrumb, t.title]}
        title={t.title}
        action={
          <button
            onClick={() => { setEditTarget(null); form.reset({ name: '' }); setFormOpen(true) }}
            className="[border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold bg-transparent cursor-pointer"
          >
            {t.add}
          </button>
        }
      />

      <DataTable
        columns={COLUMNS}
        data={accessories}
        loading={isLoading}
        empty={
          <EmptyState
            icon={Package}
            heading={t.empty}
            sub={t.emptySub}
          />
        }
      />
      <Pagination
        page={page}
        limit={limit}
        total={accessoryResult?.meta.total ?? 0}
        totalPages={accessoryResult?.meta.totalPages ?? 1}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? t.editTitle : t.addTitle}
        submitLabel={editTarget ? masterText.saveChanges : t.addSubmit}
        onSubmit={form.handleSubmit(data => {
          saveMutation.mutate({ ...data, id: editTarget?.id })
          setFormOpen(false)
        })}
      >
        <form>
          <Label>{t.name}</Label>
          <Input
            {...form.register('name')}
            placeholder={t.placeholder}
            className="[margin-top:6px]"
          />
          {form.formState.errors.name && (
            <span className="text-[12px] text-gf-red [margin-top:4px] block">
              {form.formState.errors.name.message}
            </span>
          )}
        </form>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
