import 'server-only';

import { cookies } from 'next/headers';
import { api } from './api/endpoints';
import { userFromResponse } from './auth';
import type { User } from './types';

/**
 * Sunucuda (Server Component / Server Action) giriş yapmış kullanıcı.
 * Tarayıcının çerezini backend'e iletir. Çerez okuduğu için bunu kullanan
 * sayfa dinamik olur — yalnızca gerektiği yerde (admin, hesap) kullanın.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  try {
    return userFromResponse(await api.auth.user({ cookie }));
  } catch (err) {
    console.warn('[auth] Oturum bilgisi alınamadı.', err);
    return null;
  }
}
