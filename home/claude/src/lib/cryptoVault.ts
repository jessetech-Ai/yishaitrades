import type { AppState } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

const deriveKey = async (passphrase: string, salt: Uint8Array) => {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBuffer, iterations: 210_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptState = async (state: AppState, passphrase: string) => {
  if (!passphrase || passphrase.length < 8) throw new Error("Use a passphrase of at least 8 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBuffer }, key, encoder.encode(JSON.stringify(state)));
  return JSON.stringify({
    app: "YishaiEdge",
    version: 1,
    algorithm: "PBKDF2-SHA256/AES-256-GCM",
    iterations: 210_000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  }, null, 2);
};

export const decryptState = async (payload: string, passphrase: string): Promise<AppState> => {
  const parsed = JSON.parse(payload) as { salt: string; iv: string; data: string; app?: string };
  if (parsed.app !== "YishaiEdge") throw new Error("This is not a YishaiEdge encrypted backup.");
  const salt = base64ToBytes(parsed.salt);
  const iv = base64ToBytes(parsed.iv);
  const data = base64ToBytes(parsed.data);
  const key = await deriveKey(passphrase, salt);
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuffer }, key, dataBuffer);
  return JSON.parse(decoder.decode(plaintext)) as AppState;
};

export const downloadEncryptedBackup = async (state: AppState, passphrase: string) => {
  const encrypted = await encryptState(state, passphrase);
  const blob = new Blob([encrypted], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yishaiedge-encrypted-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};