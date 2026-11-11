import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight, LayoutDashboard, LogIn, LogOut, Package, User } from 'lucide-react';

import OrderCard from '@/components/orders/OrderCard';
import GuestTracking from '@/components/orders/GuestTracking';
import { getCurrentUser } from '@/lib/auth-server';
import { getMyOrders } from '@/lib/orders-server';
import { isAdmin, logoutUrl } from '@/lib/auth';

export const metadata: Metadata = { title: 'Siparişlerim', robots: { index: false } };

const SW = 1.75;

type Props = { searchParams: Promise<{ no?: string }> };

/**
 * Siparişler (eski siparislerim.html + orders.js).
 *   Üye     → GET /api/me/orders (sunucuda, oturum çereziyle)
 *   Misafir → sipariş numarası + e-posta ile takip (POST /api/orders/track)
 * ?no=SYK-... ile gelinirse o sipariş açık gösterilir / takip formu dolu gelir.
 */
export default async function OrdersPage({ searchParams }: Props) {
  const openNo = ((await searchParams).no ?? '').trim().toUpperCase();
  const user = await getCurrentUser();

  return (
    <div className="container-site py-6 lg:py-10">
      <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-900">
              Ana Sayfa
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" strokeWidth={SW} />
          </li>
          <li aria-current="page" className="font-medium text-brand-900">
            {user ? 'Siparişlerim' : 'Sipariş Takibi'}
          </li>
        </ol>
      </nav>

      {user ? <MemberView user={user} openNo={openNo} /> : <GuestView openNo={openNo} />}
    </div>
  );
}

async function MemberView({
  user,
  openNo,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  openNo: string;
}) {
  const { orders, error } = await getMyOrders();

  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Siparişlerim</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <User className="size-4" strokeWidth={SW} aria-hidden />
            Merhaba <strong className="text-brand-900">{user.firstName}</strong>, {user.email} hesabına ait siparişler.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin(user) && (
            <Link
              href="/admin/siparisler"
              className="inline-flex h-9 items-center gap-2 rounded border border-gray-300 px-4 text-xs font-medium hover:border-brand-900"
            >
              <LayoutDashboard className="size-4" strokeWidth={SW} aria-hidden /> Yönetim Paneli
            </Link>
          )}
          {/* Keycloak oturumu da kapatılır: tam sayfa yönlendirme */}
          <a
            href={logoutUrl('/')}
            className="inline-flex h-9 items-center gap-2 rounded border border-gray-300 px-4 text-xs font-medium hover:border-sale hover:text-sale"
          >
            <LogOut className="size-4" strokeWidth={SW} aria-hidden /> Çıkış Yap
          </a>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded border border-sale/30 bg-red-50 px-4 py-3 text-sm text-sale">
          Siparişleriniz şu an yüklenemedi: {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-md border border-dashed border-gray-300 px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-500">
            <Package className="size-7" strokeWidth={SW} aria-hidden />
          </span>
          <p className="mt-4 font-semibold">Henüz siparişiniz yok</p>
          <p className="mt-1 text-sm text-gray-500">Verdiğiniz siparişler burada listelenir.</p>
          <Link
            href="/urunler"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Alışverişe Başla <ArrowRight className="size-4" strokeWidth={SW} aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o, i) => (
            <li key={o.number}>
              <OrderCard order={o} open={openNo ? o.number === openNo : i === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GuestView({ openNo }: { openNo: string }) {
  return (
    <section className="mt-4">
      <h1 className="text-2xl font-bold">Sipariş Takibi</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sipariş numaranız ve siparişte kullandığınız e-posta ile siparişinizin durumunu görün.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <GuestTracking initialNumber={openNo} />

        <aside className="checkout-card">
          <span className="grid size-11 place-items-center rounded-lg bg-brand-900 text-white">
            <User className="size-5" strokeWidth={SW} aria-hidden />
          </span>
          <h2 className="mt-4 font-bold">Üye misiniz?</h2>
          <p className="mt-1 text-sm text-gray-600">Giriş yapın, tüm siparişlerinizi numara girmeden tek ekranda görün.</p>
          <Link
            href="/hesap?next=/siparislerim#giris"
            className="mt-4 flex h-10 items-center justify-center gap-2 rounded bg-brand-900 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <LogIn className="size-4" strokeWidth={SW} aria-hidden /> Giriş Yap
          </Link>
          <Link
            href="/hesap?next=/siparislerim#kayit"
            className="mt-2 flex h-10 items-center justify-center rounded border border-gray-300 text-sm font-medium hover:border-brand-900"
          >
            Kayıt Ol
          </Link>
        </aside>
      </div>
    </section>
  );
}
