import { generateLicenseKey, getExpiryDate } from "./keygen.mjs";
import { createKey } from "./storage.mjs";

const product = process.argv[2] || "keyboard-macro";
const maxDevices = Number(process.argv[3]) || 1;
const duration = process.argv[4] || "lifetime";
const note = process.argv[5] || "";

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

console.log(record.licenseKey);
