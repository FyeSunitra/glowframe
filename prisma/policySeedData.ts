import { PolicyDocumentType } from '../lib/generated/prisma/client'

export const policySeedDocuments = [
  {
    type: PolicyDocumentType.termsOfService,
    titleTh: 'ข้อกำหนดการให้บริการ',
    titleEn: 'Terms of Service',
    version: 'v1.0',
    forceReconsent: true,
    legacyBodyTh:
      'ข้อกำหนดนี้ครอบคลุมการสมัครและใช้งานบัญชี การจอง การชำระเงิน หน้าที่ของผู้ใช้ และสิทธิของ GlowFrame ในการดูแลความปลอดภัยของแพลตฟอร์ม ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและไม่ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย',
    bodyTh: `1. การยอมรับข้อกำหนด
เมื่อสมัครสมาชิกหรือใช้ GlowFrame ผู้ใช้ตกลงปฏิบัติตามข้อกำหนดฉบับนี้ นโยบายความเป็นส่วนตัว และนโยบายที่เกี่ยวข้อง ผู้ใช้ต้องมีความสามารถตามกฎหมายในการทำรายการและให้ข้อมูลที่ถูกต้อง

2. บัญชีผู้ใช้
ผู้ใช้หนึ่งคนควรใช้บัญชีของตนเอง เก็บรักษารหัสผ่าน และรับผิดชอบกิจกรรมภายใต้บัญชี ห้ามแอบอ้างบุคคลอื่น ใช้ข้อมูลเท็จ หรือโอนบัญชีให้ผู้อื่น หากพบการใช้งานผิดปกติควรแจ้ง GlowFrame ทันที

3. บทบาทของ GlowFrame
GlowFrame เป็นแพลตฟอร์มที่ช่วยให้เจ้าของลงสินค้ากล้องและให้ผู้เช่าค้นหา จอง ส่งหลักฐานการชำระเงิน และติดตามรายการ แพลตฟอร์มอาจตรวจสอบข้อมูล อนุมัติหรือซ่อนรายการ และระงับบัญชีเพื่อดูแลความปลอดภัย

4. การจองและการทำรายการ
ผู้เช่าต้องยืนยันอีเมลก่อนส่งคำขอเช่า ต้องจองล่วงหน้าอย่างน้อย 5 วัน และไม่สามารถจองช่วงวันที่ซ้อนกับรายการอื่นที่ยังมีผล การจองจะดำเนินต่อเมื่อส่งหลักฐานการชำระเงินและได้รับการอนุมัติจากผู้ดูแลระบบ

5. การใช้งานที่ห้าม
ห้ามใช้แพลตฟอร์มเพื่อฉ้อโกง ละเมิดสิทธิผู้อื่น ลงข้อมูลที่ผิดกฎหมาย รบกวนระบบ เข้าถึงข้อมูลโดยไม่ได้รับอนุญาต หรือหลีกเลี่ยงขั้นตอนการชำระเงินและความปลอดภัยของ GlowFrame

6. การระงับบริการ
GlowFrame อาจปฏิเสธรายการ ซ่อนสินค้า จำกัดการใช้งาน หรือระงับบัญชีเมื่อมีเหตุอันควรเชื่อว่ามีการละเมิดข้อกำหนด ความเสี่ยงต่อผู้ใช้ หรือข้อมูลที่ไม่ถูกต้อง โดยผู้ดูแลระบบจะพิจารณาตามข้อมูลที่มีในระบบ

7. การเปลี่ยนแปลงข้อกำหนด
เมื่อมีการแก้ไขสาระสำคัญ GlowFrame จะเผยแพร่เวอร์ชันใหม่และอาจกำหนดให้ผู้ใช้ยอมรับอีกครั้งก่อนดำเนินการสำคัญ การใช้บริการต่อหลังวันที่มีผลถือเป็นการยอมรับเวอร์ชันปัจจุบัน`,
    bodyEn: `1. Acceptance of Terms
By registering for or using GlowFrame, users agree to these Terms, the Privacy Policy, and applicable platform policies. Users must have legal capacity to transact and must provide accurate information.

2. User Accounts
Each user should use their own account, protect their password, and remain responsible for activity under that account. Impersonation, false information, and account transfers are prohibited. Suspected unauthorized use should be reported to GlowFrame promptly.

3. GlowFrame's Role
GlowFrame is a platform where owners list camera equipment and renters browse, book, submit payment evidence, and track rentals. The platform may review information, approve or hide listings, and restrict accounts to protect users and platform safety.

4. Bookings and Transactions
Renters must verify their email before requesting a rental. A booking must be made at least 5 days in advance and cannot overlap another effective booking. A booking proceeds only after payment evidence is submitted and approved by an administrator.

5. Prohibited Use
Users must not use the platform for fraud, infringement, unlawful content, service disruption, unauthorized data access, or attempts to bypass GlowFrame's payment and safety processes.

6. Service Restrictions
GlowFrame may reject transactions, hide listings, restrict access, or suspend an account when there is reasonable concern about a policy violation, user risk, or inaccurate information. Administrators make decisions based on information available in the system.

7. Changes to These Terms
When material terms change, GlowFrame will publish a new version and may require users to accept it before their next important action. Continued use after the effective date constitutes acceptance of the current version.`,
  },
  {
    type: PolicyDocumentType.privacyPolicy,
    titleTh: 'นโยบายความเป็นส่วนตัว',
    titleEn: 'Privacy Policy',
    version: 'v1.0',
    forceReconsent: true,
    legacyBodyTh:
      'GlowFrame จัดเก็บข้อมูลบัญชี การจอง การชำระเงิน และการยืนยันตัวตนเท่าที่จำเป็นต่อการให้บริการ โดยจำกัดการเข้าถึงข้อมูลส่วนบุคคลและเอกสารสำคัญตามวัตถุประสงค์และระยะเวลาที่เหมาะสม',
    bodyTh: `1. ข้อมูลที่ GlowFrame เก็บ
GlowFrame อาจเก็บอีเมล ชื่อ เบอร์โทรศัพท์ ที่อยู่จัดส่ง ข้อมูลบัญชีธนาคาร ข้อมูลสินค้า การจอง การติดต่อ หลักฐานการชำระเงิน เอกสารยืนยันตัวตน และข้อมูลทางเทคนิคที่จำเป็นต่อการทำงานของระบบ

2. วัตถุประสงค์
ข้อมูลถูกใช้เพื่อสร้างและดูแลบัญชี ยืนยันอีเมลและตัวตน จัดการสินค้าและการจอง ตรวจหลักฐานการชำระเงิน ติดต่อผู้ใช้ ป้องกันการทุจริต ดำเนินการตามคำขอของผู้ใช้ และปรับปรุงบริการ

3. การจัดเก็บไฟล์
รูปและวิดีโอสินค้าหรือหลักฐานทั่วไปอาจจัดเก็บผ่าน Cloudinary โดยฐานข้อมูลเก็บ URL และ Public ID เท่านั้น เอกสารยืนยันตัวตนและหลักฐานการชำระเงินจะไม่เก็บใน Cloudinary แต่ใช้พื้นที่จัดเก็บแบบ Private Storage และฐานข้อมูลเก็บเฉพาะ path หรือ metadata ที่จำเป็น

4. การเข้าถึงและเปิดเผย
ข้อมูลจะเข้าถึงโดยผู้ใช้ที่เกี่ยวข้อง ผู้ดูแลระบบที่มีหน้าที่ และผู้ให้บริการระบบเท่าที่จำเป็น GlowFrame ไม่ขายข้อมูลส่วนบุคคล และจะเปิดเผยข้อมูลเมื่อได้รับความยินยอม มีความจำเป็นต่อบริการ หรือมีกฎหมายกำหนด

5. ระยะเวลาจัดเก็บ
ข้อมูลจะเก็บเท่าที่จำเป็นต่อบัญชี รายการเช่า การตรวจสอบ และข้อกำหนดทางกฎหมาย เมื่อหมดความจำเป็น GlowFrame จะลบ ทำลาย หรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ตามความเหมาะสม

6. สิทธิของผู้ใช้
ผู้ใช้อาจขอเข้าถึง แก้ไข ลบ จำกัดหรือคัดค้านการใช้ข้อมูล ขอรับสำเนาข้อมูล หรือถอนความยินยอมในกรณีที่อาศัยความยินยอม ทั้งนี้บางคำขออาจถูกจำกัดเมื่อจำเป็นต่อสัญญา ความปลอดภัย หรือหน้าที่ตามกฎหมาย

7. ความปลอดภัยและการติดต่อ
GlowFrame ใช้การจำกัดสิทธิ การแยกพื้นที่จัดเก็บไฟล์ลับ และมาตรการที่เหมาะสมกับ Prototype MVP หากมีคำถามหรือประสงค์ใช้สิทธิ ผู้ใช้สามารถติดต่อผู้ดูแลระบบผ่านช่องทางที่ GlowFrame ประกาศ`,
    bodyEn: `1. Information GlowFrame Collects
GlowFrame may collect email addresses, names, phone numbers, delivery addresses, bank-account information, listing and booking data, communications, payment evidence, identity documents, and technical information needed to operate the service.

2. Purposes of Processing
Information is used to create and maintain accounts, verify email and identity, manage listings and bookings, review payment evidence, communicate with users, prevent fraud, fulfill user requests, and improve the service.

3. File Storage
Product images, videos, and general evidence may be stored through Cloudinary, while the database stores only URLs and public IDs. Identity documents and payment evidence are not stored in Cloudinary. They use Private Storage, with only required paths or metadata stored in the database.

4. Access and Disclosure
Information is accessible only to relevant users, authorized administrators, and service providers as needed. GlowFrame does not sell personal data. Information may be disclosed with consent, where necessary to provide the service, or where required by law.

5. Retention
Information is retained only as long as needed for accounts, rentals, reviews, security, and applicable legal requirements. When no longer needed, GlowFrame will delete, destroy, or anonymize it as appropriate.

6. User Rights
Users may request access, correction, deletion, restriction or objection, data copies, or withdrawal of consent where processing relies on consent. Some requests may be limited where data is needed for a contract, platform security, or legal obligations.

7. Security and Contact
GlowFrame applies access controls, separates sensitive-file storage, and uses safeguards appropriate to the Prototype MVP. Questions and data-rights requests may be submitted through the contact channel published by GlowFrame.`,
  },
  {
    type: PolicyDocumentType.rentalAgreement,
    titleTh: 'ข้อตกลงการเช่า',
    titleEn: 'Rental Agreement',
    version: 'v1.0',
    forceReconsent: false,
    legacyBodyTh:
      'ผู้เช่าต้องดูแลสินค้า ใช้งานตามวัตถุประสงค์ คืนสินค้าตรงเวลา และแจ้งปัญหาหรือความเสียหายตามจริง เจ้าของต้องส่งมอบสินค้าตรงตามรายละเอียดและอยู่ในสภาพพร้อมใช้งาน',
    bodyTh: `1. การจอง
ผู้เช่าต้องยืนยันอีเมล เลือกสินค้าที่ได้รับอนุมัติ และจองล่วงหน้าอย่างน้อย 5 วัน ระบบไม่อนุญาตช่วงวันที่ซ้อนกับการจองอื่นที่ยังมีผล รายการยังไม่ยืนยันจนกว่าหลักฐานการชำระเงินจะผ่านการตรวจ

2. การส่งมอบ
ผู้เช่าเลือกวิธีรับสินค้าที่เจ้าของรองรับ ได้แก่ รับด้วยตนเอง Messenger หรือขนส่ง เจ้าของต้องเตรียมสินค้าและอุปกรณ์ให้ตรงตามรายการ อยู่ในสภาพใช้งานได้ และส่งมอบตามวันและวิธีที่ตกลง

3. หน้าที่ของผู้เช่า
ผู้เช่าต้องตรวจสภาพเมื่อได้รับ ใช้งานอย่างระมัดระวัง ไม่ดัดแปลง ไม่ให้บุคคลอื่นนำไปใช้โดยไม่ได้รับอนุญาต และปฏิบัติตามคำแนะนำของผู้ผลิต หากพบปัญหาต้องหยุดใช้งานและแจ้งเจ้าของหรือ GlowFrame

4. การคืนสินค้า
ผู้เช่าต้องคืนสินค้า อุปกรณ์ และบรรจุภัณฑ์ตามกำหนดในสภาพใกล้เคียงตอนรับ ยกเว้นการเสื่อมสภาพจากการใช้งานปกติ การคืนล่าช้าอาจมีค่าธรรมเนียมตามเงื่อนไขที่แสดงในรายการหรือการจอง

5. ความเสียหายและข้อโต้แย้ง
คู่กรณีควรเก็บภาพหรือหลักฐานก่อนส่งมอบและหลังคืน เมื่อมีความเสียหาย ผู้ดูแลระบบอาจตรวจคำอธิบาย รูปภาพ และข้อมูลการทำรายการเพื่อพิจารณาการหักมัดจำ คืนเงิน หรือดำเนินการอื่นตามขอบเขต Prototype MVP

6. การยกเลิก
การยกเลิกและคืนเงินเป็นไปตามสถานะการจอง ระยะเวลาที่เหลือ และนโยบายการชำระเงิน จำนวนเงินที่อนุมัติคืนจะบันทึกเข้า Wallet ของผู้ใช้

7. การเสร็จสิ้นรายการ
รายการถือว่าเสร็จสิ้นเมื่อมีการคืนและตรวจรับสินค้า ไม่มีประเด็นค้าง หรือผู้ดูแลระบบปิดรายการแล้ว หลังจากนั้นค่าเช่าที่เกี่ยวข้องจึงถูกบันทึกให้เจ้าของและมัดจำที่อนุมัติจึงคืนแก่ผู้เช่า`,
    bodyEn: `1. Booking
The renter must verify their email, select an approved listing, and book at least 5 days in advance. Dates cannot overlap another effective booking. A rental is not confirmed until payment evidence has been reviewed and approved.

2. Handover
The renter chooses a method supported by the owner: pickup, messenger, or shipping. The owner must prepare the listed product and accessories in working condition and hand them over on the agreed date and by the selected method.

3. Renter Responsibilities
The renter must inspect the equipment on receipt, use it carefully, avoid unauthorized modification or third-party use, and follow manufacturer guidance. If a problem occurs, use must stop and the owner or GlowFrame must be notified.

4. Return
The renter must return the equipment, accessories, and packaging on time and in substantially the same condition, excluding normal wear. Late return fees may apply according to the listing or booking terms.

5. Damage and Disputes
Both parties should retain before-and-after photos or other evidence. If damage is reported, an administrator may review descriptions, images, and transaction records to decide on a deposit deduction, refund, or another action within the Prototype MVP workflow.

6. Cancellation
Cancellations and refunds depend on booking status, remaining notice, and the Payment Policy. An approved refund is recorded in the user's Wallet.

7. Completion
A rental is complete after the product is returned and received, no issue remains open, or an administrator closes the transaction. Applicable rental income is then credited to the owner and an approved deposit return is credited to the renter.`,
  },
  {
    type: PolicyDocumentType.listingPolicy,
    titleTh: 'นโยบายการลงสินค้า',
    titleEn: 'Listing Policy',
    version: 'v1.0',
    forceReconsent: false,
    legacyBodyTh:
      'เจ้าของต้องยืนยันตัวตนและให้ข้อมูลสินค้า รูปภาพ ราคา สภาพ และอุปกรณ์ที่ให้มาด้วยอย่างถูกต้อง รายการสินค้าจะเผยแพร่ได้หลังผ่านการอนุมัติจากผู้ดูแลระบบ',
    bodyTh: `1. คุณสมบัติของเจ้าของ
เจ้าของต้องเข้าสู่ระบบและผ่านการยืนยันตัวตนจากผู้ดูแลระบบก่อนลงสินค้า ต้องมีสิทธิในสินค้าและมีอำนาจนำสินค้าออกให้เช่า

2. ข้อมูลรายการ
ชื่อ รุ่น หมวดหมู่ แบรนด์ รายละเอียด สภาพ ราคาเช่าต่อวัน มัดจำ อุปกรณ์ที่ให้มาด้วย และจุดรับสินค้าต้องถูกต้อง ชัดเจน และเป็นข้อมูลปัจจุบัน ห้ามใช้ข้อมูลที่ทำให้ผู้เช่าเข้าใจผิด

3. รูปภาพและวิดีโอ
สื่อต้องเป็นสินค้าจริง มองเห็นสภาพและจุดสำคัญได้ชัด ไม่ละเมิดลิขสิทธิ์หรือความเป็นส่วนตัว และต้องไม่มีข้อมูลลับ เอกสารยืนยันตัวตน หรือหลักฐานการชำระเงินปะปนอยู่

4. สินค้าที่ห้ามลง
ห้ามลงสินค้าที่ผิดกฎหมาย ถูกขโมย ปลอม ชำรุดจนไม่ปลอดภัย ไม่มีอยู่จริง หรือไม่เกี่ยวข้องกับกล้องและอุปกรณ์ที่ GlowFrame รองรับ

5. ราคาและความพร้อม
เจ้าของเป็นผู้กำหนดราคาและมัดจำที่สมเหตุสมผล ต้องปรับข้อมูลเมื่อสภาพหรือความพร้อมเปลี่ยน และไม่รับการจองนอกระบบเพื่อหลีกเลี่ยงขั้นตอนของ GlowFrame

6. การตรวจโดยผู้ดูแลระบบ
รายการใหม่หรือรายการที่แก้ไขสาระสำคัญอาจอยู่ในสถานะรอตรวจ เฉพาะรายการที่ได้รับอนุมัติจึงแสดงในหน้าสาธารณะ ผู้ดูแลระบบอาจปฏิเสธ ซ่อน หรือขอข้อมูลเพิ่ม

7. หน้าที่ระหว่างมีการเช่า
เจ้าของต้องรักษาปฏิทินสินค้า เตรียมอุปกรณ์ตรงตามรายการ ส่งมอบตามกำหนด และแจ้งปัญหาโดยเร็ว การละเมิดซ้ำอาจทำให้รายการถูกซ่อนหรือบัญชีถูกจำกัด`,
    bodyEn: `1. Owner Eligibility
An owner must be signed in and approved through identity verification before listing. The owner must own the equipment or otherwise have authority to offer it for rent.

2. Listing Information
The title, model, category, brand, description, condition, daily price, deposit, included accessories, and pickup location must be accurate, clear, and current. Misleading information is prohibited.

3. Images and Video
Media must show the actual product and clearly present its condition and important details. It must not infringe copyright or privacy and must not include sensitive information, identity documents, or payment evidence.

4. Prohibited Listings
Illegal, stolen, counterfeit, nonexistent, or unsafe equipment is prohibited, as are items outside the camera and accessory categories supported by GlowFrame.

5. Pricing and Availability
Owners set reasonable rental prices and deposits, update the listing when condition or availability changes, and must not move bookings off-platform to bypass GlowFrame processes.

6. Admin Review
New listings and material edits may remain pending review. Only approved listings appear publicly. Administrators may reject, hide, or request more information about a listing.

7. Responsibilities During Rental
Owners must maintain availability, prepare all listed equipment, hand it over on time, and report issues promptly. Repeated violations may result in hidden listings or restricted account access.`,
  },
  {
    type: PolicyDocumentType.paymentPolicy,
    titleTh: 'นโยบายการชำระเงิน',
    titleEn: 'Payment Policy',
    version: 'v1.0',
    forceReconsent: false,
    legacyBodyTh:
      'ผู้เช่าต้องอัปโหลดหลักฐานการชำระเงินเพื่อให้ผู้ดูแลระบบตรวจสอบ เงินค่าเช่าจะถูกถือไว้โดยแพลตฟอร์มและโอนไปยังกระเป๋าเงินของเจ้าของเมื่อรายการเสร็จสมบูรณ์ตามเงื่อนไข',
    bodyTh: `1. ยอดที่ต้องชำระ
ยอดรวมอาจประกอบด้วยค่าเช่า มัดจำ ค่าจัดส่ง และค่าธรรมเนียมที่แสดงก่อนยืนยันการจอง ผู้ใช้ต้องตรวจสอบยอดและข้อมูลบัญชีของแพลตฟอร์มก่อนชำระ

2. หลักฐานการชำระเงิน
ผู้เช่าต้องอัปโหลดสลิปหรือหลักฐานผ่านช่องทางที่กำหนด ไฟล์จะเก็บใน Private Storage และอยู่ในสถานะรอตรวจ การอัปโหลดไม่ถือว่าชำระสำเร็จจนกว่าผู้ดูแลระบบอนุมัติ

3. การตรวจสอบ
ผู้ดูแลระบบตรวจยอด วันที่ ผู้โอน และข้อมูลที่เกี่ยวข้อง หากหลักฐานไม่ชัด ยอดไม่ตรง ซ้ำ หรือไม่ถูกต้อง อาจถูกปฏิเสธและผู้เช่าสามารถส่งหลักฐานใหม่ภายในเวลาที่กำหนด

4. การถือเงินและการจ่ายให้เจ้าของ
หลังอนุมัติ ระบบบันทึกยอดไว้กับแพลตฟอร์มระหว่างรายการ ค่าเช่าหลังหักค่าธรรมเนียมที่เกี่ยวข้องจะบันทึกเข้า Wallet ของเจ้าของเมื่อรายการเสร็จสมบูรณ์และไม่มีประเด็นค้าง

5. มัดจำ
มัดจำใช้รองรับความเสียหาย การสูญหาย หรือภาระที่เกี่ยวข้อง เมื่อคืนสินค้าและตรวจรับเรียบร้อย ยอดที่อนุมัติคืนจะบันทึกเข้า Wallet ของผู้เช่า หากมีการหักต้องมีเหตุผลและการพิจารณาของผู้ดูแลระบบ

6. Refund
การคืนเงินขึ้นอยู่กับสถานะการจอง เหตุยกเลิก และผลการตรวจของผู้ดูแลระบบ ยอด Refund ที่อนุมัติจะเข้า Wallet และแสดงเป็นรายการเคลื่อนไหว

7. การถอนเงิน
ผู้ใช้ต้องเพิ่มบัญชีธนาคารและส่งคำขอถอน ผู้ดูแลระบบตรวจคำขอและอาจอนุมัติหรือปฏิเสธตามข้อมูลในระบบ ยอดคงเหลือและรายการ Wallet ใช้เป็นหลักฐานของ flow ภายใน GlowFrame`,
    bodyEn: `1. Amount Due
The total may include rental fees, a deposit, delivery fees, and charges shown before booking confirmation. Users must verify the amount and platform account details before paying.

2. Payment Evidence
The renter must upload a transfer slip or other evidence through the designated flow. The file is stored in Private Storage and remains pending review. Uploading evidence does not complete payment until an administrator approves it.

3. Review
An administrator reviews the amount, date, sender, and related details. Unclear, incorrect, duplicate, or mismatched evidence may be rejected, and the renter may submit new evidence within the allowed period.

4. Funds Held and Owner Credit
After approval, the system records funds as held by the platform during the rental. Rental income, less applicable fees, is credited to the owner's Wallet after completion when no issue remains open.

5. Deposit
The deposit supports damage, loss, or related obligations. After return and inspection, the approved amount is credited back to the renter's Wallet. Any deduction requires a reason and administrator review.

6. Refunds
Refund eligibility depends on booking status, cancellation reason, and administrator review. An approved refund is credited to the Wallet and appears in transaction history.

7. Withdrawals
Users add a bank account and submit a withdrawal request. An administrator reviews and may approve or reject the request based on system information. Wallet balances and entries serve as the record of the GlowFrame internal flow.`,
  },
  {
    type: PolicyDocumentType.identityVerificationConsent,
    titleTh: 'ความยินยอมในการยืนยันตัวตน',
    titleEn: 'Identity Verification Consent',
    version: 'v1.0',
    forceReconsent: true,
    legacyBodyTh:
      'ผู้ใช้ยินยอมให้ GlowFrame รับและตรวจสอบเอกสารยืนยันตัวตนเพื่ออนุมัติสิทธิการลงสินค้า เอกสารจะถูกจัดเก็บในพื้นที่ส่วนตัวและจำกัดการเข้าถึงเฉพาะผู้ดูแลที่เกี่ยวข้อง',
    bodyTh: `1. ความยินยอมและวัตถุประสงค์
ผู้ใช้ยินยอมให้ GlowFrame รับ จัดเก็บ และตรวจเอกสารยืนยันตัวตนเพื่อป้องกันการแอบอ้าง ประเมินความน่าเชื่อถือ และอนุมัติสิทธิในการลงสินค้า

2. ข้อมูลที่ส่ง
ผู้ใช้อาจส่งชื่อจริงและภาพบัตรประชาชนหรือเอกสารที่รองรับ ควรปิดเลขประจำตัวประชาชน 13 หลัก วันเกิด ที่อยู่บนบัตร และข้อมูลที่ไม่จำเป็น โดยให้เหลือชื่อ รูปถ่าย และข้อมูลที่เพียงพอต่อการตรวจสอบ

3. การจัดเก็บ
เอกสารยืนยันตัวตนเป็นข้อมูลลับและจะไม่เก็บใน Cloudinary ไฟล์จะอยู่ใน Private Storage ส่วนฐานข้อมูลเก็บเฉพาะ path สถานะ วันที่ และข้อมูลการตรวจที่จำเป็น

4. ขั้นตอนการตรวจ
หลังอัปโหลด สถานะจะเป็นรอตรวจและไม่ถือว่ายืนยันแล้ว ผู้ดูแลระบบที่ได้รับอนุญาตจะตรวจและเลือกอนุมัติหรือปฏิเสธ หากปฏิเสธอาจระบุเหตุผลและอนุญาตให้ส่งใหม่

5. การเข้าถึงและใช้ข้อมูล
เฉพาะผู้ดูแลที่มีหน้าที่และระบบที่จำเป็นเท่านั้นที่เข้าถึงเอกสารได้ ข้อมูลจะไม่ใช้เพื่อการโฆษณาและไม่เปิดเผยแก่เจ้าของหรือผู้เช่ารายอื่น เว้นแต่ผู้ใช้ยินยอมหรือกฎหมายกำหนด

6. ระยะเวลาและการลบ
GlowFrame เก็บเอกสารเท่าที่จำเป็นต่อการยืนยัน ความปลอดภัย และการตรวจสอบรายการ จากนั้นจะลบหรือจำกัดการเข้าถึงตามนโยบายการเก็บรักษาข้อมูล

7. การถอนความยินยอม
ผู้ใช้อาจติดต่อเพื่อถอนความยินยอมหรือขอลบข้อมูลได้ แต่การถอนอาจทำให้ไม่สามารถลงสินค้า หรือใช้ฟังก์ชันที่กำหนดให้ต้องยืนยันตัวตน และไม่กระทบการใช้ข้อมูลที่ดำเนินการโดยชอบก่อนถอน`,
    bodyEn: `1. Consent and Purpose
The user consents to GlowFrame receiving, storing, and reviewing identity documents to prevent impersonation, assess trust, and approve access to camera listing features.

2. Information Submitted
The user may submit their legal name and an image of a national ID or supported document. The 13-digit identification number, date of birth, card address, and unnecessary details should be covered, leaving only the name, photo, and information needed for review.

3. Storage
Identity documents are confidential and are not stored in Cloudinary. Files are kept in Private Storage, while the database stores only the required path, status, dates, and review metadata.

4. Review Process
After upload, the request is pending and the user is not yet verified. An authorized administrator reviews the document and approves or rejects it. A rejection may include a reason and permission to submit again.

5. Access and Use
Only authorized administrators and necessary systems may access the document. It is not used for advertising or disclosed to other owners or renters unless the user consents or disclosure is legally required.

6. Retention and Deletion
GlowFrame retains documents only as needed for verification, safety, and transaction review, after which they are deleted or access-restricted according to the retention policy.

7. Withdrawal of Consent
Users may contact GlowFrame to withdraw consent or request deletion. Withdrawal may prevent listing or use of features requiring identity verification and does not affect processing lawfully completed before withdrawal.`,
  },
] as const
