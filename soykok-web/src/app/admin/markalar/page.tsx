import type { Metadata } from 'next';
import AdminBrands from '@/components/admin/AdminBrands';

export const metadata: Metadata = { title: 'Markalar — Yönetim' };

export default function AdminBrandsPage() {
  return <AdminBrands />;
}
