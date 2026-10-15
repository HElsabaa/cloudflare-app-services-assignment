# Cloudflare Application Services Assignment

Implementation for the Application Services assignment: an origin web server
reached through a Cloudflare Tunnel with Full-Strict TLS, Zero Trust Access with
an SSO IdP, and a Worker that returns authenticated identity info and serves
country flags from a private R2 bucket.

Domain: `helsabaa.dev`. Origin: a single unprivileged Debian 13 LXC on
Proxmox VE, with no public IP — Cloudflare reaches it only via an outbound
tunnel.

## Layout

| Path             | Assignment step | What it is                                            |
| ---------------- | --------------- | ----------------------------------------------------- |
| `origin-server/` | Step 1          | Python server that echoes all request headers         |
| `worker/`        | Step 7          | Cloudflare Worker (Wrangler project) for `/secure`    |
| `docs/RUNBOOK.md`| Steps 2–7       | Full environment-specific setup walkthrough           |

## Architecture

```
Browser → Cloudflare edge (public cert, automatic)
        → Cloudflare Tunnel (outbound from the LXC)
        → Caddy on 127.0.0.1:8443  (Let's Encrypt cert, non-Cloudflare → Full-Strict)
        → Python origin on 127.0.0.1:8080  (echoes request headers)
```

## Where to start

1. Confirm `helsabaa.dev` is active as a Cloudflare zone.
2. Follow `docs/RUNBOOK.md` top to bottom (LXC create → origin → Caddy TLS →
   Tunnel → Zero Trust → Worker).
3. Deploy the Worker from `worker/` once the R2 bucket exists.

## Deliverables mapping

- **Working application + access instructions** → `origin-server/`, `worker/`,
  and the hostname `tunnel.helsabaa.dev` (with `/secure` behind Access).
- **Written report** → use the checklist at the end of `docs/RUNBOOK.md`.

The Worker code should be pushed to a public Git repository per Step 7.d.i.
