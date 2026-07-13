import assert from "node:assert/strict";
import { generateLicenseKey, validateLicenseKey } from "./license.js";

const { licenseKey } = generateLicenseKey({ maxDevices: 2 });
const result = validateLicenseKey(licenseKey);

assert.equal(result.valid, true);
assert.equal(result.maxDevices, 2);
console.log("seraphim-macro license test passed:", licenseKey);
