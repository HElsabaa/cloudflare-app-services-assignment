# Origin Header-Echo Server

A minimal HTTP server (Python standard library only) that returns every HTTP
request header it received in the body of the response. This is the origin for
the Cloudflare Application Services assignment (Step 1).

## Requirements

- Python 3.8+
- No third-party packages

## Run

```bash
python3 app.py
```

Environment variables:

- `HOST` — interface to bind (default `0.0.0.0`)
- `PORT` — port to listen on (default `8080`)

```bash
PORT=9000 python3 app.py
```

## Test

```bash
curl -s http://127.0.0.1:8080/ -H "X-Demo: hello"
```

Example response:

```json
{
  "message": "All HTTP request headers received by the origin server",
  "client_ip": "127.0.0.1",
  "header_count": 4,
  "headers": {
    "Host": "127.0.0.1:8080",
    "Accept": "*/*",
    "X-Demo": "hello",
    "User-Agent": "curl/8.0.0"
  }
}
```

Both `GET` and `POST` are supported. When this server runs behind Cloudflare
(proxied or via Tunnel), the response will also show Cloudflare-added headers
such as `Cf-Connecting-Ip`, `Cf-Ray`, and `X-Forwarded-For`.
