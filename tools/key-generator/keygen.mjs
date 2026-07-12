export const SERAPHIM_SECRET = "seraphim-macros-v2-secret-key";

export function toKeyChars(hex) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 20; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    out += alphabet[byte % alphabet.length];
  }
  return out.match(/.{1,5}/g).join("-");
}

export async function generateLicenseKey(userId) {
  const normalized = userId.trim().toUpperCase();
  if (!normalized) {
    throw new Error("User ID is required.");
  }

  const data = new TextEncoder().encode(`${SERAPHIM_SECRET}:${normalized}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return toKeyChars(hex);
}
