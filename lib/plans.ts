import type { Prisma } from "@prisma/client";

export const DEFAULT_PLANS = [
  { code: "FREE", name: "FREE", monthlyPrice: 0, serviceLimit: 1, bookingLimit: 20, staffLimit: 1, features: [] as string[] },
  { code: "STARTER", name: "STARTER", monthlyPrice: 59, serviceLimit: 5, bookingLimit: 200, staffLimit: 1, features: [] as string[] },
  { code: "PRO", name: "PRO", monthlyPrice: 129, serviceLimit: null, bookingLimit: 1000, staffLimit: 1, features: ["statistics"] as string[] },
  { code: "BUSINESS", name: "BUSINESS", monthlyPrice: 199, serviceLimit: null, bookingLimit: 3000, staffLimit: null, features: ["multiple_staff", "advanced_reports"] as string[] },
] as const;

export async function seedDefaultPlans(tx: Prisma.TransactionClient) {
  for (const plan of DEFAULT_PLANS) {
    await tx.plan.upsert({ where: { code: plan.code }, create: { ...plan, features: JSON.stringify(plan.features) }, update: {} });
  }
}
