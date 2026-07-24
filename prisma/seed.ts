import { PrismaPg } from "@prisma/adapter-pg";

import {
  MediaType,
  PolicyDocumentStatus,
  PolicyDocumentType,
  PrismaClient,
  ProductStatus,
  UserRole,
} from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const banks = [
    { code: "PROMPTPAY", abbreviation: "PROMPTPAY", name: "พร้อมเพย์" },
    { code: "002", abbreviation: "BBL", name: "ธนาคารกรุงเทพ" },
    { code: "004", abbreviation: "KBANK", name: "ธนาคารกสิกรไทย" },
    { code: "006", abbreviation: "KTB", name: "ธนาคารกรุงไทย" },
    { code: "011", abbreviation: "TTB", name: "ธนาคารทหารไทยธนชาต" },
    { code: "014", abbreviation: "SCB", name: "ธนาคารไทยพาณิชย์" },
    { code: "025", abbreviation: "BAY", name: "ธนาคารกรุงศรีอยุธยา" },
    { code: "024", abbreviation: "UOB", name: "ธนาคารยูโอบี" },
    { code: "030", abbreviation: "GSB", name: "ธนาคารออมสิน" },
    { code: "034", abbreviation: "BAAC", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร" },
    { code: "033", abbreviation: "GHB", name: "ธนาคารอาคารสงเคราะห์" },
    { code: "073", abbreviation: "CIMBT", name: "ธนาคารซีไอเอ็มบีไทย" },
    { code: "070", abbreviation: "ICBCT", name: "ธนาคารไอซีบีซี (ไทย)" },
    { code: "069", abbreviation: "KKP", name: "ธนาคารเกียรตินาคินภัทร" },
    { code: "067", abbreviation: "TISCO", name: "ธนาคารทิสโก้" },
    { code: "098", abbreviation: "SME", name: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย" },
    { code: "035", abbreviation: "EXIM", name: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย" },
    { code: "066", abbreviation: "ISBT", name: "ธนาคารอิสลามแห่งประเทศไทย" },
  ];

  await Promise.all(
    banks.map((bank) =>
      prisma.bank.upsert({
        where: { code: bank.code },
        update: {
          abbreviation: bank.abbreviation,
          name: bank.name,
          logoUrl: null,
          isActive: true,
        },
        create: {
          ...bank,
          logoUrl: null,
          isActive: true,
        },
      }),
    ),
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@glowframe.test" },
    update: {
      role: UserRole.admin,
      status: "active",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "admin@glowframe.test",
      passwordHash: "prototype-admin-password-hash",
      displayName: "GlowFrame Admin",
      fullName: "GlowFrame Admin",
      role: UserRole.admin,
      emailVerifiedAt: new Date(),
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "owner@glowframe.test" },
    update: {
      status: "active",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "owner@glowframe.test",
      passwordHash: "prototype-user-password-hash",
      displayName: "MVP Camera Owner",
      fullName: "MVP Camera Owner",
      phone: "0800000000",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const categories = await Promise.all(
    ["Mirrorless", "DSLR", "Lens"].map((name) =>
      prisma.cameraCategory.upsert({
        where: { name },
        update: { isActive: true },
        create: { name },
      }),
    ),
  );

  const brands = await Promise.all(
    ["Canon", "Sony", "Nikon"].map((name) =>
      prisma.brand.upsert({
        where: { name },
        update: { isActive: true },
        create: { name },
      }),
    ),
  );

  const accessories = await Promise.all(
    ["Battery", "Charger", "Memory Card", "Camera Bag"].map((name) =>
      prisma.accessory.upsert({
        where: { name },
        update: { isActive: true },
        create: { name },
      }),
    ),
  );

  const address =
    (await prisma.userAddress.findFirst({
      where: { userId: user.id, label: "Default pickup" },
    })) ??
    (await prisma.userAddress.create({
      data: {
        userId: user.id,
        label: "Default pickup",
        recipientName: "MVP Camera Owner",
        recipientPhone: "0800000000",
        addressLine: "GlowFrame University Demo Address",
        province: "Bangkok",
        district: "Pathum Wan",
        subdistrict: "Wang Mai",
        postalCode: "10330",
        isDefault: true,
      },
    }));

  const product =
    (await prisma.product.findFirst({
      where: {
        ownerId: user.id,
        title: "Sony A7 III Demo Kit",
      },
    })) ??
    (await prisma.product.create({
      data: {
        ownerId: user.id,
        categoryId: categories[0].id,
        brandId: brands[1].id,
        pickupAddressId: address.id,
        title: "Sony A7 III Demo Kit",
        model: "A7 III",
        serialNumber: "MVP-SNY-A73-001",
        description: "Approved demo camera for the GlowFrame MVP catalog.",
        conditionNote: "Good condition with normal signs of use.",
        extraDetails: "Includes basic accessories for a rental demo.",
        pricePerDay: "1200.00",
        depositAmount: "5000.00",
        allowPickup: true,
        allowMessenger: true,
        allowShipping: false,
        status: ProductStatus.approved,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    }));

  await prisma.product.update({
    where: { id: product.id },
    data: {
      status: ProductStatus.approved,
      approvedBy: admin.id,
      approvedAt: product.approvedAt ?? new Date(),
    },
  });

  const mediaExists = await prisma.productMedia.findFirst({
    where: { productId: product.id, url: "/images/placeholder-camera.jpg" },
  });

  if (!mediaExists) {
    await prisma.productMedia.create({
      data: {
        productId: product.id,
        mediaType: MediaType.image,
        url: "/images/placeholder-camera.jpg",
        publicId: "glowframe/demo/sony-a7iii-placeholder",
        sortOrder: 0,
      },
    });
  } else if (!mediaExists.publicId) {
    await prisma.productMedia.update({
      where: { id: mediaExists.id },
      data: { publicId: "glowframe/demo/sony-a7iii-placeholder" },
    });
  }

  await Promise.all(
    accessories.slice(0, 3).map((accessory) =>
      prisma.productAccessory.upsert({
        where: {
          productId_accessoryId: {
            productId: product.id,
            accessoryId: accessory.id,
          },
        },
        update: { quantity: 1 },
        create: {
          productId: product.id,
          accessoryId: accessory.id,
          quantity: 1,
        },
      }),
    ),
  );

  const now = new Date();
  const policyDocuments = [
    {
      type: PolicyDocumentType.termsOfService,
      title: "Terms of Service",
      version: "v1.0",
      summary: "Initial platform terms for account usage, bookings, payments, and admin decisions.",
      body: "GlowFrame Terms of Service demo content for the MVP.",
      forceReconsent: true,
    },
    {
      type: PolicyDocumentType.privacyPolicy,
      title: "Privacy Policy",
      version: "v1.0",
      summary: "Initial privacy policy covering account, rental, payment, and verification data.",
      body: "GlowFrame Privacy Policy demo content for the MVP.",
      forceReconsent: true,
    },
    {
      type: PolicyDocumentType.rentalAgreement,
      title: "Rental Agreement",
      version: "v1.0",
      summary: "Rules for booking, handover, active rental, returns, late fees, and damage review.",
      body: "GlowFrame Rental Agreement demo content for the MVP.",
      forceReconsent: false,
    },
    {
      type: PolicyDocumentType.listingPolicy,
      title: "Listing Policy",
      version: "v1.0",
      summary: "Rules for owners listing approved camera equipment on GlowFrame.",
      body: "GlowFrame Listing Policy demo content for the MVP.",
      forceReconsent: false,
    },
    {
      type: PolicyDocumentType.paymentPolicy,
      title: "Payment Policy",
      version: "v1.0",
      summary: "Payment proof review, platform-held funds, refunds, payouts, and withdrawal rules.",
      body: "GlowFrame Payment Policy demo content for the MVP.",
      forceReconsent: false,
    },
    {
      type: PolicyDocumentType.identityVerificationConsent,
      title: "Identity Verification Consent",
      version: "v1.0",
      summary: "Consent terms for identity document review and private storage handling.",
      body: "GlowFrame Identity Verification Consent demo content for the MVP.",
      forceReconsent: true,
    },
  ];

  for (const document of policyDocuments) {
    await prisma.policyDocument.upsert({
      where: {
        type_version: {
          type: document.type,
          version: document.version,
        },
      },
      update: {
        title: document.title,
        summary: document.summary,
        body: document.body,
        isRequired: true,
        status: PolicyDocumentStatus.current,
        forceReconsent: document.forceReconsent,
        effectiveAt: now,
        publishedAt: now,
      },
      create: {
        ...document,
        isRequired: true,
        status: PolicyDocumentStatus.current,
        effectiveAt: now,
        publishedAt: now,
      },
    });
  }

  console.log("Seed completed: banks, admin, sample user, master data, one approved product, and policy documents.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
