import { UserProfile } from "../types";

const VAULT_USERS_KEY = "ik_supernote_secure_auth_vault";
const VAULT_SESSION_KEY = "ik_supernote_active_session";

export interface VaultUserRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  salt: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
  securityQuestion?: string;
}

/**
 * Generates a cryptographic SHA-256 salted hash using Web Crypto API.
 * Ensures user passwords are never stored in plaintext.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}::${password}::ik_supernote_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getVaultUsers(): Record<string, VaultUserRecord> {
  try {
    const raw = localStorage.getItem(VAULT_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVaultUsers(users: Record<string, VaultUserRecord>) {
  try {
    localStorage.setItem(VAULT_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save auth vault:", e);
  }
}

export function getActiveLocalSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(VAULT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveLocalSession(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(VAULT_SESSION_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(VAULT_SESSION_KEY);
    }
  } catch (e) {
    console.error("Failed to update active session:", e);
  }
}

export async function registerInSecureVault(
  email: string,
  password: string,
  displayName: string,
  existingUid?: string
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getVaultUsers();

  const salt = generateSalt();
  const passwordHash = await hashPasswordWithSalt(password, salt);
  const now = new Date().toISOString();
  const uid = existingUid || users[normalizedEmail]?.uid || `usr_${Date.now().toString(36)}_${salt.slice(0, 6)}`;

  const record: VaultUserRecord = {
    uid,
    email: normalizedEmail,
    displayName: displayName.trim(),
    photoURL: null,
    salt,
    passwordHash,
    createdAt: users[normalizedEmail]?.createdAt || now,
    lastLoginAt: now,
  };

  users[normalizedEmail] = record;
  saveVaultUsers(users);

  const profile: UserProfile = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
    photoURL: record.photoURL,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    notificationPreferences: {
      studyAlerts: true,
      syncUpdates: true,
      newContent: true,
      pushEnabled: true,
    },
  };

  setActiveLocalSession(profile);
  return profile;
}

export async function verifyInSecureVault(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getVaultUsers();
  const record = users[normalizedEmail];
  if (!record) return null;

  const computedHash = await hashPasswordWithSalt(password, record.salt);
  if (computedHash !== record.passwordHash) {
    throw new Error("INVALID_PASSWORD");
  }

  record.lastLoginAt = new Date().toISOString();
  users[normalizedEmail] = record;
  saveVaultUsers(users);

  const profile: UserProfile = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
    photoURL: record.photoURL,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    notificationPreferences: {
      studyAlerts: true,
      syncUpdates: true,
      newContent: true,
      pushEnabled: true,
    },
  };

  setActiveLocalSession(profile);
  return profile;
}

export async function resetPasswordInSecureVault(
  email: string,
  newPassword: string
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getVaultUsers();
  const record = users[normalizedEmail];
  if (!record) return false;

  const newSalt = generateSalt();
  const newHash = await hashPasswordWithSalt(newPassword, newSalt);
  record.salt = newSalt;
  record.passwordHash = newHash;
  users[normalizedEmail] = record;
  saveVaultUsers(users);
  return true;
}

export function checkEmailExistsInVault(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getVaultUsers();
  return Boolean(users[normalizedEmail]);
}
