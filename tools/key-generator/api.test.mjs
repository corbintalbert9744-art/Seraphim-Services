import assert from "node:assert/strict";
import { startServer } from "./server.mjs";
import { setDataDirectory } from "./storage.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempDir = await mkdtemp(join(tmpdir(), "seraphim-api-"));
setDataDirectory(tempDir);

const { server, port } = await startServer(0);
const base = `http://127.0.0.1:${port}`;

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

const created = await post("/api/keys", {
  product: "keyboard-macro",
  maxDevices: 2,
  duration: "lifetime",
  note: "api-test",
});

assert.equal(created.status, 201);
assert.match(created.data.licenseKey, /^SRPH-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}$/i);

const validated = await post("/api/validate", { key: created.data.licenseKey });
assert.equal(validated.status, 200);
assert.equal(validated.data.valid, true);
assert.equal(validated.data.maxDevices, 2);

const activated = await post("/api/activate", { key: created.data.licenseKey });
assert.equal(activated.status, 200);
assert.equal(activated.data.activated, true);
assert.equal(activated.data.devicesUsed, 1);

const bad = await post("/api/validate", { key: "SRPH-000000-100000-AAAAAA-BBBBBB" });
assert.equal(bad.data.valid, false);

server.close();
await rm(tempDir, { recursive: true, force: true });
console.log("api integration test passed");
