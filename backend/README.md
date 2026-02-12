This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Auth setup (Supabase `public.admin`)

`/signup` and `/login` are wired to the `public.admin` table using the Supabase service role client.

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_SESSION_SECRET=...
```

`AUTH_SESSION_SECRET` is used to sign the httpOnly session cookie.

## Logging controls

Logging is configured in `backend/lib/logger.ts` and supports three modes plus a global on/off switch.

```bash
# Global toggle (default: true). Set false to disable all logs.
LOG_ENABLED=true

# Mode options: basic | errors | full (default: basic)
LOG_MODE=basic
```

Modes:

- `basic`: standard operational logs (`info` and above)
- `errors`: only error logs
- `full`: verbose logs for development/debugging

Optional override:

```bash
# Advanced: directly override winston level if needed
LOG_LEVEL=debug
```

## Media upload setup (public bucket)

Media upload utilities are implemented for reusable usage across the app.

Key files:

- `backend/lib/media/constants.ts`
- `backend/lib/media/service.ts`
- `backend/app/admin/actions.ts`

Behavior:

- Uses public Supabase Storage bucket: `mediaBucket`
- Uploads file to Storage with user-scoped path
- Inserts metadata row into `public.media`
- Rolls back storage object if DB insert fails

Optional env:

```bash
# defaults to mediaBucket
SUPABASE_MEDIA_BUCKET=mediaBucket
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
