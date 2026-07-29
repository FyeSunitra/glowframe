import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import {
  PolicyDocumentStatus,
  PrismaClient,
} from '../lib/generated/prisma/client'
import { policySeedDocuments } from '../prisma/policySeedData'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is required.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  const now = new Date()
  let created = 0
  let updated = 0
  let skipped = 0

  for (const document of policySeedDocuments) {
    const existing = await prisma.policyDocument.findUnique({
      where: {
        type_version: {
          type: document.type,
          version: document.version,
        },
      },
      select: {
        id: true,
        bodyTh: true,
      },
    })

    const data = {
      titleTh: document.titleTh,
      titleEn: document.titleEn,
      bodyTh: document.bodyTh,
      bodyEn: document.bodyEn,
      isRequired: true,
      forceReconsent: document.forceReconsent,
    }

    if (!existing) {
      await prisma.policyDocument.create({
        data: {
          type: document.type,
          version: document.version,
          ...data,
          status: PolicyDocumentStatus.current,
          effectiveAt: now,
          publishedAt: now,
        },
      })
      created += 1
      continue
    }

    if (existing.bodyTh !== document.legacyBodyTh) {
      skipped += 1
      continue
    }

    await prisma.policyDocument.update({
      where: { id: existing.id },
      data,
    })
    updated += 1
  }

  console.log(`Policy data completed: ${created} created, ${updated} updated, ${skipped} custom versions skipped.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
