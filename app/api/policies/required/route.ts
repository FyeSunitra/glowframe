import { NextRequest, NextResponse } from 'next/server'
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

const paymentTypes = [
  PolicyDocumentType.rentalAgreement,
  PolicyDocumentType.paymentPolicy,
]

const listingTypes = [PolicyDocumentType.listingPolicy]
const rentalTypes = [PolicyDocumentType.rentalAgreement]

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'th'
  const requestedContext = req.nextUrl.searchParams.get('context')
  const context = requestedContext === 'payment' || requestedContext === 'listing' || requestedContext === 'rental'
    ? requestedContext
    : 'signup'
  const documentTypes = context === 'payment'
    ? paymentTypes
    : context === 'listing'
      ? listingTypes
      : context === 'rental'
        ? rentalTypes
      : requiredSignupTypes
  const documents = await prisma.policyDocument.findMany({
    where: {
      type: { in: documentTypes },
      status: PolicyDocumentStatus.current,
      ...(context === 'signup' ? { isRequired: true } : {}),
    },
    orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      type: true,
      titleTh: true,
      titleEn: true,
      version: true,
      bodyTh: true,
      bodyEn: true,
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
      title: locale === 'en' ? document.titleEn : document.titleTh,
      version: document.version,
      body: locale === 'en' ? document.bodyEn : document.bodyTh,
      effectiveAt: document.effectiveAt?.toISOString() ?? null,
    })),
  })
}
