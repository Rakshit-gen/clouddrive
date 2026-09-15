# Clouddrive

A Google Drive style file manager. Sign in with Google, upload files straight to S3, search, rename, download, and delete them, and optionally share a file with another registered user by email.

## What it does

- Google OAuth sign-in with server-side sessions (no tokens in localStorage)
- Upload files directly from the browser to a private S3 bucket using presigned URLs
- List, search, rename, download, and delete files
- Share a file with another registered user by email (read-only access for them)
- Every file operation is authorized against the logged-in session on the server

## Architecture

```
Browser (React) ---- session cookie ----> Express API ---- Prisma ----> PostgreSQL
       |                                        |
       '---------- presigned PUT/GET ---------- S3 (private bucket)
```

The API never proxies file bytes. It hands the browser a short-lived presigned S3 URL for uploads and downloads, and stores only metadata (name, size, MIME type, owner, S3 object key) in Postgres. S3 object keys are generated server-side (`users/<ownerId>/files/<fileId>`) and never derived from user input, so a file rename only touches the Postgres row, never S3.

## Tech stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives), React Router, TanStack Query
- **Backend**: Node.js, Express, TypeScript, Passport (`passport-google-oauth20`), Zod
- **Database**: PostgreSQL via Prisma ORM
- **Storage**: Amazon S3 (AWS SDK v3), presigned URLs, private bucket

## Repository structure

```
apps/
  api/
    src/
      config/       env, prisma client, s3 client, session store
      middleware/    requireAuth, centralized error handler
      modules/
        auth/        passport strategy, /auth routes
        files/       validation, controller, routes, upload token signing
      services/      s3.service.ts (presign, head, delete)
      lib/           ApiError, asyncHandler
    prisma/          schema.prisma, migrations/
    tests/           vitest + supertest, mocked Prisma/S3
  web/
    src/
      api/           fetch wrappers per resource
      components/    FileCard, dialogs, Sidebar, Topbar, ui/ (shadcn primitives)
      hooks/         useAuth, useFiles, useUpload
      pages/         LoginPage, DrivePage, MyDriveView, SharedView
      types/
docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database (local or managed)
- An AWS account with an S3 bucket
- A Google Cloud project with OAuth credentials

## Local setup

```bash
git clone <this-repo>
cd clouddrive
npm install
```

This installs both workspaces (`apps/api`, `apps/web`) from the root.

### 1. PostgreSQL

Use a local Postgres or `docker compose up postgres` (see Docker section below). Then set `DATABASE_URL` in `apps/api/.env` (copy from `apps/api/.env.example`):

```
DATABASE_URL=postgresql://clouddrive:clouddrive@localhost:5432/clouddrive
```

Run migrations:

```bash
cd apps/api
npx prisma migrate deploy   # applies existing migrations
# or, while developing schema changes:
npx prisma migrate dev
```

### 2. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID of type **Web application**.
3. Add authorized redirect URIs:
   - Local: `http://localhost:4000/auth/google/callback`
   - Production: `https://<your-api-domain>/auth/google/callback`
4. Add authorized JavaScript origins for your frontend URL (local: `http://localhost:5173`).
5. Copy the Client ID and Client Secret into `apps/api/.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, and set `GOOGLE_CALLBACK_URL` to match the redirect URI you registered.
6. The OAuth consent screen only needs the default `profile` and `email` scopes, which is what the app requests.

### 3. Amazon S3 setup

1. Create a private S3 bucket (block all public access).
2. Add a CORS configuration on the bucket so the browser can PUT/GET directly:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-frontend-domain"],
    "ExposeHeaders": []
  }
]
```

3. Create an IAM user (or role) with a least-privilege policy scoped to just this bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

4. Put the access key, secret, region, and bucket name into `apps/api/.env`.

### 4. Environment variables

`apps/api/.env` (see `apps/api/.env.example`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Random 32+ byte secret for signing session cookies |
| `UPLOAD_TOKEN_SECRET` | Random secret used to sign short-lived upload tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Must match the URI registered in Google Cloud |
| `FRONTEND_URL` | Used for CORS and post-login redirects |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | AWS credentials, never exposed to the browser |
| `MAX_UPLOAD_SIZE_BYTES` | Upload size cap enforced server-side (default 1 GB) |

Generate secrets with `openssl rand -base64 48`.

`apps/web/.env` (see `apps/web/.env.example`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the API (local: `http://localhost:4000`) |

### 5. Running

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Open `http://localhost:5173` and sign in with Google.

## Running tests

```bash
npm run test:api
```

Tests spin up the real Express app with Prisma and S3 mocked (no live database or AWS credentials required), and cover: auth-protected routes, upload URL generation and completion, listing, search, rename, delete, and cross-user authorization (a second user gets 403 on rename, delete, and download of another user's file).

## Docker

```bash
docker compose up --build
```

This starts Postgres and the API. Point `docker compose`'s `api` service at your Google OAuth and AWS credentials via `apps/api/.env` (copy from `.env.example` first, `docker-compose.yml` loads it with `env_file`). Run migrations against the containerized database with:

```bash
DATABASE_URL=postgresql://clouddrive:clouddrive@localhost:5432/clouddrive npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

The frontend is not containerized: it's a static build meant for Vercel/Netlify, and Docker isn't needed for that hosting model.

## Production deployment

**Frontend (Vercel or similar static host)**
- Build command: `npm run build -w apps/web`
- Output directory: `apps/web/dist`
- Env var: `VITE_API_URL` pointing at your deployed API

**Backend (Render, Railway, Fly.io, or similar)**
- Build command: `npm install && npm run prisma:generate -w apps/api && npm run build -w apps/api`
- Start command: `npm run start -w apps/api`
- Run `npm run prisma:deploy -w apps/api` as a release/migration step
- Set `NODE_ENV=production` so cookies are sent with `secure` and `sameSite=none`
- Set `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` to the production URLs, and add the production callback URL to Google Cloud Console

**Database**: any managed Postgres (RDS, Neon, Supabase, Railway Postgres).

**Storage**: the same private S3 bucket, with CORS `AllowedOrigins` updated to include the production frontend URL.

Because `NODE_ENV` and callback URLs are just environment variables, local dev and production point at different Google OAuth redirect URIs and different databases without any code changes.

## Troubleshooting

- **Google sign-in redirects to `/login?error=auth_failed`**: the callback URL in `.env` doesn't match what's registered in Google Cloud Console, or the OAuth consent screen isn't published/testing-list doesn't include your Google account.
- **Session cookie doesn't stick in production**: confirm `NODE_ENV=production`, that the API is served over HTTPS (required for `secure` cookies), and that the frontend and API are on different domains only if `sameSite=none` is set (it is, automatically, in production).
- **Uploads fail with a CORS error in the browser console**: the S3 bucket's CORS configuration doesn't allow your frontend origin, or doesn't allow the `PUT` method.
- **`/api/files/complete` returns `UPLOAD_NOT_FOUND`**: the browser's PUT to the presigned URL didn't finish or failed silently; check the network tab for the PUT request's status.
- **Prisma migration errors on a fresh database**: make sure `DATABASE_URL` points at an empty database and run `npx prisma migrate deploy` (not `dev`) in production.
- **`Invalid environment configuration` on API boot**: one of the required env vars in `apps/api/.env` is missing; the exact field is printed to the console.
