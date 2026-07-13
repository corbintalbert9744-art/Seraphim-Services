#!/usr/bin/env node
/**
 * Copies license files into an extracted Seraphim Macro app folder and
 * patches main.js to use offline signed key validation.
 *
 * Usage:
 *   node apply-license.mjs "C:/path/to/Seraphim-Macro-v1.0.3"
 */

import { copyFile, readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LICENSE_IMPORT = `import { validateLicenseKey } from "./license-check.mjs";`;

const LICENSE_CHECK_BLOCK = `
// --- Seraphim signed license check (added by apply-license.mjs) ---
function assertValidLicenseKey(key) {
  const result = validateLicenseKey(String(key || "").trim());
  if (!result.valid) {
    const message = result.reason || "Invalid license key";
    if (typeof dialog !== "undefined" && dialog?.showErrorBox) {
      dialog.showErrorBox("Invalid License", message);
    }
    throw new Error(message);
  }
  return result;
}
// --- end signed license check ---
`;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findMainJs(root) {
  const candidates = [
    join(root, "main.js"),
    join(root, "resources", "app", "main.js"),
    join(root, "resources", "app.asar.unpacked", "main.js"),
  ];

  for (const path of candidates) {
    if (await exists(path)) return path;
  }

  return null;
}

function patchMainJs(source) {
  if (source.includes("validateLicenseKey")) {
    return { content: source, changed: false, reason: "already patched" };
  }

  let content = source;
  let changed = false;

  if (!content.includes(LICENSE_IMPORT)) {
    if (/^\s*import\s+/m.test(content)) {
      content = `${LICENSE_IMPORT}\n${content}`;
    } else if (/require\s*\(\s*['"]electron['"]\s*\)/.test(content)) {
      content = `const { validateLicenseKey } = require("./license-check.cjs");\n${content}`;
    } else {
      content = `${LICENSE_IMPORT}\n${content}`;
    }
    changed = true;
  }

  if (!content.includes("assertValidLicenseKey")) {
    const electronImport = content.match(/^(import\s+.+\s+from\s+['"]electron['"];?\s*\n)/m);
    if (electronImport) {
      const insertAt = electronImport.index + electronImport[0].length;
      content = `${content.slice(0, insertAt)}${LICENSE_CHECK_BLOCK}${content.slice(insertAt)}`;
    } else {
      content = `${LICENSE_CHECK_BLOCK}\n${content}`;
    }
    changed = true;
  }

  const patterns = [
    /(licenseKey\s*=\s*[^;\n]+;)/g,
    /(const\s+license\s*=\s*[^;\n]+;)/g,
    /(let\s+licenseKey\s*=\s*[^;\n]+;)/g,
    /(function\s+checkLicense\s*\([^)]*\)\s*\{)/g,
    /(async\s+function\s+validateLicense\s*\([^)]*\)\s*\{)/g,
  ];

  for (const pattern of patterns) {
    if (pattern.test(content) && !content.includes("assertValidLicenseKey(licenseKey)")) {
      content = content.replace(pattern, (match) => `${match}\n  assertValidLicenseKey(licenseKey);`);
      changed = true;
      break;
    }
  }

  if (!content.includes("assertValidLicenseKey(licenseKey)") && !content.includes("assertValidLicenseKey(license)")) {
    const appReady = content.match(/(app\.whenReady\(\)\.then\(\s*(?:async\s*)?\(\)\s*=>\s*\{)/);
    if (appReady) {
      content = content.replace(
        appReady[0],
        `${appReady[0]}\n  const storedKey = process.env.SERAPHIM_LICENSE || "";\n  if (storedKey) assertValidLicenseKey(storedKey);`
      );
      changed = true;
    }
  }

  return { content, changed, reason: changed ? "patched" : "copied license files only" };
}

async function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("Missing path to extracted Seraphim Macro folder.");
    process.exit(1);
  }

  const mainPath = await findMainJs(targetDir);
  if (!mainPath) {
    console.error(`Could not find main.js under: ${targetDir}`);
    console.error("Expected main.js at the folder root or in resources/app/");
    process.exit(1);
  }

  const macroDir = dirname(mainPath);
  await copyFile(join(__dirname, "license.mjs"), join(macroDir, "license.mjs"));
  await copyFile(join(__dirname, "license-check.mjs"), join(macroDir, "license-check.mjs"));
  console.log(`Copied license.mjs and license-check.mjs -> ${macroDir}`);

  const original = await readFile(mainPath, "utf-8");
  const { content, changed, reason } = patchMainJs(original);

  if (changed) {
    await writeFile(mainPath, content, "utf-8");
    console.log(`Updated ${mainPath} (${reason})`);
  } else {
    console.log(`main.js unchanged (${reason}). License files are in place — add validation manually if needed.`);
  }

  console.log("\nNext: generate a key in Seraphim Keyboard Macro v1.2.0 admin panel and test activation.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
