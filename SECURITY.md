# SaaS Security Status

- Passwords use bcrypt. Sessions use signed JWTs backed by revocable database records and an HTTP-only cookie.
- Tenant reads and writes resolve the shop from the authenticated user's membership. Shop profile and service changes require the shop owner.
- Public shop reads select catalog fields, and booking creation verifies that the service belongs to the requested shop.
- Plan and booking quota checks run on the server. Monthly quota boundaries follow the shop timezone.
- Keep database credentials, signing keys, and payment credentials in private host settings. Never place secrets in `NEXT_PUBLIC_*` variables.

## Launch blockers

- Login, registration, and public booking do not have distributed rate limits.
- Payment proof review, signed/idempotent webhooks, subscription changes, and renewal/expiry administration are not implemented.
- PostgreSQL row-level security is not installed as trusted per-request context or verified with the deployment role.
- Staff invitations, staff-level permissions, password recovery, and customer cancellation/status lookup are incomplete.
- Production database migration, backup, and restore procedures need to be tested before handling customer data.
