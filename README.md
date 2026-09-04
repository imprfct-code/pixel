# Pixel

Pixel art practice log.

Clerk handles authentication. Convex stores profiles and entry metadata. Original images stay in
a private Cloudflare R2 bucket.

## Architecture

```text
React + Vite+
  ├─ Clerk                 authentication
  ├─ Convex                profiles, entries, ownership
  └─ Cloudflare R2         original images
```

## Development

```bash
vp install
vp dev
```

Without Clerk configuration, the frontend shows a setup screen.

## Live backend

1. Activate the Convex integration in Clerk.
2. Add the Clerk publishable key to `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`.
3. Set the Clerk Frontend API URL with
   `vp exec convex env set CLERK_JWT_ISSUER_DOMAIN https://your-domain.clerk.accounts.dev`.
4. Create a private R2 bucket and an Object Read & Write token scoped to that bucket.
5. Set `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` with
   `vp exec convex env set NAME value`.
6. Allow `GET` and `PUT` from the frontend origin in the bucket CORS policy.
7. Run `vp exec convex dev`.

## Checks

```bash
vp check
vpr test --run
vpr build
```

Vite+ manages the local Vite, Vitest, Oxlint, Oxfmt, and package-manager toolchain.
