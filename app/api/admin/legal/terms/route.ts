import { NextRequest, NextResponse } from 'next/server'
import { PolicyDocumentStatus, PolicyDocumentType } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const policyTypeValues = Object.values(PolicyDocumentType)

interface PolicyDocumentRow {
  id: bigint
  version: string
  type: PolicyDocumentType
  title: string
  effectiveAt: Date | null
  publishedAt: Date | null
  summary: string | null
  body: string
  forceReconsent: boolean
  isRequired: boolean
  status: PolicyDocumentStatus
  _count: { acceptances: number }
}

function parseType(value: string | null): PolicyDocumentType | null {
  if (!value) return null
  return policyTypeValues.includes(value as PolicyDocumentType) ? value as PolicyDocumentType : null
}

function serializePolicy(document: PolicyDocumentRow, totalUsers: number) {
  const usersAccepted = document._count.acceptances

  return {
    id: Number(document.id),
    version: document.version,
    docType: document.type,
    title: document.title,
    effectiveDate: document.effectiveAt?.toISOString() ?? null,
    publishedAt: document.publishedAt?.toISOString() ?? null,
    summary: document.summary ?? '',
    body: document.body,
    usersAccepted,
    totalUsers,
    forceReconsent: document.forceReconsent,
    isRequired: document.isRequired,
    status: document.status,
  }
}

export async function GET(req: NextRequest) {
  const type = parseType(new URL(req.url).searchParams.get('type'))
  const totalUsers = await prisma.user.count()
  const documents = await prisma.policyDocument.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { acceptances: true } } },
  })

  return NextResponse.json({ data: documents.map((document) => serializePolicy(document, totalUsers)) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type = parseType(body.docType)

  if (!type) {
    return NextResponse.json({ error: 'Invalid policy document type' }, { status: 400 })
  }

  const document = await prisma.policyDocument.create({
    data: {
      type,
      title: body.title,
      version: body.version,
      summary: body.summary,
      body: body.body,
      isRequired: body.isRequired ?? true,
      forceReconsent: body.requireReconsent ?? false,
      effectiveAt: body.effectiveDate ? new Date(body.effectiveDate) : null,
      status: PolicyDocumentStatus.draft,
    },
    include: { _count: { select: { acceptances: true } } },
  })

  const totalUsers = await prisma.user.count()
  return NextResponse.json({ data: serializePolicy(document, totalUsers) }, { status: 201 })
}
