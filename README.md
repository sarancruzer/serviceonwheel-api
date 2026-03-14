# ServiceOnWheel API

Enterprise NestJS v10 backend for a local services marketplace with separate customer, vendor, and admin clients. The stack uses NestJS, Prisma, PostgreSQL, JWT auth with refresh rotation, SMTP mail, and S3 pre-signed uploads.

## Features

- Shared auth for `CUSTOMER`, `VENDOR`, and `ADMIN` roles with multi-role support.
- JWT access tokens plus opaque refresh tokens with rotation and reuse detection.
- Lockout policy for repeated failed logins.
- Public, customer, vendor, and admin route segmentation.
- Prisma schema, SQL migration, and seed data for Thanjavur launch.
- Booking lifecycle with dispatch, completion, commission, and settlement flows.
- Consistent error envelope and request correlation via `X-Request-Id`.
- Swagger docs at `/docs`.
- Unit tests for commission, status transitions, auth refresh/lockout logic, and settlement aggregation.

## Quick Start

1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies with `npm install`.
3. Apply database migrations with `npm run prisma:migrate:deploy`.
4. Seed initial data with `npm run prisma:seed`.
5. Start the API with `npm run start:dev` or `npm run start:prod`.

## Scripts

- `npm run build`
- `npm run start:dev`
- `npm run start:prod`
- `npm test`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`

## Default Seed Data

- City: `thanjavur`
- Categories: `electrician`, `plumber`, `carpenter`
- 12 subservices per category
- Pricing rule template per subservice
- FAQs for city and categories
- Initial admin, demo customer, and demo vendor from env variables

## API Segments

- `GET /health`
- `GET /health/db`
- `GET /docs`
- `POST /auth/*`
- `GET|POST /public/*`
- `GET|POST|PUT|DELETE /customer/*`
- `GET|PUT /vendor/*`
- `GET|POST|PUT|DELETE /admin/*`

## Project Tree

```text
.
├── .env.example
├── README.md
├── jest.config.ts
├── nest-cli.json
├── package.json
├── prisma
│   ├── migrations
│   │   └── 20260313000000_init
│   │       └── migration.sql
│   ├── schema.prisma
│   └── seed.ts
├── prisma.config.ts
├── src
│   ├── app.module.ts
│   ├── audit
│   ├── auth
│   ├── bookings
│   ├── catalog
│   ├── common
│   ├── config
│   ├── customers
│   ├── health
│   ├── mail
│   ├── prisma
│   ├── providers
│   ├── reports
│   ├── settlements
│   ├── storage
│   └── main.ts
├── test
│   ├── auth
│   ├── bookings
│   └── settlements
├── tsconfig.build.json
└── tsconfig.json
```

## Important Notes

- Guest bookings are supported by allowing booking-linked addresses without a user owner.
- `DELETE` endpoints on catalog entities and vendors are implemented as safe deactivation where applicable.
- `paymentModeUsed` is captured on completion, while company commission is calculated only from `finalLabor`.
- Vendor job APIs are intentionally scaffolded as a Phase-2 placeholder.

## Verification

The current repository state has been validated with:

- `npm run build`
- `npm test`

Swagger is mounted at `/docs` when the server starts.
