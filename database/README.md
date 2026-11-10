# SaaS Database

Use a dedicated PostgreSQL database for each SaaS deployment. `prisma/schema.prisma` defines the current schema; `migrations/` contains the reviewed additive PostgreSQL migration. Local SQLite, if used for development, must live in this product's `database/` folder and must never contain Lifetime customer data.
