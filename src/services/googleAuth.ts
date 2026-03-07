/**
 * Google OAuth Authentication Service
 * Handles user authentication, token management, and session persistence
 */

import { GOOGLE_SCOPES, STORAGE_KEYS } from '@/constants';
import type { AuthUser } from '@/types';

// Token response from Google OAuth
interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

// Decoded ID token payload
interface IDTokenPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

/**
 * Initialize Google OAuth
 */
export function initGoogleAuth(): void {
  // Load Google Identity Services script if not already loaded
  if (!document.getElementById('google-identity-script')) {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

/**
 * Get the OAuth consent URL
 */
export function getAuthUrl(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const scope = GOOGLE_SCOPES.join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: scope,
    include_granted_scopes: 'true',
    state: generateState(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Parse the OAuth callback hash
 */
export function parseAuthCallback(): TokenResponse | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (!accessToken || !expiresIn) return null;

  return {
    access_token: accessToken,
    expires_in: parseInt(expiresIn, 10),
    scope: params.get('scope') || '',
    token_type: params.get('token_type') || 'Bearer',
    id_token: params.get('id_token') || undefined,
  };
}

/**
 * Decode JWT token (ID token)
 */
function decodeJWT(token: string): IDTokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken: string): Promise<AuthUser | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      accessToken,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Save auth data to local storage
 */
export function saveAuthData(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, user.accessToken);

    // Set expiration time (typically 1 hour)
    const expiresAt = Date.now() + 3600 * 1000;
    localStorage.setItem('comptaclaude_token_expires_at', expiresAt.toString());
  } catch (error) {
    console.error('Failed to save auth data:', error);
  }
}

/**
 * Load auth data from local storage
 */
export function loadAuthData(): AuthUser | null {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const expiresAt = localStorage.getItem('comptaclaude_token_expires_at');

    if (!userStr || !token || !expiresAt) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= parseInt(expiresAt, 10)) {
      clearAuthData();
      return null;
    }

    const user = JSON.parse(userStr);
    return {
      ...user,
      accessToken: token,
    };
  } catch (error) {
    console.error('Failed to load auth data:', error);
    return null;
  }
}

/**
 * Clear auth data from local storage
 */
export function clearAuthData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('comptaclaude_token_expires_at');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = loadAuthData();
  return user !== null;
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  const user = loadAuthData();
  return user?.accessToken || null;
}

/**
 * Logout user
 */
export function logout(): void {
  clearAuthData();

  // Revoke token (optional but recommended)
  const token = getAccessToken();
  if (token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: 'POST',
    }).catch((error) => {
      console.error('Failed to revoke token:', error);
    });
  }
}

/**
 * Check token validity
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}
