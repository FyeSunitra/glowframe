import { NextRequest, NextResponse } from 'next/server'
import { PolicyDocumentStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const documentId = BigInt(id)
  const body = await req.json()

  const current = await prisma.policyDocument.findUnique({ where: { id: documentId } })

  if (!current) {
    return NextResponse.json({ error: 'Policy document not found' }, { status: 404 })
  }

  if (body.action === 'publish') {
    const now = new Date()

    await prisma.$transaction([
      prisma.policyDocument.updateMany({
        where: {
          type: current.type,
          status: PolicyDocumentStatus.current,
          id: { not: documentId },
        },
        data: { status: PolicyDocumentStatus.superseded },
      }),
      prisma.policyDocument.update({
        where: { id: documentId },
        data: {
          status: PolicyDocumentStatus.current,
          publishedAt: now,
          effectiveAt: current.effectiveAt ?? now,
          forceReconsent: body.forceReconsent ?? current.forceReconsent,
        },
      }),
    ])
  } else if (body.action === 'force-reconsent') {
    await prisma.policyDocument.update({
      where: { id: documentId },
      data: { forceReconsent: true },
    })
  } else if (body.action === 'archive') {
    await prisma.policyDocument.update({
      where: { id: documentId },
      data: { status: PolicyDocumentStatus.archived },
    })
  } else {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
