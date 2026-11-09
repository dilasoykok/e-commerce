/**
 * Üye oturumu — Keycloak + backend.
 *
 * Giriş ve kayıt Keycloak'ın sayfasında yapılır; şifre bu siteye hiç gelmez.
 * Oturum, backend'in verdiği HttpOnly çerezde tutulur (JavaScript token'ı göremez).
 * Burada yalnızca ekranda göstermek için kullanıcının adı/e-postası sekme boyunca
 * önbelleğe alınır; doğru bilgi her sayfada GET /api/auth/user ile tazelenir.
 *
 *   getUser()   → önbellekteki kullanıcı (anında, eski olabilir) ya da null
 *   loadUser()  → sunucudan güncel kullanıcı (Promise)
 *   loginUrl() / registerUrl() / signOut()
 */

const CACHE_KEY = 'soykok-user';
const LEGACY_KEYS = ['soykok-session', 'soykok-profiles']; // eski demo oturumu

const normalizeEmail = (email) => String(email ?? '').trim().toLocaleLowerCase('tr-TR');

function readCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY)) ?? null;
  } catch {
    return null;
  }
}

function writeCache(user) {
  try {
    if (user) sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

function clearLegacy() {
  try {
    LEGACY_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    /* yok say */
  }
}

/** API cevabını sitenin kullandığı biçime çevirir */
function toUser(u) {
  const email = normalizeEmail(u.email ?? u.username);
  return {
    id: u.id ?? null,
    email,
    firstName: u.firstName || u.name || email.split('@')[0],
    lastName: u.lastName ?? '',
    roles: u.roles ?? [],
  };
}

export function getUser() {
  return readCache();
}

export const isLoggedIn = () => Boolean(getUser());

export const isAdmin = (user = getUser()) => Boolean(user?.roles?.includes('admin'));

let pending = null;

/** Oturumu sunucudan bir kez sorar; aynı sayfadaki sonraki çağrılar aynı sonucu bekler. */
export function loadUser() {
  pending ??= (async () => {
    clearLegacy();
    try {
      const res = await fetch('/api/auth/user', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const user = data.authenticated ? toUser(data.user) : null;
      writeCache(user);
      return user;
    } catch (err) {
      console.warn('[session] Oturum bilgisi alınamadı.', err);
      return readCache();
    }
  })();
  return pending;
}

const here = () => location.pathname + location.search;

/** Keycloak giriş sayfası; girişten sonra `next` adresine dönülür */
export const loginUrl = (next = here()) => `/api/auth/login?returnUrl=${encodeURIComponent(next)}`;

/** Keycloak kayıt sayfası; kayıttan sonra `next` adresine dönülür */
export const registerUrl = (next = here()) => `/api/auth/register?returnUrl=${encodeURIComponent(next)}`;

/** Sitedeki ve Keycloak'taki oturumu kapatır, sonra `next` adresine döner */
export function signOut(next = '/') {
  writeCache(null);
  location.assign(`/api/auth/logout?returnUrl=${encodeURIComponent(next)}`);
}

export { normalizeEmail };
