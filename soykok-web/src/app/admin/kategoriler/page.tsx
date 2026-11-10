import type { Metadata } from 'next';
import AdminCategories from '@/components/admin/AdminCategories';

export const metadata: Metadata = { title: 'Kategoriler — Yönetim' };

export default function AdminCategoriesPage() {
  return <AdminCategories />;
}
