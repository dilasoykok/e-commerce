import type { Metadata } from 'next';
import AdminProducts from '@/components/admin/AdminProducts';

export const metadata: Metadata = { title: 'Ürünler — Yönetim' };

export default function AdminProductsPage() {
  return <AdminProducts />;
}
