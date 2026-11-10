/**
 * Pure TypeScript OpenXML (.xlsx) and UTF-8 BOM (.csv) Generator
 * Compatible with Node.js and Cloudflare Workers (zero native dependencies).
 */

export interface ExportQueueRow {
  queueNumber: string;
  queueDate: string;
  queueOrder: number;
  nickname: string;
  packageName: string;
  questionCount: number;
  status: string;
  details: string | null;
  internalNote: string | null;
  trackingUrl: string;
  creatorName: string;
  assigneeName: string;
  createdAtFormatted: string;
  completedAtFormatted: string;
  cancelledAtFormatted: string;
}

export const STATUS_THAI_MAP: Record<string, string> = {
  waiting: "รอคิว",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export function formatBangkokDateTime(dateInput?: Date | string | null): string {
  if (!dateInput) return "-";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(d);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colIndexToLetter(colIdx1Based: number): string {
  let temp = colIdx1Based;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

interface CellDef {
  value: string | number;
  type?: "string" | "number";
  style?: number; // 0 = default, 1 = header, 2 = left-wrap, 3 = center
}

function buildWorksheetXml(
  rows: CellDef[][],
  colWidths: number[]
): string {
  const colsXml = colWidths
    .map(
      (w, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`
    )
    .join("");

  const rowsXml = rows
    .map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const isHeader = rIdx === 0;
      const htAttr = isHeader ? ' ht="26" customHeight="1"' : "";

      const cellsXml = cells
        .map((cell, cIdx) => {
          const ref = `${colIndexToLetter(cIdx + 1)}${rowNum}`;
          const styleAttr = cell.style !== undefined ? ` s="${cell.style}"` : "";

          if (cell.type === "number" && typeof cell.value === "number" && Number.isFinite(cell.value)) {
            return `<c r="${ref}"${styleAttr}><v>${cell.value}</v></c>`;
          }

          const strVal = escapeXml(String(cell.value ?? ""));
          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${strVal}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowNum}"${htAttr}>${cellsXml}</row>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>${colsXml}</cols>` +
    `<sheetData>${rowsXml}</sheetData>` +
    `</worksheet>`
  );
}

// CRC32 Lookup Table for ZIP archive generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipArchive(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + nameBytes.length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // Compression method 0 (STORE)
    lv.setUint16(10, 0, true); // Last mod file time
    lv.setUint16(12, 0x2100, true); // Last mod file date
    lv.setUint32(14, crc, true); // CRC-32
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory file header (46 bytes + nameBytes.length)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central file header signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed to extract
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Compression method 0 (STORE)
    cv.setUint16(12, 0, true); // Last mod file time
    cv.setUint16(14, 0x2100, true); // Last mod file date
    cv.setUint32(16, crc, true); // CRC-32
    cv.setUint32(20, size, true); // Compressed size
    cv.setUint32(24, size, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, files.length, true); // Number of central directory records on this disk
  ev.setUint16(10, files.length, true); // Total number of central directory records
  ev.setUint32(12, centralSize, true); // Size of central directory
  ev.setUint32(16, offset, true); // Offset of start of central directory
  ev.setUint16(20, 0, true); // Comment length

  const totalLength = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    out.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    out.set(part, pos);
    pos += part.length;
  }
  out.set(eocd, pos);

  return out;
}

export function generateQueuesExcelBuffer(queues: ExportQueueRow[]): Uint8Array {
  const encoder = new TextEncoder();

  // Sheet 1: รายการคิวทั้งหมด
  const headers = [
    "ลำดับ",
    "หมายเลขคิว",
    "วันที่รับคิว",
    "ลำดับคิวในวัน",
    "ชื่อเล่นลูกค้า",
    "บริการ / แพ็กเกจ",
    "จำนวนคำถาม",
    "สถานะคิว",
    "รายละเอียด / คำถามลูกค้า",
    "บันทึกภายในแอดมิน",
    "ผู้สร้างคิว",
    "ผู้รับผิดชอบ",
    "เวลาที่สร้างคิว",
    "เวลาที่ดูดวงเสร็จ",
    "เวลาที่ยกเลิก",
    "ลิงก์ติดตามสถานะ",
  ];

  const sheet1Rows: CellDef[][] = [
    headers.map((h) => ({ value: h, type: "string", style: 1 })),
  ];

  queues.forEach((q, idx) => {
    sheet1Rows.push([
      { value: idx + 1, type: "number", style: 3 },
      { value: q.queueNumber, type: "string", style: 3 },
      { value: q.queueDate, type: "string", style: 3 },
      { value: q.queueOrder, type: "number", style: 3 },
      { value: q.nickname, type: "string", style: 2 },
      { value: q.packageName, type: "string", style: 2 },
      { value: q.questionCount, type: "number", style: 3 },
      { value: STATUS_THAI_MAP[q.status] || q.status, type: "string", style: 3 },
      { value: q.details || "-", type: "string", style: 2 },
      { value: q.internalNote || "-", type: "string", style: 2 },
      { value: q.creatorName || "-", type: "string", style: 2 },
      { value: q.assigneeName || "-", type: "string", style: 2 },
      { value: q.createdAtFormatted, type: "string", style: 3 },
      { value: q.completedAtFormatted, type: "string", style: 3 },
      { value: q.cancelledAtFormatted, type: "string", style: 3 },
      { value: q.trackingUrl || "-", type: "string", style: 2 },
    ]);
  });

  const sheet1ColWidths = [
    8,  // ลำดับ
    20, // หมายเลขคิว
    14, // วันที่รับคิว
    14, // ลำดับคิวในวัน
    20, // ชื่อเล่นลูกค้า
    34, // บริการ / แพ็กเกจ
    14, // จำนวนคำถาม
    18, // สถานะคิว
    42, // รายละเอียด / คำถามลูกค้า
    32, // บันทึกภายในแอดมิน
    22, // ผู้สร้างคิว
    22, // ผู้รับผิดชอบ
    20, // เวลาที่สร้างคิว
    20, // เวลาที่ดูดวงเสร็จ
    20, // เวลาที่ยกเลิก
    45, // ลิงก์ติดตามสถานะ
  ];

  // Sheet 2: สรุปภาพรวม (Summary)
  const totalQueues = queues.length;
  const waitingCount = queues.filter((q) => q.status === "waiting").length;
  const inProgressCount = queues.filter((q) => q.status === "in_progress").length;
  const completedCount = queues.filter((q) => q.status === "completed").length;
  const cancelledCount = queues.filter((q) => q.status === "cancelled").length;
  const totalQuestions = queues.reduce((sum, q) => sum + (q.questionCount || 0), 0);

  // Group by package
  const packageCounts: Record<string, number> = {};
  for (const q of queues) {
    packageCounts[q.packageName] = (packageCounts[q.packageName] || 0) + 1;
  }

  const sheet2Rows: CellDef[][] = [
    [
      { value: "หัวข้อสรุปข้อมูลคิว (Magical Tarot Queue Summary)", type: "string", style: 1 },
      { value: "จำนวน / ข้อมูล", type: "string", style: 1 },
    ],
    [
      { value: "วันเวลาที่ส่งออกไฟล์", type: "string", style: 2 },
      { value: formatBangkokDateTime(new Date()), type: "string", style: 3 },
    ],
    [
      { value: "จำนวนคิวทั้งหมด", type: "string", style: 2 },
      { value: totalQueues, type: "number", style: 3 },
    ],
    [
      { value: "คิวที่รอคิว (Waiting)", type: "string", style: 2 },
      { value: waitingCount, type: "number", style: 3 },
    ],
    [
      { value: "กำลังดำเนินการ (In Progress)", type: "string", style: 2 },
      { value: inProgressCount, type: "number", style: 3 },
    ],
    [
      { value: "ดูดวงเสร็จสิ้นแล้ว (Completed)", type: "string", style: 2 },
      { value: completedCount, type: "number", style: 3 },
    ],
    [
      { value: "ยกเลิกคิว (Cancelled)", type: "string", style: 2 },
      { value: cancelledCount, type: "number", style: 3 },
    ],
    [
      { value: "จำนวนคำถามทั้งหมดรวมกัน", type: "string", style: 2 },
      { value: totalQuestions, type: "number", style: 3 },
    ],
    [
      { value: "", type: "string", style: 0 },
      { value: "", type: "string", style: 0 },
    ],
    [
      { value: "สรุปแยกตามแพ็กเกจ / บริการ", type: "string", style: 1 },
      { value: "จำนวนคิว", type: "string", style: 1 },
    ],
    ...Object.entries(packageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([pkg, count]): CellDef[] => [
        { value: pkg, type: "string", style: 2 },
        { value: count, type: "number", style: 3 },
      ]),
  ];

  const sheet2ColWidths = [48, 25];

  const contentTypesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const relsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>` +
    `<sheet name="รายการคิวทั้งหมด" sheetId="1" r:id="rId1"/>` +
    `<sheet name="สรุปภาพรวม" sheetId="2" r:id="rId2"/>` +
    `</sheets>` +
    `</workbook>`;

  const workbookRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>` +
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const stylesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><name val="Tahoma"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FF4A3563"/><name val="Tahoma"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFE9D8FD"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="2">` +
    `<border><left/><right/><top/><bottom/><diagonal/></border>` +
    `<border>` +
    `<left style="thin"><color rgb="FFD6BCFA"/></left>` +
    `<right style="thin"><color rgb="FFD6BCFA"/></right>` +
    `<top style="thin"><color rgb="FFD6BCFA"/></top>` +
    `<bottom style="thin"><color rgb="FFD6BCFA"/></bottom>` +
    `<diagonal/>` +
    `</border>` +
    `</borders>` +
    `<cellStyleXfs count="1">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>` +
    `</cellStyleXfs>` +
    `<cellXfs count="4">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">` +
    `<alignment horizontal="center" vertical="center" wrapText="1"/>` +
    `</xf>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">` +
    `<alignment vertical="top" wrapText="1"/>` +
    `</xf>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">` +
    `<alignment horizontal="center" vertical="top"/>` +
    `</xf>` +
    `</cellXfs>` +
    `<cellStyles count="1">` +
    `<cellStyle name="Normal" xfId="0" builtinId="0"/>` +
    `</cellStyles>` +
    `</styleSheet>`;

  const sheet1Xml = buildWorksheetXml(sheet1Rows, sheet1ColWidths);
  const sheet2Xml = buildWorksheetXml(sheet2Rows, sheet2ColWidths);

  return createZipArchive([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml) },
    { name: "_rels/.rels", data: encoder.encode(relsXml) },
    { name: "xl/workbook.xml", data: encoder.encode(workbookXml) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRelsXml) },
    { name: "xl/styles.xml", data: encoder.encode(stylesXml) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(sheet1Xml) },
    { name: "xl/worksheets/sheet2.xml", data: encoder.encode(sheet2Xml) },
  ]);
}

function escapeCsvField(val: string | number | null | undefined): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateQueuesCsvString(queues: ExportQueueRow[]): string {
  const headers = [
    "ลำดับ",
    "หมายเลขคิว",
    "วันที่รับคิว",
    "ลำดับคิวในวัน",
    "ชื่อเล่นลูกค้า",
    "บริการ / แพ็กเกจ",
    "จำนวนคำถาม",
    "สถานะคิว",
    "รายละเอียด / คำถามลูกค้า",
    "บันทึกภายในแอดมิน",
    "ผู้สร้างคิว",
    "ผู้รับผิดชอบ",
    "เวลาที่สร้างคิว",
    "เวลาที่ดูดวงเสร็จ",
    "เวลาที่ยกเลิก",
    "ลิงก์ติดตามสถานะ",
  ];

  const lines = [headers.map(escapeCsvField).join(",")];

  queues.forEach((q, idx) => {
    const row = [
      idx + 1,
      q.queueNumber,
      q.queueDate,
      q.queueOrder,
      q.nickname,
      q.packageName,
      q.questionCount,
      STATUS_THAI_MAP[q.status] || q.status,
      q.details || "-",
      q.internalNote || "-",
      q.creatorName || "-",
      q.assigneeName || "-",
      q.createdAtFormatted,
      q.completedAtFormatted,
      q.cancelledAtFormatted,
      q.trackingUrl || "-",
    ];
    lines.push(row.map(escapeCsvField).join(","));
  });

  // Prepend UTF-8 BOM so Microsoft Excel on Windows opens Thai characters cleanly
  return "\uFEFF" + lines.join("\r\n");
}
