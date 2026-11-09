/**
 * Mağaza çalışma saatleri:
 *  - Tabloyu data-store-hours verisinden oluşturur (aynı saatli günleri birleştirmez,
 *    her günü ayrı gösterir; bugünün satırı vurgulanır).
 *  - "Şu an açık / kapalı" rozetini Türkiye saatine göre gösterir.
 *
 * Saat, ziyaretçinin bilgisayar saatinden değil İstanbul saat diliminden hesaplanır;
 * yurt dışından bakan biri de doğru durumu görür.
 */

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi'den başla

/** İstanbul saatine göre { day: 0-6, minutes: günün dakikası } */
function nowInIstanbul() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function getStatus(hours) {
  const { day, minutes } = nowInIstanbul();
  const today = hours[day];

  if (today) {
    const [open, close] = today.map(toMinutes);
    if (minutes >= open && minutes < close) {
      return { open: true, text: `Şu an açık · ${today[1]}'a kadar` };
    }
    if (minutes < open) {
      return { open: false, text: `Şu an kapalı · Bugün ${today[0]}'da açılıyor` };
    }
  }

  // Sonraki açık günü bul
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    if (hours[nextDay]) {
      const label = i === 1 ? 'Yarın' : DAY_NAMES[nextDay];
      return { open: false, text: `Şu an kapalı · ${label} ${hours[nextDay][0]}'da açılıyor` };
    }
  }
  return { open: false, text: 'Şu an kapalı' };
}

export function initStoreHours() {
  document.querySelectorAll('[data-store]').forEach((store) => {
    let hours;
    try {
      hours = JSON.parse(store.dataset.storeHours);
    } catch {
      console.warn('data-store-hours geçerli JSON değil', store);
      return;
    }

    // Tablo
    const table = store.querySelector('[data-store-table] tbody');
    const { day: today } = nowInIstanbul();
    if (table) {
      table.innerHTML = DISPLAY_ORDER.map((d) => {
        const h = hours[d];
        const isToday = d === today;
        return `
          <tr class="${isToday ? 'bg-wood-500/10 font-semibold' : ''}">
            <td class="rounded-l px-2 py-1.5 ${isToday ? 'text-brand-900' : 'text-gray-600'}">
              ${DAY_NAMES[d]}${isToday ? ' <span class="text-[10px] font-medium text-wood-600">(Bugün)</span>' : ''}
            </td>
            <td class="rounded-r px-2 py-1.5 text-right ${h ? 'font-medium' : 'font-medium text-sale'}">
              ${h ? `${h[0]} – ${h[1]}` : 'Kapalı'}
            </td>
          </tr>`;
      }).join('');
    }

    // Açık/kapalı rozeti (her dakika güncellenir)
    const badge = store.querySelector('[data-store-status]');
    const badgeText = store.querySelector('[data-store-status-text]');
    if (badge) {
      const update = () => {
        const status = getStatus(hours);
        badge.dataset.open = String(status.open);
        badgeText.textContent = status.text;
        badge.hidden = false;
      };
      update();
      setInterval(update, 60_000);
    }
  });
}