# Duta

Indonesian content clipping marketplace connecting content clippers with content owners.

## Structure

This is a monorepo containing two applications:

- **`apps/api/`** — NestJS 10 backend (REST API, Prisma, Postgres, Redis, Typesense)
- **`apps/web/`** — Next.js 15 frontend (Tailwind v4, Framer Motion, shadcn/ui)

## Development

Each app is independently developed. See per-app READMEs:

- [`apps/api/README.md`](apps/api/README.md)
- [`apps/web/README.md`](apps/web/README.md)

## Deployment

Docker-based deployment via `ghcr.io/wabiwabo/duta-api` and `ghcr.io/wabiwabo/duta-web`.
See `infra/` for compose files and `docs/superpowers/specs/` for architecture decisions.

## License

Proprietary — see LICENSE for details.
