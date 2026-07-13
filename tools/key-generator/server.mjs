import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateLicenseKey,
  validateLicenseKey,
  getExpiryDate,
  PRODUCTS,
  MAX_DEVICE_OPTIONS,
  DURATION_OPTIONS,
} from "./keygen.mjs";
import {
  listKeys,
  createKey,
  deleteKey,
  updateKey,
  getStats,
  findKeyByLicense,
} from "./storage.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/meta") {
    return json(res, 200, { products: PRODUCTS, maxDevices: MAX_DEVICE_OPTIONS, durations: DURATION_OPTIONS });
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    return json(res, 200, await getStats());
  }

  if (req.method === "GET" && url.pathname === "/api/keys") {
    const product = url.searchParams.get("product") || "all";
    return json(res, 200, await listKeys(product));
  }

  if (req.method === "POST" && url.pathname === "/api/keys") {
    const body = await readBody(req);
    const product = body.product || "keyboard-macro";
    const maxDevices = Number(body.maxDevices) || 1;
    const duration = body.duration || "lifetime";
    const note = (body.note || "").trim();

    const createdAt = new Date();
    const expiresAt = getExpiryDate(duration, createdAt);
    const record = await createKey({
      licenseKey: generateLicenseKey({ product, maxDevices, expiresAt, note }),
      product,
      maxDevices,
      duration,
      note,
      expiresAt,
    });

    return json(res, 201, record);
  }

  if (req.method === "POST" && url.pathname === "/api/validate") {
    const body = await readBody(req);
    const key = String(body.key || body.licenseKey || "").trim();
    const result = validateLicenseKey(key);
    return json(res, 200, result);
  }

  if (req.method === "POST" && url.pathname === "/api/activate") {
    const body = await readBody(req);
    const key = String(body.key || body.licenseKey || "").trim();
    const validation = validateLicenseKey(key);

    if (!validation.valid) {
      return json(res, 403, validation);
    }

    const record = await findKeyByLicense(key);
    if (!record) {
      return json(res, 200, {
        ...validation,
        activated: true,
        managed: false,
      });
    }

    if (record.status !== "active") {
      return json(res, 403, { valid: false, reason: "Key revoked" });
    }

    const devicesUsed = record.devicesUsed || 0;
    if (devicesUsed >= validation.maxDevices) {
      return json(res, 403, {
        valid: false,
        reason: "Device limit reached",
        maxDevices: validation.maxDevices,
        devicesUsed,
      });
    }

    const updated = await updateKey(record.id, {
      devicesUsed: devicesUsed + 1,
      lastUsedAt: new Date().toISOString(),
    });

    return json(res, 200, {
      ...validation,
      activated: true,
      managed: true,
      devicesUsed: updated.devicesUsed,
      maxDevices: validation.maxDevices,
    });
  }

  const deleteMatch = url.pathname.match(/^\/api\/keys\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const removed = await deleteKey(deleteMatch[1]);
    return removed ? json(res, 200, { ok: true }) : json(res, 404, { error: "Key not found" });
  }

  const patchMatch = url.pathname.match(/^\/api\/keys\/([^/]+)$/);
  if (req.method === "PATCH" && patchMatch) {
    const body = await readBody(req);
    const updated = await updateKey(patchMatch[1], body);
    return updated ? json(res, 200, updated) : json(res, 404, { error: "Key not found" });
  }

  return false;
}

function createAppServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (handled !== false) return;
      return json(res, 404, { error: "Not found" });
    }

    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(__dirname, path.replace(/^\//, ""));

    try {
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "text/plain" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });
}

export function startServer(port = 0) {
  const server = createAppServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: typeof address === "object" ? address.port : port });
    });
  });
}

const isDirectRun = process.argv[1]?.endsWith("server.mjs");

if (isDirectRun) {
  const port = Number(process.env.PORT || 5179);
  startServer(port).then(({ port: actualPort }) => {
    console.log(`Seraphim Admin Panel running at http://localhost:${actualPort}`);
  });
}
