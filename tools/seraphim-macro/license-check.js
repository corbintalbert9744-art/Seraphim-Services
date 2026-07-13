import { validateLicenseKey } from "./license.js";

export { validateLicenseKey };

export function isLicensed(key) {
  return validateLicenseKey(key).valid;
}

export function getLicenseInfo(key) {
  return validateLicenseKey(key);
}
