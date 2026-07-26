import { NextResponse } from 'next/server'
import {
  PolicyDocumentStatus,
  PolicyDocumentType,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { RequiredPolicyType } from '@/types/policy'

const requiredSignupTypes = [
  PolicyDocumentType.termsOfService,
  PolicyDocumentType.privacyPolicy,
  PolicyDocumentType.rentalAgreement,
]

export async function GET() {
  const documents = await prisma.policyDocument.findMany({
    where: {
      type: { in: requiredSignupTypes },
      status: PolicyDocumentStatus.current,
      isRequired: true,
    },
    orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      type: true,
      title: true,
      version: true,
      body: true,
      effectiveAt: true,
    },
  })

  const latestByType = new Map<PolicyDocumentType, (typeof documents)[number]>()
  for (const document of documents) {
    if (!latestByType.has(document.type)) latestByType.set(document.type, document)
  }

  return NextResponse.json({
    data: [...latestByType.values()].map((document) => ({
      id: Number(document.id),
      type: document.type as RequiredPolicyType,
      title: document.title,
      version: document.version,
      body: document.body,
      effectiveAt: document.effectiveAt?.toISOString() ?? null,
    })),
  })
}
