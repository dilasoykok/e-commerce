/**
 * Üye oturumu (geçici / demo).
 *
 * Backend gelene kadar giriş yapan üyenin yalnızca adı ve e-postası
 * tarayıcıda tutulur. ŞİFRE HİÇBİR YERDE SAKLANMAZ.
 *
 * Backend hazır olunca:
 *   - Oturum, sunucunun verdiği HttpOnly çerezle tutulur
 *   - getUser() → GET /api/me ile doldurulur
 *   - signOut() → POST /api/auth/logout
 */

const SESSION_KEY = 'soykok-session';
const PROFILES_KEY = 'soykok-profiles'; // demo: kayıt olanların adı (şifre yok)

const read = (store, key, fallback) => {
  try {
    return JSON.parse(store.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (store, key, value) => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
};

const normalizeEmail = (email) => String(email).trim().toLocaleLowerCase('tr-TR');

export function getUser() {
  return read(localStorage, SESSION_KEY, null) ?? read(sessionStorage, SESSION_KEY, null);
}

export const isLoggedIn = () => Boolean(getUser());

/** Kayıtta adı-soyadı hatırla ki girişte "Merhaba Ayşe" diyebilelim */
export function saveProfile({ firstName, lastName, email }) {
  const profiles = read(localStorage, PROFILES_KEY, {});
  profiles[normalizeEmail(email)] = { firstName, lastName };
  write(localStorage, PROFILES_KEY, profiles);
}

/** remember=false ise oturum sekme kapanınca biter */
export function signIn(email, { remember = true } = {}) {
  const key = normalizeEmail(email);
  const profile = read(localStorage, PROFILES_KEY, {})[key];
  const user = {
    email: key,
    firstName: profile?.firstName || key.split('@')[0],
    lastName: profile?.lastName || '',
  };
  signOut();
  write(remember ? localStorage : sessionStorage, SESSION_KEY, user);
  return user;
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* yok say */
  }
}

export { normalizeEmail };
