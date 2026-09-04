# Pixel

Visual practice log for seeing your work improve over time.

The first vertical slice is implemented: Clerk authentication, Convex ownership and metadata,
direct uploads to a private Cloudflare R2 bucket, a chronological timeline, a 12-week practice
heatmap, and an integer-scale pixel viewer.

## Architecture

```text
React + Vite+
  ├─ Clerk                 authentication
  ├─ Convex                users, entries, ownership
  └─ @convex-dev/r2        signed upload/read URLs and R2 metadata
```

Original images stay in R2. Convex stores only searchable metadata. Object keys use
`users/<userId>/entries/<entryId>/original.<ext>`, and entries do not become visible in the
timeline until R2 metadata has been verified.

## Development

```bash
vp install
vp dev
```

Without environment variables, the frontend starts in a local, session-only demo mode. It can be
used to exercise upload, timeline, and viewer UI without pretending that data is persisted.

## Live backend

1. Create a Convex project and run `vp exec convex dev`.
2. Create a Clerk JWT template named `convex`, then copy `.env.example` to `.env.local` and fill in
   `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY`.
3. Create a private R2 bucket and a bucket-scoped Object Read & Write token.
4. Set backend values with `vp exec convex env set NAME value` for
   `CLERK_JWT_ISSUER_DOMAIN`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, and
   `R2_SECRET_ACCESS_KEY`.
5. Allow `GET` and `PUT` from the frontend origin in the R2 bucket CORS policy. For local work:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]
```

## Checks

```bash
vp check
vpr test --run
vpr build
```

Vite+ manages the local Vite, Vitest, Oxlint, Oxfmt, and package-manager toolchain.
