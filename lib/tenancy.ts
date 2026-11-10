import { prisma } from "@/lib/prisma";
import { seedDefaultPlans } from "@/lib/plans";

/** Resolve tenant scope exclusively from the signed-in user's memberships. */
export async function getAuthorizedShop(userId: string) {
  let membership = await prisma.shopMember.findFirst({
    where: { userId, shop: { isActive: true } },
    orderBy: { createdAt: "asc" },
    include: { shop: true },
  });
  // Safely provision an isolated tenant for pre-SaaS seeded accounts on first use.
  // Historical queue ownership is intentionally not inferred or backfilled here.
  if (!membership) {
    const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { id: true, displayName: true, role: true } });
    if (!profile) return null;
    try {
      const shop = await prisma.$transaction(async (tx) => {
        await seedDefaultPlans(tx);
        const plan = await tx.plan.findUniqueOrThrow({ where: { code: "FREE" } });
        return tx.shop.create({ data: {
          ownerId: profile.id,
          name: `${profile.displayName}'s Shop`.slice(0, 100),
          slug: `shop-${profile.id.replace(/-/g, "").slice(0, 16)}`,
          members: { create: { userId: profile.id, role: profile.role === "owner" ? "SHOP_OWNER" : "SHOP_STAFF" } },
          subscription: { create: { planId: plan.id } },
          services: { create: { name: "บริการทั่วไป", durationMins: 30, price: 0 } },
          hours: { create: Array.from({ length: 7 }, (_, weekday) => ({ weekday, opensAt: "09:00", closesAt: "17:00", isClosed: false })) },
        } });
      });
      membership = { shop, shopId: shop.id, userId, role: "SHOP_OWNER", id: "", createdAt: shop.createdAt };
    } catch (error) {
      // Concurrent first requests may both attempt provisioning; read the winner.
      if ((error as { code?: string })?.code !== "P2002") throw error;
      membership = await prisma.shopMember.findFirst({ where: { userId, shop: { isActive: true } }, orderBy: { createdAt: "asc" }, include: { shop: true } });
    }
  }
  return membership?.shop ?? null;
}

export async function requireShop(userId: string) {
  const shop = await getAuthorizedShop(userId);
  if (!shop) throw new Error("SHOP_REQUIRED");
  return shop;
}

export function slugifyShopName(value: string) {
  return value.normalize("NFKD").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
