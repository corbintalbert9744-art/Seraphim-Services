import assert from "node:assert/strict";
import { generateLicenseKey, validateLicenseKey } from "./license.mjs";
import { generateLicenseKey as keygenGenerate, getExpiryDate } from "./keygen.mjs";
import { setDataDirectory, createKey, findKeyByLicense, deleteKey } from "./storage.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${err.message}`);
  }
}

console.log("license tests");

test("lifetime key validates", () => {
  const { licenseKey, maxDevices } = generateLicenseKey({ maxDevices: 3 });
  const result = validateLicenseKey(licenseKey);
  assert.equal(result.valid, true);
  assert.equal(result.maxDevices, 3);
  assert.equal(result.expiresAt, null);
});

test("keygen wrapper produces valid signed keys", () => {
  const expiresAt = getExpiryDate("30d");
  const licenseKey = keygenGenerate({ maxDevices: 5, expiresAt });
  const result = validateLicenseKey(licenseKey);
  assert.equal(result.valid, true);
  assert.equal(result.maxDevices, 5);
  assert.ok(result.expiresAt);
});

test("tampered signature is rejected", () => {
  const { licenseKey } = generateLicenseKey();
  const tampered = licenseKey.replace(/.$/, licenseKey.endsWith("A") ? "B" : "A");
  const result = validateLicenseKey(tampered);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "Key signature mismatch");
});

test("invalid format is rejected", () => {
  const result = validateLicenseKey("NOT-A-REAL-KEY");
  assert.equal(result.valid, false);
  assert.equal(result.reason, "Invalid key format");
});

test("expired key is rejected", () => {
  const past = new Date("2020-01-11T00:00:00.000Z").toISOString();
  const { licenseKey } = generateLicenseKey({ expiresAt: past });
  const result = validateLicenseKey(licenseKey);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "Key expired");
});

test("keys are case-insensitive", () => {
  const { licenseKey } = generateLicenseKey();
  const result = validateLicenseKey(licenseKey.toLowerCase());
  assert.equal(result.valid, true);
});

await testAsync("storage roundtrip keeps key searchable", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "seraphim-license-"));
  setDataDirectory(tempDir);

  const licenseKey = keygenGenerate({ maxDevices: 2, expiresAt: null, note: "test-user" });
  const record = await createKey({
    licenseKey,
    product: "keyboard-macro",
    maxDevices: 2,
    duration: "lifetime",
    note: "test-user",
    expiresAt: null,
  });

  const found = await findKeyByLicense(licenseKey);
  assert.ok(found);
  assert.equal(found.id, record.id);

  await deleteKey(record.id);
  await rm(tempDir, { recursive: true, force: true });
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
