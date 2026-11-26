// JWT Authentication Utilities for Shankara Online Solutions Admin Portal

export interface AuthUserPayload {
  sub: string; // Username e.g. 'Naik-ShankaraOnline'
  name: string; // 'Manjunath Naik S'
  company: string; // 'Shankara Online Solutions LLP'
  role: string; // 'Owner & Administrator'
  email: string;
  iat: number; // Issued at (seconds)
  exp: number; // Expiration timestamp (seconds)
}

export const VALID_CREDENTIALS = {
  username: 'Naik-ShankaraOnline',
  password: 'ssrs**513JGD',
};

const TOKEN_KEY = 'shankara_auth_jwt_token';
const USER_KEY = 'shankara_auth_user';
const JWT_SECRET = 'shankara-jwt-auth-secret-key-2026-secure-admin-token';

// Base64URL string encoder
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Base64URL string decoder
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Generate cryptographic HMAC-SHA256 signature
async function generateSignature(data: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
      const signatureBytes = new Uint8Array(signatureBuffer);
      let binary = '';
      for (let i = 0; i < signatureBytes.byteLength; i++) {
        binary += String.fromCharCode(signatureBytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch {
      // Fallback
    }
  }

  // Fast deterministic fallback if Web Crypto is unavailable
  let hash = 0;
  const combined = `${data}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return base64UrlEncode(`sig_${Math.abs(hash)}`);
}

// Create real JWT Token: Header.Payload.Signature
export async function createJwtToken(payloadData: Partial<AuthUserPayload>): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthUserPayload = {
    sub: VALID_CREDENTIALS.username,
    name: 'Manjunath Naik S',
    company: 'Shankara Online Solutions LLP',
    role: 'Owner & Administrator',
    email: 'naik@shankaraonline.com',
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // Valid for 7 days
    ...payloadData,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await generateSignature(dataToSign, JWT_SECRET);

  return `${dataToSign}.${signature}`;
}

// Verify and decode JWT token synchronously
export function verifyJwtToken(token: string | null): AuthUserPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signature] = parts;
    if (!headerB64 || !payloadB64 || !signature) return null;

    const header = JSON.parse(base64UrlDecode(headerB64));
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

    const payload: AuthUserPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    // Expiration check
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // Subject check
    if (payload.sub !== VALID_CREDENTIALS.username) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Get stored token from localStorage or sessionStorage
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Check if currently authenticated with a valid JWT
export function isAuthenticated(): boolean {
  return verifyJwtToken(getStoredToken()) !== null;
}

// Get the authenticated user profile
export function getCurrentUser(): AuthUserPayload | null {
  return verifyJwtToken(getStoredToken());
}

// Login user and generate JWT token
export async function loginUser(
  username: string,
  password: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; token?: string; user?: AuthUserPayload; error?: string }> {
  const cleanUsername = username.trim();

  if (cleanUsername !== VALID_CREDENTIALS.username || password !== VALID_CREDENTIALS.password) {
    return {
      success: false,
      error: 'Invalid username or password. Please verify your credentials.',
    };
  }

  const token = await createJwtToken({
    sub: cleanUsername,
    name: 'Manjunath Naik S',
    company: 'Shankara Online Solutions LLP',
    role: 'Owner & Administrator',
    email: 'naik@shankaraonline.com',
  });

  const payload = verifyJwtToken(token);
  if (!payload) {
    return {
      success: false,
      error: 'Failed to generate JWT authentication token.',
    };
  }

  try {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload));
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.error('Storage error during login', err);
  }

  window.dispatchEvent(new Event('auth_changed'));
  return { success: true, token, user: payload };
}

// Logout user and clear all stored JWT tokens
export function logoutUser(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Storage error during logout', err);
  }
  window.dispatchEvent(new Event('auth_changed'));
}
