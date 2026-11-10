import { COMPANY } from '@/lib/company';

/** Satıcı / veri sorumlusu kimlik bilgileri tablosu */
export default function SellerInfo() {
  const rows: [string, string][] = [
    ['Unvan', COMPANY.title],
    ['Adres', COMPANY.address],
    ['Telefon', COMPANY.phone],
    ['E-posta', COMPANY.email],
    ['KEP adresi', COMPANY.kep],
    ['MERSİS no', COMPANY.mersis],
    ['Vergi dairesi / no', `${COMPANY.taxOffice} / ${COMPANY.taxNumber}`],
  ];
  return (
    <dl className="grid gap-x-4 gap-y-1 rounded-md border border-gray-200 p-4 sm:grid-cols-[160px_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-gray-500">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
