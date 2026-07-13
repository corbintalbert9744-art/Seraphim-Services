import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function getLicensePath(userDataPath) {
  const dir = join(userDataPath, "seraphim-macro");
  await mkdir(dir, { recursive: true });
  return join(dir, "license.json");
}

export async function loadStoredLicense(userDataPath) {
  try {
    const raw = await readFile(await getLicensePath(userDataPath), "utf-8");
    const data = JSON.parse(raw);
    return String(data.licenseKey || "").trim();
  } catch {
    return "";
  }
}

export async function saveLicense(userDataPath, licenseKey) {
  const path = await getLicensePath(userDataPath);
  await writeFile(
    path,
    JSON.stringify(
      {
        licenseKey: String(licenseKey || "").trim(),
        savedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );
}
