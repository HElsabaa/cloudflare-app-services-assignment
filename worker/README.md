# Secure Identity Worker

A Cloudflare Worker that runs behind Cloudflare Access on
`tunnel.helsabaa.dev/secure`.

## Routes

- `GET /secure` — returns an HTML page:
  `${EMAIL} authenticated at ${TIMESTAMP} from ${COUNTRY}`, where `${COUNTRY}`
  is a link to `/secure/${COUNTRY}`.
- `GET /secure/${COUNTRY}` — returns the country flag image, streamed from a
  **private R2 bucket**, with the stored image content type.

Identity data:
- `${EMAIL}` comes from the `Cf-Access-Authenticated-User-Email` header that
  Cloudflare Access injects after authentication.
- `${TIMESTAMP}` is generated in the Worker (ISO 8601).
- `${COUNTRY}` comes from `request.cf.country` (Cloudflare geo data).

## Prerequisites

- Node.js and npm
- A domain registered/active on Cloudflare
- Wrangler (installed as a dev dependency, or run via `npx wrangler`)

## Setup

```bash
npm install
npx wrangler login
```

## Create the private R2 bucket and upload flags

R2 buckets are private by default — exactly what the assignment requires.

```bash
npx wrangler r2 bucket create assignment-flags

# Upload one SVG per country code you want to support. Keys live under flags/.
npx wrangler r2 object put assignment-flags/flags/US.svg --file ./flags/US.svg
```

The Worker looks up `flags/${COUNTRY}.svg` (uppercased). Add whichever country
codes you expect to test from.

## Configure

Edit `wrangler.toml` and set:

- `account_id` — your Cloudflare account ID.
- `routes` — already set to `tunnel.helsabaa.dev/secure*`, zone `helsabaa.dev`.
- `bucket_name` — the R2 bucket you created above.

## Deploy

```bash
npx wrangler deploy
```

## Validate without deploying

```bash
npx wrangler deploy --dry-run --outdir /tmp/worker-build
```

## Local development

```bash
npx wrangler dev
```

Note: `request.cf.country` and the Access email header are populated by
Cloudflare's edge, so the full identity output is best verified on the deployed
Worker behind Access rather than purely locally.
