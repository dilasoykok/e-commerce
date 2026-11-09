'use server';

import { updateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth-server';
import { isAdmin } from '@/lib/auth';
import { CATALOG_TAG } from '@/lib/catalog';

/**
 * Admin bir ürünü değiştirdikten sonra sunucudaki katalog önbelleğini temizler.
 * Herkesin önbelleği boşaltabilmesini engellemek için önce admin olduğu doğrulanır
 * (asıl yetki kontrolü yine backend'de yapılır).
 */
export async function revalidateCatalog(): Promise<void> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return;
  updateTag(CATALOG_TAG);
}
