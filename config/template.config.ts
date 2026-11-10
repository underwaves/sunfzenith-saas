/**
 * ============================================================================
 * 🎨 STARTER TEMPLATE CONFIGURATION (ตั้งค่าแม่แบบเว็บไซต์ที่นี่ที่เดียว)
 * ============================================================================
 * คุณสามารถแก้ไขข้อมูลร้าน โลโก้ โทนสี รหัสนำหน้าคิว คำศัพท์ และแพ็กเกจบริการ
 * ในไฟล์นี้เพื่อนำไปใช้งานกับร้านหรือธุรกิจของคุณได้ทันที
 */

export type ThemePresetId =
  | "pastel-magic"
  | "matcha-cafe"
  | "ocean-clinic"
  | "peach-salon"
  | "minimal-mono"
  | "custom";

export type BrandIconName =
  | "Sparkles"
  | "Moon"
  | "Star"
  | "Heart"
  | "Crown"
  | "Store"
  | "Coffee"
  | "Scissors"
  | "Stethoscope";

export interface ThemeColors {
  lavender: string;
  purple: string;
  pink: string;
  babypink: string;
  milky: string;
  deep: string;
  blue: string;
  yellow: string;
  green: string;
  bgBase: string;
}

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  "pastel-magic": {
    id: "pastel-magic",
    name: "Magical Pastel (ม่วง-ชมพูพาสเทล)",
    description: "โทนละมุน อบอุ่น แฝงกลิ่นอายเวทมนตร์ เหมาะกับร้านดูดวง ไพ่ทาโรต์ งานอาร์ต หรือกิฟต์ช็อป",
    colors: {
      lavender: "#D9C7FF",
      purple: "#B9A0F5",
      pink: "#FFD9E8",
      babypink: "#FFF0F6",
      milky: "#FFFCFF",
      deep: "#4A3E56",
      blue: "#DCEBFF",
      yellow: "#FFF1B8",
      green: "#D8F5E5",
      bgBase: "#FFFDFC",
    },
  },
  "matcha-cafe": {
    id: "matcha-cafe",
    name: "Matcha & Cream (เขียวมัทฉะ-ครีม)",
    description: "โทนธรรมชาติ สดชื่น อบอุ่น เหมาะกับคาเฟ่ ร้านเบเกอรี่ ร้านอาหาร หรือสปาธรรมชาติ",
    colors: {
      lavender: "#C6E6D0",
      purple: "#78B890",
      pink: "#F7DFC6",
      babypink: "#F4F9F5",
      milky: "#FCFDFB",
      deep: "#2E4738",
      blue: "#D6ECF7",
      yellow: "#FDF0C2",
      green: "#D2F4E0",
      bgBase: "#FBFDF9",
    },
  },
  "ocean-clinic": {
    id: "ocean-clinic",
    name: "Ocean Breeze (ฟ้าพาสเทล-สะอาดตา)",
    description: "โทนสะอาด น่าเชื่อถือ ทันสมัย เหมาะกับคลินิกทันตกรรม ความงาม ร้านแว่นตา หรือศูนย์บริการ",
    colors: {
      lavender: "#C2E0FF",
      purple: "#7AB8F5",
      pink: "#D6F0FF",
      babypink: "#F0F8FF",
      milky: "#FAFDFF",
      deep: "#28405C",
      blue: "#D4EBFF",
      yellow: "#FFF3C4",
      green: "#D5F5E3",
      bgBase: "#F9FCFF",
    },
  },
  "peach-salon": {
    id: "peach-salon",
    name: "Peach Blossom (พีช-โรสโกลด์)",
    description: "โทนหวานละมุน สดใส เหมาะกับร้านทำเล็บ ต่อขนตา ซาลอน สตูดิโอถ่ายภาพ หรือร้านดอกไม้",
    colors: {
      lavender: "#FFD1C9",
      purple: "#F49D8E",
      pink: "#FFE3D8",
      babypink: "#FFF5F2",
      milky: "#FFFCFA",
      deep: "#5C3732",
      blue: "#DCEBFF",
      yellow: "#FFF2C2",
      green: "#D8F5E5",
      bgBase: "#FFFDFB",
    },
  },
  "minimal-mono": {
    id: "minimal-mono",
    name: "Minimal Slate (มินิมอล-เรียบหรู)",
    description: "โทนสุภาพ เรียบง่าย เป็นทางการ เหมาะกับฟรีแลนซ์ คอมมิชชันงานออกแบบ หรือบริการทั่วไป",
    colors: {
      lavender: "#D8DEE9",
      purple: "#94A3B8",
      pink: "#E2E8F0",
      babypink: "#F8FAFC",
      milky: "#FFFFFF",
      deep: "#1E293B",
      blue: "#DBEAFE",
      yellow: "#FEF3C7",
      green: "#D1FAE5",
      bgBase: "#FBFDFE",
    },
  },
  custom: {
    id: "custom",
    name: "Custom Palette (แต่งสีเองอิสระ)",
    description: "กำหนดชุดสีของเว็บไซต์เองได้อย่างอิสระ ปรับแต่งสีปุ่ม สีการ์ด สีพื้นหลัง และสีตัวอักษรตามสไตล์คุณ",
    colors: {
      lavender: "#D9C7FF",
      purple: "#B9A0F5",
      pink: "#FFD9E8",
      babypink: "#FFF0F6",
      milky: "#FFFCFF",
      deep: "#4A3E56",
      blue: "#DCEBFF",
      yellow: "#FFF1B8",
      green: "#D8F5E5",
      bgBase: "#FFFDFC",
    },
  },
};

export interface BusinessPreset {
  id: string;
  label: string;
  shopName: string;
  fullName: string;
  subtitle: string;
  badgeText: string;
  icon: BrandIconName;
  themePreset: ThemePresetId;
  queuePrefix: string;
  serviceLabel: string;
  unitCountLabel: string;
  unitName: string;
  staffTitle: string;
  packages: string[];
}

export const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    id: "tarot",
    label: "🔮 ร้านดูดวง / ไพ่ทาโรต์ (Default)",
    shopName: "Magical Tarot",
    fullName: "Magical Pastel Tarot 🔮",
    subtitle: "ระบบจัดการคิวและติดตามคิวเปิดไพ่ทาโรต์ออนไลน์",
    badgeText: "Queue System ✨",
    icon: "Sparkles",
    themePreset: "pastel-magic",
    queuePrefix: "TQ",
    serviceLabel: "บริการ / แพ็กเกจเปิดไพ่",
    unitCountLabel: "จำนวนคำถาม",
    unitName: "คำถาม",
    staffTitle: "แม่หมอ",
    packages: [
      "เริ่มต้น (ไม่ละเอียด)",
      "เจาะจง",
      "เจาะลึก",
      "โปรล่าสุด",
      "เซ็ตการงาน",
      "เซ็ตคู่รัก",
      "เซ็ตการสอบ",
      "เซ็ตการเรียน",
      "เซ็ตการเงิน",
      "เซ็ตแฟนเก่า",
      "เซ็ตคนคุย",
      "เซ็ตภาพรวมชีวิต",
      "เซ็ตจัดเต็ม",
      "แม่หมอทักเอง — 29 บาท",
      "แม่หมอทักเองแบบเจาะจง — 49 บาท",
      "แม่หมอทักเองแบบเจาะลึก — 69 บาท",
      "แม่หมอทักเองแบบพิเศษ — 99 บาท",
      "แม่หมอทักเองประจำเดือนนี้",
      "แม่หมอทักเองประจำเดือนหน้า",
    ],
  },
  {
    id: "salon",
    label: "💅 ร้านทำเล็บ / ต่อขนตา / บิวตี้ซาลอน",
    shopName: "Blossom Salon",
    fullName: "Blossom Nail & Lash Studio 💅",
    subtitle: "ระบบจัดการคิวและติดตามคิวรับบริการบิวตี้ซาลอน",
    badgeText: "Salon Queue ✨",
    icon: "Scissors",
    themePreset: "peach-salon",
    queuePrefix: "SL",
    serviceLabel: "บริการ / คอร์สที่เลือก",
    unitCountLabel: "จำนวนรายการ",
    unitName: "รายการ",
    staffTitle: "ช่างผู้ดูแล",
    packages: [
      "ทาสีเจลมือ (พื้น/ลูกแก้ว/แฟลช)",
      "ทาสีเจลเท้า + สปาเท้า",
      "เพ้นท์เล็บอาร์ต / ติดอะไหล่",
      "ต่อเล็บ PVC / อะคริลิก",
      "ถอดสีเจล + บำรุงหน้าเล็บ",
      "ต่อขนตา Classic เส้นต่อเส้น",
      "ต่อขนตา Volume หวานละมุน",
      "ลิฟติ้งขนตา + ย้อมทิ้นท์",
    ],
  },
  {
    id: "cafe",
    label: "☕ คาเฟ่ / ร้านเบเกอรี่ / พรีออเดอร์",
    shopName: "Matcha House",
    fullName: "Matcha & Cozy Bakery ☕",
    subtitle: "ระบบจัดการคิวออเดอร์และติดตามสถานะเครื่องดื่ม/เบเกอรี่",
    badgeText: "Order Queue 🍵",
    icon: "Coffee",
    themePreset: "matcha-cafe",
    queuePrefix: "CF",
    serviceLabel: "เมนู / เซ็ตออเดอร์",
    unitCountLabel: "จำนวนชิ้น/แก้ว",
    unitName: "รายการ",
    staffTitle: "บาริสต้า",
    packages: [
      "รับที่ร้าน (Takeaway)",
      "ทานที่ร้าน (Dine-in)",
      "เซ็ตมัทฉะพรีเมียม + เค้ก",
      "พรีออเดอร์เค้กวันเกิด",
      "สแน็คบ็อกซ์ (Snack Box)",
      "เดลิเวอรี (Delivery)",
    ],
  },
  {
    id: "clinic",
    label: "🩺 คลินิก / ศูนย์บริการ / คิวทั่วไป",
    shopName: "Care Clinic",
    fullName: "Ocean Care Wellness Clinic 🩺",
    subtitle: "ระบบจัดการคิวและติดตามสถานะการเข้ารับบริการเรียลไทม์",
    badgeText: "Smart Queue ✨",
    icon: "Stethoscope",
    themePreset: "ocean-clinic",
    queuePrefix: "CL",
    serviceLabel: "ประเภทการรับบริการ",
    unitCountLabel: "จำนวนผู้รับบริการ/หัวข้อ",
    unitName: "รายการ",
    staffTitle: "เจ้าหน้าที่",
    packages: [
      "ปรึกษาเบื้องต้น",
      "ตรวจเช็กสุขภาพทั่วไป",
      "ทำหัตถการ / ทรีตเมนต์",
      "ติดตามผลตามนัดหมาย",
      "รับยา / เอกสารรับรอง",
    ],
  },
  {
    id: "test",
    label: "🧪 เทมเพลตทดสอบระบบ (ไม่ใช่ร้านค้า)",
    shopName: "Queue Sandbox",
    fullName: "Queue System Sandbox 🧪",
    subtitle: "ระบบจำลองการรันคิวและติดตามสถานะทั่วไป (สำหรับทดสอบระบบ)",
    badgeText: "Test Sandbox 🧪",
    icon: "Star",
    themePreset: "minimal-mono",
    queuePrefix: "QT",
    serviceLabel: "หัวข้อ / รายการทดสอบ",
    unitCountLabel: "จำนวนหน่วย",
    unitName: "รายการ",
    staffTitle: "แอดมินผู้ดูแล",
    packages: [
      "รายการทดสอบ A (ทั่วไป)",
      "รายการทดสอบ B (ด่วนพิเศษ)",
      "รายการทดสอบ C (กำหนดเอง)",
      "ทดสอบระบบคิว (System Test)",
    ],
  },
];

export interface TemplateConfig {
  brand: {
    /** ชื่อร้านแบบสั้น (แสดงบน Sidebar และหน้า Login) */
    name: string;
    /** ชื่อร้านแบบเต็ม (แสดงบน Title เว็บ, หน้า Dashboard และหน้าติดตามคิวลูกค้า) */
    fullName: string;
    /** คำโปรยหรือคำอธิบายระบบ */
    subtitle: string;
    /** ป้ายกำกับใต้ชื่อร้านใน Sidebar */
    badgeText: string;
    /** URL รูปโลโก้ร้าน (เช่น "/logo.png") หากเว้นว่างจะใช้ไอคอนแทน */
    logoUrl: string;
    /** ไอคอนประจำร้านเมื่อไม่ได้ใส่รูปโลโก้ */
    icon: BrandIconName;
    /** รหัสนำหน้าเลขคิว เช่น "TQ" จะได้เลขคิว TQ-YYYYMMDD-0001 */
    queuePrefix: string;
    /** ชื่อไฟล์เริ่มต้นเมื่อดาวน์โหลด Excel/CSV */
    exportFilePrefix: string;
  };
  theme: {
    /** รหัสโทนสีเริ่มต้นของเว็บ */
    preset: ThemePresetId;
    /** ชุดสีที่ปรับแต่งเอง (เมื่อเลือก preset เป็น "custom") */
    customColors?: Partial<ThemeColors>;
  };
  labels: {
    /** คำเรียกแพ็กเกจหรือบริการ เช่น "บริการ / แพ็กเกจเปิดไพ่" หรือ "เมนู / บริการ" */
    serviceLabel: string;
    /** คำเรียกหน่วยนับ เช่น "จำนวนคำถาม" หรือ "จำนวนรายการ" */
    unitCountLabel: string;
    /** หน่วยนับสั้นๆ เช่น "คำถาม", "ข้อ", "รายการ", "ท่าน" */
    unitName: string;
    /** คำเรียกผู้ให้บริการ เช่น "แม่หมอ", "ช่าง", "แอดมิน", "เจ้าหน้าที่" */
    staffTitle: string;
    /** ข้อความสถานะในหน้าติดตามคิวลูกค้า (/track/:token) */
    customerTracking: {
      subtitle: string;
      waitingBannerTitle: string;
      waitingFooterNote: string;
      inProgressTitle: string;
      inProgressDescription: string;
      completedTitle: string;
      completedDescription: string;
      cancelledTitle: string;
      cancelledDescription: string;
    };
  };
  /** รายการแพ็กเกจหรือบริการเริ่มต้นสำหรับกดเลือกด่วนตอนสร้างคิว */
  packages: readonly string[];
}

/**
 * ----------------------------------------------------------------------------
 * ✨ แก้ไขค่าเริ่มต้นของร้านคุณได้ที่ TEMPLATE_CONFIG ด้านล่างนี้
 * ----------------------------------------------------------------------------
 */
export const TEMPLATE_CONFIG: TemplateConfig = {
  brand: {
    name: process.env.NEXT_PUBLIC_SHOP_NAME || "Magical Tarot",
    fullName: process.env.NEXT_PUBLIC_SHOP_FULL_NAME || process.env.NEXT_PUBLIC_SHOP_NAME || "Magical Pastel Tarot 🔮",
    subtitle: process.env.NEXT_PUBLIC_SHOP_SUBTITLE || "ระบบจัดการคิวร้านเปิดไพ่ทาโรต์",
    badgeText: process.env.NEXT_PUBLIC_SHOP_BADGE || "Queue System ✨",
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
    icon: (process.env.NEXT_PUBLIC_BRAND_ICON as BrandIconName) || "Sparkles",
    queuePrefix: process.env.NEXT_PUBLIC_QUEUE_PREFIX || "TQ",
    exportFilePrefix: process.env.NEXT_PUBLIC_EXPORT_PREFIX || "augg-tarot-queues",
  },
  theme: {
    preset: (process.env.NEXT_PUBLIC_THEME_PRESET as ThemePresetId) || "pastel-magic",
  },
  labels: {
    serviceLabel: "ชื่อบริการ / แพ็กเกจเปิดไพ่",
    unitCountLabel: "จำนวนคำถาม",
    unitName: "คำถาม",
    staffTitle: "แม่หมอ",
    customerTracking: {
      subtitle: "ระบบติดตามคิวเปิดไพ่ทาโรต์แบบเรียลไทม์",
      waitingBannerTitle: "ดวงดาวกำลังเรียงตัวเพื่อคิวของคุณ ✨",
      waitingFooterNote:
        "กรุณารอรับบริการตามลำดับคิว ทางร้านจะแจ้งผลการเปิดไพ่ให้ทราบผ่านช่องทางเดิมที่คุณติดต่อไว้ค่ะ 💜",
      inProgressTitle: "ถึงคิวของคุณแล้วนะคะ ♡",
      inProgressDescription:
        "แม่หมอกำลังตั้งจิตและเปิดไพ่ให้คุณอย่างตั้งใจ กรุณารอสักครู่เพื่อรับผลนะคะ ✨",
      completedTitle: "การเปิดไพ่ของคุณเสร็จเรียบร้อยแล้วค่ะ 💜",
      completedDescription:
        "ขอบคุณที่ไว้วางใจให้ร้านของเราเป็นผู้สื่อสารข้อความจากดวงดาวนะคะ ขอให้พบเจอแต่ความสุขและสิ่งดี ๆ ค่ะ ✨",
      cancelledTitle: "คิวนี้ถูกยกเลิกแล้ว",
      cancelledDescription:
        "หากมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม กรุณาติดต่อทางร้านผ่านช่องทางเดิมค่ะ",
    },
  },
  packages: [
    "เริ่มต้น (ไม่ละเอียด)",
    "เจาะจง",
    "เจาะลึก",
    "โปรล่าสุด",
    "เซ็ตการงาน",
    "เซ็ตคู่รัก",
    "เซ็ตการสอบ",
    "เซ็ตการเรียน",
    "เซ็ตการเงิน",
    "เซ็ตแฟนเก่า",
    "เซ็ตคนคุย",
    "เซ็ตภาพรวมชีวิต",
    "เซ็ตจัดเต็ม",
    "แม่หมอทักเอง — 29 บาท",
    "แม่หมอทักเองแบบเจาะจง — 49 บาท",
    "แม่หมอทักเองแบบเจาะลึก — 69 บาท",
    "แม่หมอทักเองแบบพิเศษ — 99 บาท",
    "แม่หมอทักเองประจำเดือนนี้",
    "แม่หมอทักเองประจำเดือนหน้า",
  ] as const,
};
