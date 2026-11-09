const QUESTIONS = [
  {
    q: 'Kaç metrekare parke almam gerektiğini nasıl hesaplarım?',
    a: "Odanın eni ile boyunu çarparak alanı bulun, kesim ve fire payı için üzerine yaklaşık %5–10 ekleyin. Örneğin 4 m × 5 m bir oda 20 m²'dir; fire payıyla 21–22 m² parke almanız önerilir.",
  },
  {
    q: 'Montaj hizmetiniz var mı?',
    a: 'Evet, Safranbolu ve Karabük genelinde uzman ekibimizle montaj yapıyoruz. Kampanya dönemlerinde belirli metrekarenin üzerindeki alışverişlerde montaj ücretsizdir.',
  },
  {
    q: 'Teslimat ne kadar sürer?',
    a: 'Stoktaki ürünler Safranbolu ve Karabük içinde genellikle [X] iş günü içinde teslim edilir. Şehir dışı gönderimlerde süre bölgeye göre değişir.',
  },
  {
    q: 'Satın almadan önce numune görebilir miyim?',
    a: 'Elbette. Mağazamızda tüm parke ve zemin kaplama ürünlerini yerinde inceleyebilir, renk ve dokuyu evinizin ışığında görmek için numune alabilirsiniz.',
  },
  {
    q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    a: 'Nakit, kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Kredi kartına taksit seçenekleri için mağazamızla iletişime geçin.',
  },
  {
    q: 'Fazla aldığım parkeyi iade edebilir miyim?',
    a: 'Açılmamış ve hasar görmemiş paketler, faturasıyla birlikte [X] gün içinde iade edilebilir. Açılmış paketler ve özel siparişler iade kapsamı dışındadır.',
  },
];

/**
 * Sıkça Sorulan Sorular (eski partials/home/faq.html). <details> ile çalışır,
 * JavaScript gerekmez. Ayrıca Google için FAQPage yapılandırılmış verisi eklenir.
 */
export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: QUESTIONS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <section id="sss" className="scroll-mt-28 bg-stone-50 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
            Merak Edilenler
          </span>
          <h2 className="mt-4 text-3xl font-bold text-stone-800 md:text-4xl">Sıkça Sorulan Sorular</h2>
          <p className="mt-3 text-stone-600">
            Aradığınız cevabı bulamazsanız bize telefon veya WhatsApp üzerinden ulaşabilirsiniz.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {QUESTIONS.map(({ q, a }, i) => (
            <details key={q} open={i === 0} className="group rounded-2xl bg-white shadow-sm transition open:shadow-md">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-stone-800 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-stone-600">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
