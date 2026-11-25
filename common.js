// Shared helpers for the Scently Mini App pages (A = shop, C = quiz).
const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const DELIVERY_DATE = '[ДАТА]';
const PROMO = 'ПЕРВЫЙ';
// The bot adds ?first=0 to the link when this customer already has an order: ПЕРВЫЙ is for the first order only.
const FIRST_ORDER = new URLSearchParams(location.search).get('first') !== '0';
const promoApplies = (code) => (code || '').toUpperCase() === PROMO && FIRST_ORDER;
const promoNote = (code) => ((code || '').toUpperCase() === PROMO && !FIRST_ORDER)
  ? `<div class="muted" style="font-size:12px;margin:-6px 0 12px">Промокод ${PROMO} действует только на первый заказ</div>` : '';
const $ = (s) => document.querySelector(s);
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bottle = (p, w) => `<svg width="${w}" height="${Math.round(w * 82 / 56)}" viewBox="0 0 56 82" aria-hidden="true"><rect x="20" y="0" width="16" height="14" rx="3" fill="${p.c2}"/><rect x="24" y="13" width="8" height="6" fill="${p.c2}"/><rect x="4" y="18" width="48" height="64" rx="12" fill="${p.c1}"/><rect x="16" y="46" width="24" height="12" rx="2" fill="#FBF6EF"/></svg>`;
const BACK_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F2D1E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

async function loadProducts() {
  const r = await fetch('products.json', { cache: 'no-store' });
  return r.json();
}

function setCta(label, fn) {
  const bar = $('#cta');
  if (!label) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const b = bar.querySelector('button');
  b.textContent = label;
  b.onclick = fn;
}

// Checkout form: returns HTML; read with readForm()
function formHtml(f) {
  return `<form id="f" onsubmit="return false">
  <label>Имя<input type="text" name="name" value="${esc(f.name || '')}" autocomplete="name"></label>
  <label>Телефон<input type="tel" name="phone" value="${esc(f.phone || '')}" placeholder="+7 7__ ___ __ __" autocomplete="tel"></label>
  <label>Адрес в Павлодаре (улица, дом, кв.)<input type="text" name="address" value="${esc(f.address || '')}" autocomplete="street-address"></label>
  <label>Комментарий курьеру<input type="text" name="comment" value="${esc(f.comment || '')}" placeholder="Подъезд, домофон…"></label>
  <label>Промокод<input type="text" name="promo" value="${esc(f.promo || '')}" placeholder="Например, ПЕРВЫЙ" style="text-transform:uppercase"></label>
  <label class="check"><input type="checkbox" name="consent" ${f.consent ? 'checked' : ''}><span>Согласен(на) на обработку персональных данных для доставки заказа</span></label>
  </form>`;
}

function readForm() {
  const el = $('#f');
  const g = (n) => el.elements[n].value.trim();
  return { name: g('name'), phone: g('phone'), address: g('address'), comment: g('comment'), promo: g('promo').toUpperCase(), consent: el.elements.consent.checked };
}

function validate(f) {
  if (!f.name || !f.phone || !f.address) return 'Заполните имя, телефон и адрес';
  if (!f.consent) return 'Нужно согласие на обработку данных';
  return '';
}

function send(payload) {
  if (tg && tg.sendData) {
    tg.sendData(JSON.stringify(payload)); // Telegram closes the Mini App and the bot receives the data
  } else {
    alert('Откройте эту страницу из Telegram-бота. Данные:\n' + JSON.stringify(payload, null, 1));
  }
}

function contactHtml() {
  return `<h1 class="serif">Не нашли аромат?</h1>
  <p style="font-size:14px;line-height:1.5">Напишите название или опишите, что ищете. Сообщение получит администратор Scently и ответит в чате с ботом.</p>
  <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Ваше сообщение<textarea id="msg" placeholder="Например: ищу аромат с ванилью и табаком"></textarea></label>`;
}

function sendContact() {
  const t = $('#msg').value.trim();
  if (t) send({ type: 'contact', text: t.slice(0, 1500) });
}
