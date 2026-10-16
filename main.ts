/**
 * A tiny backend API server with API key authentication.
 * Built with Deno by Sirine.
 *
 * Request flow:
 *   client --HTTP request--> handler() --routes--> helloHandler()
 *                                                   └─ authenticate() checks the key
 */

// ---------------------------------------------------------------------------
// 1. Types: describe the shape of our data so TypeScript can catch mistakes.
// ---------------------------------------------------------------------------

interface ApiKey {
  key: string; // the secret value the client sends
  name: string; // a label so we know who the key belongs to
  created: string; // ISO date string
  active: boolean; // set to false to revoke a key without deleting it
}

interface ApiKeysFile {
  keys: ApiKey[];
}

// ---------------------------------------------------------------------------
// 2. "Database": read the keys from a JSON file on disk.
// ---------------------------------------------------------------------------

async function loadApiKeys(): Promise<ApiKeysFile> {
  try {
    const text = await Deno.readTextFile("./api_keys.json"); // needs --allow-read
    return JSON.parse(text);
  } catch (error) {
    console.error("Could not load api_keys.json:", error);
    return { keys: [] }; // fail closed: no keys loaded means nobody gets in
  }
}

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

/** Build a JSON response with the right Content-Type header. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Pull the API key out of the request. Two styles are accepted:
 *   X-API-Key: sk-123...
 *   Authorization: Bearer sk-123...
 */
function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get("X-API-Key");
  if (headerKey) return headerKey;

  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);

  return null;
}

// ---------------------------------------------------------------------------
// 4. Authentication: is the sent key in our file and still active?
// ---------------------------------------------------------------------------

async function authenticate(request: Request): Promise<string | null> {
  const apiKey = getApiKey(request);
  if (!apiKey) {
    return "API key is required. Send it in the X-API-Key header or as Authorization: Bearer <key>.";
  }

  const { keys } = await loadApiKeys();
  const found = keys.some((k) => k.key === apiKey && k.active);
  if (!found) return "Invalid or inactive API key.";

  return null; // null means no error, so the request is allowed
}

// ---------------------------------------------------------------------------
// 5. Endpoint handlers
// ---------------------------------------------------------------------------

async function helloHandler(request: Request): Promise<Response> {
  const error = await authenticate(request);
  if (error) return json({ error }, 401); // 401 Unauthorized

  return json({
    message: "Hello World! Sirine created an API endpoint using Deno",
    timestamp: new Date().toISOString(),
    success: true,
  });
}

// ---------------------------------------------------------------------------
// 6. Router: Deno calls this once for every incoming request.
// ---------------------------------------------------------------------------

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/hello") {
    return await helloHandler(request);
  }

  return json({ error: "Endpoint not found. Available endpoint: GET /hello" }, 404);
}

// ---------------------------------------------------------------------------
// 7. Start the server (only when this file is run directly, not imported).
// ---------------------------------------------------------------------------

if (import.meta.main) {
  console.log("Server running at http://localhost:8000");
  console.log("Try: curl http://localhost:8000/hello -H \"X-API-Key: sk-1234567890abcdef\"");
  Deno.serve({ port: 8000 }, handler); // needs --allow-net
}
