# SaaS Deployment

Use the SaaS folder as the deployment root with Node.js 20.9 or newer. Set this product's own `DATABASE_URL`, a unique `JWT_SECRET` of at least 32 characters, and the public `NEXT_PUBLIC_APP_URL`. Build with `npm run build` and serve with `npm start`. Use a managed PostgreSQL database for hosted multi-shop use; the checked-in SQLite database is for local development only.

The checked-in tenant SQL is additive and assumes the existing profile and queue tables. It is not a complete automated production migration or rollback process. Validate it against a staging copy, establish tested backups and restore procedures, and verify PostgreSQL concurrency and RLS behavior before moving customer data or accepting bookings. `/api/health` checks database connectivity and returns 503 when the database probe fails.

Paid subscription checkout is not implemented. Do not advertise paid plan activation until checkout, verified webhooks, idempotency, subscription administration, and recovery paths have been implemented and tested.
