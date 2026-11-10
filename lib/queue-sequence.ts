import { prisma } from "./prisma";
import { getBangkokToday } from "./date";
import { TEMPLATE_CONFIG } from "@/config/template.config";

/**
 * Generate atomic unique queue number in format <PREFIX>-YYYYMMDD-XXXX (default TQ-YYYYMMDD-XXXX)
 * Uses queue_sequences table within a transaction to guarantee zero collisions
 * Supports executing inside an existing Prisma transaction client (tx)
 */
export async function generateQueueNumber(
  dateStr?: string,
  externalTx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const cleanDateStr = dateStr || getBangkokToday();
  const sequenceDate = cleanDateStr.replace(/-/g, "");
  const prefix = (TEMPLATE_CONFIG.brand.queuePrefix || "TQ").trim().toUpperCase();

  const execute = async (tx: any) => {
    const existing = await tx.queueSequence.findUnique({
      where: { sequenceDate },
    });

    let nextNumber = 1;
    if (existing) {
      nextNumber = existing.lastNumber + 1;
      await tx.queueSequence.update({
        where: { sequenceDate },
        data: { lastNumber: nextNumber },
      });
    } else {
      await tx.queueSequence.create({
        data: {
          sequenceDate,
          lastNumber: 1,
        },
      });
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `${prefix}-${sequenceDate}-${paddedNumber}`;
  };

  if (externalTx) {
    return await execute(externalTx);
  }

  return await prisma.$transaction(async (tx) => {
    return await execute(tx);
  });
}
