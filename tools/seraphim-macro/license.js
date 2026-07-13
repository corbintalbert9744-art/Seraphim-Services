import { createHmac, randomBytes } from "node:crypto";

export const LICENSE_SECRET = "seraphim-macros-v2-secret-key";
export const PRODUCT_ID = "keyboard-macro";

const KEY_PATTERN = /^SRPH-([A-F0-9]{6})-([A-F0-9]{6})-([A-F0-9]{6})-([A-F0-9]{6})$/i;
const EPOCH = new Date("2020-01-01T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function expiryToPart(expiresAt) {
  if (!expiresAt) return "000000";
  const days = Math.floor((new Date(expiresAt).getTime() - EPOCH.getTime()) / DAY_MS);
  if (days <= 0 || days > 0xffffff) return "000000";
  return days.toString(16).toUpperCase().padStart(6, "0");
}

function partToExpiry(part) {
  const days = parseInt(part, 16);
  if (!days) return null;
  return new Date(EPOCH.getTime() + days * DAY_MS).toISOString();
}

function buildPart2(maxDevices) {
  const deviceHex = Math.min(15, Math.max(1, maxDevices)).toString(16).toUpperCase();
  const random = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `${deviceHex}${random}`.padEnd(6, "0").slice(0, 6);
}

function readMaxDevices(part2) {
  return parseInt(part2.charAt(0), 16) || 1;
}

function sign(part1, part2) {
  return createHmac("sha256", LICENSE_SECRET)
    .update(`${part1}${part2}`)
    .digest("hex")
    .toUpperCase();
}

export function generateLicenseKey({ maxDevices = 1, expiresAt = null } = {}) {
  const part1 = expiryToPart(expiresAt);
  const part2 = buildPart2(maxDevices);
  const sig = sign(part1, part2);

  return {
    licenseKey: `SRPH-${part1}-${part2}-${sig.slice(0, 6)}-${sig.slice(6, 12)}`,
    product: PRODUCT_ID,
    maxDevices,
    expiresAt,
  };
}

export function validateLicenseKey(key) {
  const normalized = String(key || "").trim().toUpperCase();
  const match = normalized.match(KEY_PATTERN);

  if (!match) {
    return { valid: false, reason: "Invalid key format" };
  }

  const [, part1, part2, part3, part4] = match;
  const sig = sign(part1, part2);

  if (part3 !== sig.slice(0, 6) || part4 !== sig.slice(6, 12)) {
    return { valid: false, reason: "Key signature mismatch" };
  }

  const expiresAt = partToExpiry(part1);
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
    return { valid: false, reason: "Key expired", expiresAt };
  }

  return {
    valid: true,
    product: PRODUCT_ID,
    maxDevices: readMaxDevices(part2),
    expiresAt,
  };
}
