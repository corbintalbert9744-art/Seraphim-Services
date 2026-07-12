import { randomBytes, createHash } from "node:crypto";

export const SERAPHIM_SECRET = "seraphim-macros-v2-secret-key";

export const PRODUCTS = [
  { id: "seraphim-tweaks", label: "Seraphim Tweaks" },
  { id: "fps-boost", label: "FPS Boost" },
  { id: "bloom-reducer", label: "Bloom Reducer" },
  { id: "zero-delay", label: "Zero Delay" },
  { id: "keyboard-macro", label: "Keyboard Macro" },
];

export const MAX_DEVICE_OPTIONS = [1, 2, 3, 5, 10];

export const DURATION_OPTIONS = [
  { id: "lifetime", label: "Lifetime", days: null },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
  { id: "365d", label: "1 Year", days: 365 },
];

function randomHex(length) {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
}

export function generateLicenseKey({ product, note = "" } = {}) {
  const entropy = createHash("sha256")
    .update(`${SERAPHIM_SECRET}:${product}:${note}:${Date.now()}:${randomBytes(16).toString("hex")}`)
    .digest("hex");

  const segments = [
    entropy.slice(0, 6),
    entropy.slice(6, 12),
    entropy.slice(12, 18),
    entropy.slice(18, 24),
  ].map((s) => s.toUpperCase());

  return `SRPH-${segments.join("-")}`;
}

export function getExpiryDate(durationId, createdAt = new Date()) {
  const option = DURATION_OPTIONS.find((d) => d.id === durationId);
  if (!option?.days) return null;

  const expires = new Date(createdAt);
  expires.setDate(expires.getDate() + option.days);
  return expires.toISOString();
}
