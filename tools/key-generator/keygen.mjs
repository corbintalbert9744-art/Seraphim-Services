import {
  generateLicenseKey as signLicenseKey,
  validateLicenseKey,
  LICENSE_SECRET,
  PRODUCT_ID as LICENSE_PRODUCT_ID,
} from "./license.mjs";

export const SERAPHIM_SECRET = LICENSE_SECRET;
export const PRODUCT_ID = LICENSE_PRODUCT_ID;

export const PRODUCTS = [
  { id: PRODUCT_ID, label: "Keyboard Macro" },
];

export const MAX_DEVICE_OPTIONS = [1, 2, 3, 5, 10];

export const DURATION_OPTIONS = [
  { id: "lifetime", label: "Lifetime", days: null },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
  { id: "365d", label: "1 Year", days: 365 },
];

export { validateLicenseKey };

export function getExpiryDate(durationId, createdAt = new Date()) {
  const option = DURATION_OPTIONS.find((d) => d.id === durationId);
  if (!option?.days) return null;

  const expires = new Date(createdAt);
  expires.setDate(expires.getDate() + option.days);
  return expires.toISOString();
}

export function generateLicenseKey({
  product = PRODUCT_ID,
  maxDevices = 1,
  expiresAt = null,
  note = "",
} = {}) {
  if (product !== PRODUCT_ID) {
    throw new Error(`Unsupported product: ${product}`);
  }

  void note;
  return signLicenseKey({ maxDevices, expiresAt }).licenseKey;
}
