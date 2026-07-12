import { createHash } from "node:crypto";
import { SERAPHIM_SECRET, toKeyChars } from "./keygen.mjs";

function generateLicenseKeyNode(userId) {
  const normalized = userId.trim().toUpperCase();
  if (!normalized) {
    throw new Error("User ID is required.");
  }

  const hex = createHash("sha256")
    .update(`${SERAPHIM_SECRET}:${normalized}`)
    .digest("hex");

  return toKeyChars(hex);
}

const userId = process.argv[2];
if (!userId) {
  console.log("Usage: node cli.mjs <USER_ID>");
  process.exit(1);
}

console.log(generateLicenseKeyNode(userId));
