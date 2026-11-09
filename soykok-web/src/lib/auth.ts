/**
 * Oturum yardımcıları — Keycloak + backend (BFF).
 *
 * Giriş ve kayıt Keycloak'ın sayfasında yapılır; şifre bu siteye hiç gelmez.
 * Oturum, backend'in verdiği HttpOnly "soykok.session" çerezinde tutulur
 * (JavaScript token'ı göremez). Kullanıcı bilgisi:
 *   - tarayıcıda: hooks/useUser.ts (TanStack Query)
 *   - sunucuda:   lib/auth-server.ts → getCurrentUser()
 */

import type { ApiUser, AuthUserResponse, User } from './types';

export const normalizeEmail = (email: unknown) => String(email ?? '').trim().toLocaleLowerCase('tr-TR');

/** API cevabını sitenin kullandığı biçime çevirir */
export function toUser(u: ApiUser): User {
  const email = normalizeEmail(u.email ?? u.username);
  return {
    id: u.id ?? null,
    email,
    firstName: u.firstName || u.name || email.split('@')[0],
    lastName: u.lastName ?? '',
    roles: u.roles ?? [],
  };
}

export const userFromResponse = (res: AuthUserResponse): User | null => (res.authenticated ? toUser(res.user) : null);

export const isAdmin = (user: User | null | undefined) => Boolean(user?.roles.includes('admin'));

/** Yalnızca site içi adres (açık yönlendirme açığını önler; backend de aynı kontrolü yapar) */
const safe = (next: string) => (next.startsWith('/') && !next.startsWith('//') ? next : '/');

const here = () => (typeof window === 'undefined' ? '/' : location.pathname + location.search);

/** Keycloak giriş sayfası; girişten sonra `next` adresine dönülür */
export const loginUrl = (next = here()) => `/api/auth/login?returnUrl=${encodeURIComponent(safe(next))}`;

/** Keycloak kayıt sayfası; kayıttan sonra `next` adresine dönülür */
export const registerUrl = (next = here()) => `/api/auth/register?returnUrl=${encodeURIComponent(safe(next))}`;

/** Sitedeki ve Keycloak'taki oturumu kapatır, sonra `next` adresine döner */
export const logoutUrl = (next = '/') => `/api/auth/logout?returnUrl=${encodeURIComponent(safe(next))}`;
