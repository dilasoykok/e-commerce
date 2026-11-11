/**
 * Mağaza bilgileri — tek yerde (footer, ana sayfadaki mağaza bölümü, iletişim, mağazalarımız).
 * Adres, telefon ve saatler Google işletme kaydından alındı (Kasım 2026).
 * TODO: [köşeli parantezli] alanları (e-posta) gerçek bilgilerle güncelleyin.
 */

/** Çalışma saatleri: 0 = Pazar, 1 = Pazartesi … 6 = Cumartesi. Kapalı gün: null */
export type WeeklyHours = Record<number, [open: string, close: string] | null>;

export const STORE = {
  name: 'Safranbolu',
  city: 'Karabük',
  addressLines: ['Atatürk Mah., Karabük Cad. No:41', '78600 Safranbolu / Karabük'],
  phone: '0370 725 16 40',
  phoneHref: 'tel:+903707251640',
  email: '[info@alanadiniz.com]',
  emailHref: 'mailto:info@ornek.com',
  /** Sabit hat WhatsApp kullanmıyor; cep numarası eklenirse ör. 'https://wa.me/905XXXXXXXXX' */
  whatsappHref: null as string | null,
  directionsHref:
    'https://www.google.com/maps/dir/?api=1&destination=Soyk%C3%B6k+Ticaret+Safranbolu&destination_place_id=ChIJFTwMxtOqnEARPgeCprU4zpg',
  mapEmbedSrc: 'https://www.google.com/maps?q=41.2499159,32.6849717&z=17&output=embed',
  hours: {
    1: ['08:00', '20:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '20:00'],
    4: ['08:00', '20:00'],
    5: ['08:00', '20:00'],
    6: ['08:00', '20:00'],
    0: ['11:00', '16:00'],
  } satisfies WeeklyHours as WeeklyHours,
};

export const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi'den başla

/** Saatleri gruplar: ["Pazartesi – Cumartesi: 08:00 – 20:00", "Pazar: 11:00 – 16:00"] */
export function hoursSummary(hours: WeeklyHours = STORE.hours): string[] {
  const label = (d: number) => {
    const h = hours[d];
    return h ? `${h[0]} – ${h[1]}` : 'Kapalı';
  };
  const lines: string[] = [];
  let start = 0;
  for (let i = 1; i <= DISPLAY_ORDER.length; i++) {
    if (i < DISPLAY_ORDER.length && label(DISPLAY_ORDER[i]) === label(DISPLAY_ORDER[start])) continue;
    const from = DAY_NAMES[DISPLAY_ORDER[start]];
    const to = DAY_NAMES[DISPLAY_ORDER[i - 1]];
    lines.push(`${from === to ? from : `${from} – ${to}`}: ${label(DISPLAY_ORDER[start])}`);
    start = i;
  }
  return lines;
}

/** İstanbul saatine göre { day: 0-6, minutes: günün dakikası } — ziyaretçi yurt dışında olsa da doğru */
export function nowInIstanbul(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** "Şu an açık · 19:00'a kadar" / "Şu an kapalı · Yarın 09:00'da açılıyor" */
export function storeStatus(hours: WeeklyHours, date = new Date()): { open: boolean; text: string } {
  const { day, minutes } = nowInIstanbul(date);
  const today = hours[day];

  if (today) {
    const [open, close] = today.map(toMinutes);
    if (minutes >= open && minutes < close) return { open: true, text: `Şu an açık · ${today[1]}'a kadar` };
    if (minutes < open) return { open: false, text: `Şu an kapalı · Bugün ${today[0]}'da açılıyor` };
  }
  for (let i = 1; i <= 7; i++) {
    const next = (day + i) % 7;
    const h = hours[next];
    if (h) return { open: false, text: `Şu an kapalı · ${i === 1 ? 'Yarın' : DAY_NAMES[next]} ${h[0]}'da açılıyor` };
  }
  return { open: false, text: 'Şu an kapalı' };
}
