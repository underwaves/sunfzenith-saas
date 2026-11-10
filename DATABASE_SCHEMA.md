# SaaS Database

Prisma defines the SaaS schema in `prisma/schema.prisma`. It includes legacy queue records plus SaaS shops, memberships, services, business hours, bookings, plans, subscriptions, and per-shop queue counters. The legacy `queues.shopId` is nullable for compatibility; historical rows must be manually assigned only after their shop owner is confirmed.

For a local isolated database use `DATABASE_URL="file:../database/sunfzenith-saas-dev.db"`, then run `npx prisma db push` from this folder. Production should use this product's dedicated PostgreSQL database. Review `database/migrations/20261108_saas_tenants/migration.sql` on staging before applying. The migration expects the legacy `profiles` and `queues` tables to exist.

The SQL migration enables tenant RLS using a trusted `app.user_id` session setting. The current Prisma request path does not install that setting in every transaction, so the SQL policies are not yet a verified enforcement layer. Do not claim database-level RLS isolation until that integration is implemented and tested with the production DB role.
