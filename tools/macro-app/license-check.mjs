import {
  generateLicenseKey,
  validateLicenseKey,
  LICENSE_SECRET,
  PRODUCT_ID,
} from "./license.mjs";

export { generateLicenseKey, validateLicenseKey, LICENSE_SECRET, PRODUCT_ID };

/**
 * Copy license.mjs and license-check.mjs into your Seraphim Macros app folder
 * (same directory as main.js).
 *
 * Usage in main.js:
 *   import { validateLicenseKey } from "./license-check.mjs";
 *
 *   const result = validateLicenseKey(userEnteredKey);
 *   if (!result.valid) {
 *     dialog.showErrorBox("Invalid License", result.reason);
 *     app.quit();
 *   }
 */

export function isLicensed(key) {
  return validateLicenseKey(key).valid;
}

export function getLicenseInfo(key) {
  return validateLicenseKey(key);
}
