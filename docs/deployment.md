# YishaiEdge Production Deployment Guide

## Recommended SaaS Stack

- Frontend: Vercel
- Backend: Node.js + Express or Next.js API routes
- Database: PostgreSQL on Railway, Render, Neon, or Supabase
- Auth: Firebase Auth/Auth0 for fastest launch, or custom JWT using the API spec
- Monitoring: Sentry
- Product analytics: PostHog

## Environment Variables

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
APP_ORIGIN=https://yishaiedge.com
SENTRY_DSN=...
```

## Deployment Steps

1. Create PostgreSQL database.
2. Run `docs/postgres-schema.sql`.
3. Deploy backend API.
4. Configure CORS to allow only your frontend origin.
5. Deploy frontend to Vercel/Netlify/Cloudflare Pages.
6. Add custom domain such as `yishaiedge.com`.
7. Enable HTTPS and security headers.

## Security Checklist

- Use HTTPS only.
- Hash passwords server-side with bcrypt/Argon2.
- Store refresh tokens in httpOnly cookies or server-side token table.
- Validate all trade inputs server-side.
- Soft-delete trades; never permanently remove user trading history by default.
- Add database backups with point-in-time recovery.

## Performance Targets

- Page load: under 3 seconds.
- API response: under 200ms for common reads.
- Database query: under 100ms for filtered trade lists.
- Trade save: optimistic UI under 500ms, server confirmation in background.

## Migration From Local-First Demo

1. User exports JSON backup from Settings.
2. Backend exposes `/api/import/local-backup`.
3. Server validates and maps local IDs to database UUIDs.
4. Trades, journal entries, playbooks, goals, and settings are inserted transactionally.
5. User signs into the production account and sees migrated data.