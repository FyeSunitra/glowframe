import { PrismaPg } from "@prisma/adapter-pg";

import {
  MediaType,
  PolicyDocumentStatus,
  PrismaClient,
  ProductStatus,
  UserRole,
} from "../lib/generated/prisma/client";
import { policySeedDocuments } from "./policySeedData";

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

  const platformBank = await prisma.bank.findUnique({
    where: { code: "004" },
  });

  const platformSetting = await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      platformBankId: platformBank?.id,
      supportedBanks: banks.map((bank) => bank.name).join(", "),
    },
  });

  if (platformBank) {
    const existingPaymentAccount = await prisma.platformPaymentAccount.findFirst({
      where: {
        settingId: platformSetting.id,
        bankId: platformBank.id,
        accountNumber: platformSetting.platformAccountNo,
      },
    });

    if (!existingPaymentAccount) {
      await prisma.platformPaymentAccount.create({
        data: {
          settingId: platformSetting.id,
          bankId: platformBank.id,
          accountName: platformSetting.platformAccountName,
          accountNumber: platformSetting.platformAccountNo,
          isActive: true,
          sortOrder: 0,
        },
      });
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@glowframe.test" },
    update: {
      role: UserRole.admin,
      status: "active",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "admin@glowframe.test",
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
  const policyDocuments = policySeedDocuments;

  for (const document of policyDocuments) {
    const policyData = {
      type: document.type,
      titleTh: document.titleTh,
      titleEn: document.titleEn,
      version: document.version,
      bodyTh: document.bodyTh,
      bodyEn: document.bodyEn,
      forceReconsent: document.forceReconsent,
    };
    await prisma.policyDocument.upsert({
      where: {
        type_version: {
          type: document.type,
          version: document.version,
        },
      },
      update: {
        titleTh: document.titleTh,
        titleEn: document.titleEn,
        bodyTh: document.bodyTh,
        bodyEn: document.bodyEn,
        isRequired: true,
        status: PolicyDocumentStatus.current,
        forceReconsent: document.forceReconsent,
        effectiveAt: now,
        publishedAt: now,
      },
      create: {
        ...policyData,
        isRequired: true,
        status: PolicyDocumentStatus.current,
        effectiveAt: now,
        publishedAt: now,
      },
    });
  }

  const emailTemplates = [
    {
      key: "booking_status_update",
      nameTh: "แจ้งเตือนสถานะรายการเช่า",
      nameEn: "Rental status update",
      subjectTh: "อัปเดตสถานะรายการเช่า {{booking_ref}}",
      subjectEn: "Rental status update for {{booking_ref}}",
      bodyTh: "<p>สวัสดี {{user_name}}</p><p>รายการเช่า <strong>{{booking_ref}}</strong> สำหรับ <strong>{{product_name}}</strong> มีการอัปเดตสถานะ</p><p>รายละเอียดเพิ่มเติมอยู่ในระบบ GlowFrame</p>",
      bodyEn: "<p>Hello {{user_name}},</p><p>The rental <strong>{{booking_ref}}</strong> for <strong>{{product_name}}</strong> has been updated.</p><p>Please sign in to GlowFrame for more details.</p>",
      recipientRoles: ["renter", "owner", "admin"],
    },
    {
      key: "return_reminder",
      nameTh: "แจ้งเตือนกำหนดคืนสินค้า",
      nameEn: "Rental return reminder",
      subjectTh: "รายการ {{booking_ref}} ครบกำหนดคืนพรุ่งนี้",
      subjectEn: "Rental {{booking_ref}} is due tomorrow",
      bodyTh: "<p>สวัสดี {{user_name}}</p><p>สินค้า <strong>{{product_name}}</strong> ในรายการ <strong>{{booking_ref}}</strong> มีกำหนดคืนในวันพรุ่งนี้</p><p>กรุณาดำเนินการคืนสินค้าผ่าน GlowFrame ภายในเวลาที่กำหนด</p>",
      bodyEn: "<p>Hello {{user_name}},</p><p>Your rental item <strong>{{product_name}}</strong> for booking <strong>{{booking_ref}}</strong> is due tomorrow.</p><p>Please submit the return through GlowFrame by the required time.</p>",
      recipientRoles: ["renter"],
    },
    {
      key: "account_security_update",
      nameTh: "แจ้งเตือนผลการตรวจสอบบัญชีและความปลอดภัย",
      nameEn: "Account and security review update",
      subjectTh: "{{verification_type}}{{verification_status}}",
      subjectEn: "{{verification_type}} {{verification_status}}",
      bodyTh: "<p>สวัสดี {{user_name}}</p><p>{{verification_type}}ของคุณมีผลเป็น: <strong>{{verification_status}}</strong></p><p>เหตุผลหรือรายละเอียดเพิ่มเติม: {{rejection_reason}}</p><p>กรุณาเข้าสู่ GlowFrame เพื่อตรวจสอบรายละเอียด</p>",
      bodyEn: "<p>Hello {{user_name}},</p><p>Your <strong>{{verification_type}}</strong> review status is: <strong>{{verification_status}}</strong>.</p><p>Reason or additional details: {{rejection_reason}}</p><p>Please sign in to GlowFrame for more details.</p>",
      recipientRoles: ["renter", "owner"],
    },
  ] as const;

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        ...template,
        recipientRoles: [...template.recipientRoles],
        isEnabled: true,
      },
    });
  }

  console.log("Seed completed: banks, admin, sample user, master data, one approved product, policy documents, and email templates.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
