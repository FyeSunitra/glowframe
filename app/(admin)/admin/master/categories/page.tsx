'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers3, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { cn } from '@/lib/utils'
import { masterDataService } from '@/services/masterData'
import type { Category } from '@/types/masterData'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

type CategoryForm = { name: string }

export default function CategoriesPage() {
  const locale = useAppStore((state) => state.locale)
  const masterText = getPageText(locale, 'adminMasterData')
  const t = masterText.categories
  const categorySchema = z.object({
    name: z.string().trim().min(1, t.required),
  })
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin', 'master', 'categories'],
    queryFn: async () => unwrapApiResponse(await masterDataService.categories.list()).items,
  })

  const invalidate = () => queryClient.invalidateQueries({
    queryKey: ['admin', 'master', 'categories'],
  })

  const saveMutation = useMutation({
    mutationFn: (data: CategoryForm & { id?: number }) => {
      const { id, ...body } = data
      return id
        ? masterDataService.categories.update(id, body).then(unwrapApiResponse)
        : masterDataService.categories.create(body).then(unwrapApiResponse)
    },
    onSuccess: () => {
      invalidate()
      showToast(t.saved)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      masterDataService.categories.update(id, { active }).then(unwrapApiResponse),
    onSuccess: (_, variables) => {
      invalidate()
      showToast(variables.active ? t.activated : t.deactivated)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      masterDataService.categories.delete(id).then(unwrapApiResponse),
    onSuccess: () => {
      invalidate()
      showToast(t.deleted)
    },
  })

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  })

  const columns = [
    {
      key: 'name',
      header: t.name,
      render: (category: Category) => (
        <span className="font-semibold">{category.name}</span>
      ),
    },
    {
      key: 'activeListings',
      header: masterText.activeListings,
      render: (category: Category) => category.activeListings,
    },
    {
      key: 'active',
      header: masterText.active,
      render: (category: Category) => (
        <button
          onClick={() => toggleMutation.mutate({
            id: category.id,
            active: !category.active,
          })}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-semibold',
            category.active ? 'bg-gf-green text-white' : 'bg-gf-line text-gf-muted',
          )}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          {category.active ? masterText.on : masterText.off}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (category: Category) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-gf-brown-700"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditTarget(category)
                form.reset({ name: category.name })
                setFormOpen(true)
              }}
            >
              {masterText.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleMutation.mutate({
                id: category.id,
                active: !category.active,
              })}
            >
              {category.active ? masterText.deactivate : masterText.activate}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteTarget(category)}
              className={cn(
                category.activeListings > 0 && 'pointer-events-none opacity-40',
              )}
            >
              {masterText.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', masterText.breadcrumb, t.title]}
        title={t.title}
        action={
          <button
            onClick={() => {
              setEditTarget(null)
              form.reset({ name: '' })
              setFormOpen(true)
            }}
            className="cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-gf-brown-800"
          >
            {t.add}
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        loading={isLoading}
        empty={
          <EmptyState
            icon={Layers3}
            heading={t.empty}
            sub={t.emptySub}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? t.editTitle : t.addTitle}
        submitLabel={editTarget ? masterText.saveChanges : t.addSubmit}
        onSubmit={form.handleSubmit((data) => {
          saveMutation.mutate({ ...data, id: editTarget?.id })
          setFormOpen(false)
        })}
      >
        <form>
          <Label>{t.name}</Label>
          <Input
            {...form.register('name')}
            placeholder={t.placeholder}
            className="mt-1.5"
          />
          {form.formState.errors.name && (
            <span className="mt-1 block text-xs text-gf-red">
              {form.formState.errors.name.message}
            </span>
          )}
        </form>
      </FormDialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
