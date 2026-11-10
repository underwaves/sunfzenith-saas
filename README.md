# SUNFZENITH Queue SaaS

Monthly service for businesses that need hosted queue and appointment booking.

## Included

- Owner registration, shop slug, membership isolation, public booking page, service catalog, appointment requests, sequential queue tickets, and backend booking quotas from the active plan.
- Default plan catalog: FREE ฿0/20 bookings, STARTER ฿59/200, PRO ฿129/1,000, BUSINESS ฿199/3,000 per month.
- Existing branded staff queue administration remains available.

## Local setup

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET`.
2. For local development only, set `DATABASE_URL="file:../database/sunfzenith-saas-dev.db"`; use a dedicated PostgreSQL database in deployments.
3. Run `npm install`, `npx prisma generate`, and `npx prisma db push` from this folder.
4. Run `npm run dev`; open `http://localhost:3000`.
5. Use `/register`, then open `/dashboard` and the shop's `/shop/[slug]` booking page.

## Deploy

Configure the product's own `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` in the host. Run `npm run build` and `npm start`, or configure the existing OpenNext target. Do not point this product at the Lifetime database. Review [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) and [SECURITY.md](SECURITY.md), including the PostgreSQL migration and RLS context note, before production use.

## Limitations

Paid checkout, proof review, gateway/webhook verification, Super Admin operations, recovery emails, and connection-scoped RLS are not complete. Do not advertise paid subscription activation as available until those server workflows are implemented.

The current build passes the documented local checks, but it is not ready for a paid public launch until the payment, abuse protection, database isolation, account recovery, and production migration work listed in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) is completed.
