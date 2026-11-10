# SaaS Implementation Status

Implemented: account/shop registration, per-shop membership checks, public booking pages, queue and appointment creation, shop hours, service binding, database ticket counters, timezone-aware monthly booking quotas, owner-only shop/service settings, existing queue administration, and database-backed health checks.

Not ready for a paid public launch. Outstanding release work: subscription upgrade/renewal and expiry operations, manual proof review, verified payment gateway/webhooks, distributed rate limiting for login/registration/public booking, connection-scoped RLS, staff invitation and permission management, customer cancellation/status lookup, password recovery, and production database migration/backup procedures. Booking concurrency has not been tested against PostgreSQL.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 62 tests.
- `npm run build`: passed on Next.js 15.5.29 with React 19.2.0.
- `npm run build:worker`: passed for OpenNext/Cloudflare; the Windows build reports WSL is preferred, so Cloudflare runtime behavior still needs a Linux/WSL preview.
- `npm run test:ui`: passed on desktop and mobile across login, dashboard, queue administration, and tracking pages; no horizontal overflow or browser console errors.
- `npm audit`: 0 known vulnerabilities after dependency updates and compatibility overrides.
- The UI suite uses an isolated SQLite database. Production PostgreSQL, payment gateway, email provider, and Cloudflare deployment paths remain unverified.
