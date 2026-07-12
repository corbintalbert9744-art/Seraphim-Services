import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

let DATA_DIR = join(__dirname, "data");
let DATA_FILE = join(DATA_DIR, "keys.json");

export function setDataDirectory(baseDir) {
  DATA_DIR = join(baseDir, "data");
  DATA_FILE = join(DATA_DIR, "keys.json");
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readKeys() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeKeys(keys) {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify(keys, null, 2), "utf-8");
}

export async function listKeys(productFilter = "all") {
  const keys = await readKeys();
  if (productFilter === "all") return keys;
  return keys.filter((k) => k.product === productFilter);
}

export async function createKey(entry) {
  const keys = await readKeys();
  const record = {
    id: randomUUID(),
    licenseKey: entry.licenseKey,
    product: entry.product,
    maxDevices: entry.maxDevices,
    duration: entry.duration,
    note: entry.note || "",
    user: entry.user || null,
    status: "active",
    devicesUsed: 0,
    createdAt: new Date().toISOString(),
    expiresAt: entry.expiresAt,
    lastUsedAt: null,
  };
  keys.unshift(record);
  await writeKeys(keys);
  return record;
}

export async function deleteKey(id) {
  const keys = await readKeys();
  const next = keys.filter((k) => k.id !== id);
  if (next.length === keys.length) return false;
  await writeKeys(next);
  return true;
}

export async function updateKey(id, patch) {
  const keys = await readKeys();
  const index = keys.findIndex((k) => k.id === id);
  if (index === -1) return null;

  keys[index] = { ...keys[index], ...patch };
  await writeKeys(keys);
  return keys[index];
}

export async function getStats() {
  const keys = await readKeys();
  return {
    total: keys.length,
    active: keys.filter((k) => k.status === "active").length,
    usedDevices: keys.reduce((sum, k) => sum + (k.devicesUsed || 0), 0),
  };
}
