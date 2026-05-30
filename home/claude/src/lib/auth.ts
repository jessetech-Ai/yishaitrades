export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  provider: "email" | "google-demo";
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  displayName: string;
  provider: AuthUser["provider"];
  accessToken: string;
}

const USERS_KEY = "yishaiedge_auth_users_v1";
const SESSION_KEY = "yishaiedge_auth_session_v1";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Local-only hash for the static demo. Production should use bcrypt/Argon2 on a server.
const hashPassword = (password: string) => {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) hash = (hash * 33) ^ password.charCodeAt(i);
  return `local_${(hash >>> 0).toString(16)}`;
};

const readUsers = (): AuthUser[] => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as AuthUser[]; }
  catch { return []; }
};

const writeUsers = (users: AuthUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const createSession = (user: AuthUser): AuthSession => {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    provider: user.provider,
    accessToken: `local.${user.id}.${Date.now()}`,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getAuthSession = (): AuthSession | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null; }
  catch { return null; }
};

export const register = (email: string, password: string, displayName: string): AuthSession => {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const users = readUsers();
  if (users.some((u) => u.email === cleanEmail)) throw new Error("An account with this email already exists.");
  const now = new Date().toISOString();
  const user: AuthUser = {
    id: uid(),
    email: cleanEmail,
    passwordHash: hashPassword(password),
    displayName: displayName.trim() || cleanEmail.split("@")[0],
    provider: "email",
    createdAt: now,
    updatedAt: now,
  };
  writeUsers([...users, user]);
  return createSession(user);
};

export const login = (email: string, password: string): AuthSession => {
  const cleanEmail = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === cleanEmail);
  if (!user || user.passwordHash !== hashPassword(password)) throw new Error("Invalid email or password.");
  return createSession(user);
};

export const googleDemoLogin = (): AuthSession => {
  const users = readUsers();
  const email = "google.trader@yishaiedge.local";
  let user = users.find((u) => u.email === email);
  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: uid(),
      email,
      passwordHash: "oauth",
      displayName: "Google Trader",
      provider: "google-demo",
      createdAt: now,
      updatedAt: now,
    };
    writeUsers([...users, user]);
  }
  return createSession(user);
};

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

const decodeJwtPayload = (credential: string): GoogleJwtPayload => {
  const payload = credential.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json) as GoogleJwtPayload;
};

export const googleCredentialLogin = (credential: string): AuthSession => {
  const payload = decodeJwtPayload(credential);
  if (!payload.email || !payload.sub) throw new Error("Google credential is missing required identity fields.");
  const users = readUsers();
  let user = users.find((u) => u.email === payload.email.toLowerCase());
  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: `google_${payload.sub}`,
      email: payload.email.toLowerCase(),
      passwordHash: "oauth",
      displayName: payload.name || payload.email.split("@")[0],
      provider: "google-demo",
      createdAt: now,
      updatedAt: now,
    };
    writeUsers([...users, user]);
  }
  return createSession(user);
};

export const updateCurrentAuthUser = (patch: { email?: string; password?: string; displayName?: string }): AuthSession | null => {
  const session = getAuthSession();
  if (!session) return null;
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === session.userId);
  if (idx === -1) return session;
  if (patch.email) {
    const cleanEmail = patch.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("Enter a valid email address.");
    if (users.some((u) => u.id !== session.userId && u.email === cleanEmail)) throw new Error("That email is already in use.");
    users[idx].email = cleanEmail;
  }
  if (patch.password) {
    if (patch.password.length < 8) throw new Error("Password must be at least 8 characters.");
    users[idx].passwordHash = hashPassword(patch.password);
    users[idx].provider = "email";
  }
  if (patch.displayName) users[idx].displayName = patch.displayName;
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return createSession(users[idx]);
};

export const logout = () => localStorage.removeItem(SESSION_KEY);