# Deno API Server

A small backend API built with [Deno](https://deno.com). It checks an API key before it answers a request. The keys live in a JSON file that stands in for a database.

## Run it

```bash
deno task start     # run the server
deno task dev       # run it and restart whenever a file changes
```

The server listens on `http://localhost:8000`.

## Try it

```bash
# 200 OK: valid key
curl http://localhost:8000/hello -H "X-API-Key: sk-1234567890abcdef"
curl http://localhost:8000/hello -H "Authorization: Bearer sk-1234567890abcdef"

# 401 Unauthorized: no key, a wrong key, or a revoked key
curl http://localhost:8000/hello
curl http://localhost:8000/hello -H "X-API-Key: wrong"
curl http://localhost:8000/hello -H "X-API-Key: sk-revoked000000000"

# 404 Not Found: unknown route
curl http://localhost:8000/nope
```

## Files

| File            | Purpose                                       |
|-----------------|-----------------------------------------------|
| `main.ts`       | The server: routing, authentication, handlers |
| `api_keys.json` | The list of allowed API keys                  |
| `deno.json`     | Deno config and task shortcuts                |

> The keys in `api_keys.json` are fake demo keys. Never commit real secrets to Git.
