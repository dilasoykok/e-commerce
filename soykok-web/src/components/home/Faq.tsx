const QUESTIONS = [
  {
    q: 'Ne kadar boya almam gerekir?',
    a: "Boyanacak duvarların alanını (en × yükseklik) toplayın, kapı ve pencereleri çıkarın. Bir litre boya tek katta genellikle 8–12 m² örter; iki kat için bu alanı ikiyle çarpın. Kesin sarfiyat için ürün etiketine bakın ya da mağazamıza danışın.",
  },
  {
    q: 'Montaj hizmetiniz var mı?',
    a: 'Montaj ve uygulama talepleriniz için mağazamızı arayın; ürüne ve bölgenize göre bilgi verelim.',
  },
  {
    q: 'Teslimat ne kadar sürer?',
    a: 'Stoktaki ürünler Safranbolu ve Karabük içinde genellikle [X] iş günü içinde teslim edilir. Şehir dışı gönderimlerde süre bölgeye göre değişir.',
  },
  {
    q: 'Ürünleri satın almadan önce görebilir miyim?',
    a: 'Elbette. Safranbolu mağazamızda ürünleri yerinde inceleyebilir, boya renklerini kartelada görebilirsiniz.',
  },
  {
    q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    a: 'Nakit, kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Kredi kartına taksit seçenekleri için mağazamızla iletişime geçin.',
  },
  {
    q: 'Fazla aldığım ürünü iade edebilir miyim?',
    a: 'Kullanılmamış ürünleri teslimattan itibaren 14 gün içinde faturasıyla birlikte iade edebilirsiniz. Ölçüye göre kesilen ya da özel sipariş edilen ürünler iade kapsamı dışındadır. Ayrıntılar İade ve Değişim sayfasında.',
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
