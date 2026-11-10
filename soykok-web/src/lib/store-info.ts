/**
 * Mağaza bilgileri — tek yerde. TODO: [köşeli parantezli] alanları gerçek bilgilerle güncelleyin.
 * (Ana sayfadaki mağaza bölümü ve footer'daki adres/saatler de buradan beslenebilir.)
 */

/** Çalışma saatleri: 0 = Pazar, 1 = Pazartesi … 6 = Cumartesi. Kapalı gün: null */
export type WeeklyHours = Record<number, [open: string, close: string] | null>;

export const STORE = {
  name: 'Safranbolu',
  city: 'Karabük',
  addressLines: ['[Mahalle, Cadde/Sokak, No]', '[Posta kodu] Safranbolu / Karabük'],
  phone: '[0 370 000 00 00]',
  phoneHref: 'tel:+900000000000',
  email: '[info@alanadiniz.com]',
  emailHref: 'mailto:info@ornek.com',
  whatsappHref: 'https://wa.me/900000000000',
  directionsHref: 'https://www.google.com/maps/dir/?api=1&destination=Safranbolu%2C+Karab%C3%BCk',
  mapEmbedSrc: 'https://www.google.com/maps?q=Safranbolu,+Karab%C3%BCk&z=14&output=embed',
  hours: {
    1: ['09:00', '19:00'],
    2: ['09:00', '19:00'],
    3: ['09:00', '19:00'],
    4: ['09:00', '19:00'],
    5: ['09:00', '19:00'],
    6: ['09:00', '18:00'],
    0: null,
  } satisfies WeeklyHours as WeeklyHours,
};

export const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi'den başla

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
