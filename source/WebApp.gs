// Gmail Expenses: manual entry page. The script is deployed as a web app that
// only its owner can open, so Google's own sign-in is the authentication and
// no secret lives in the page.
// author: @victormarcias

// Detalle used when the page's field is left empty
const MANUAL_DETAIL = 'Detalle';

// Largest amount, in pesos, the page lets through and addExpense accepts
const MAX_AMOUNT = 1000000;

// The page's logo and its browser tab icon: images of this repo's main
// branch, served by GitHub. A changed image shows once it is released.
const IMAGES_URL =
  'https://raw.githubusercontent.com/victormarcias/gmail-expenses/main/images';
const LOGO_URL = `${IMAGES_URL}/logo.png`;
const FAVICON_URL = `${IMAGES_URL}/favicon.png`;

// The title carries the account the sheet belongs to, read at run time so no
// address is written in the code. Its first character is what iOS draws on a
// home screen shortcut that has no icon.
function doGet() {
  const page = HtmlService.createTemplateFromFile('WebAppPage');
  page.logoUrl = LOGO_URL;
  page.maxAmount = MAX_AMOUNT;
  return page.evaluate()
    .setFaviconUrl(FAVICON_URL)
    .setTitle(`$ Gmail Expenses - ${Session.getEffectiveUser().getEmail()}`)
    .addMetaTag('viewport',
      'width=device-width, initial-scale=1, viewport-fit=cover');
}

// Shown on each category's button in the page only: the sheet columns keep the
// plain names. A category missing here shows its first letter.
// Alphabetical.
const CATEGORY_EMOJIS = {
  'Compras': '🎁',
  'Delivery': '🍔',
  'Educación': '🎓',
  'Hogar': '🏠',
  'Impuestos': '👮🏻‍♂️',
  'Mascotas': '🐇',
  'Ocio': '🍷',
  'Otros': '📦',
  'Salud': '💊',
  'Supermercado': '🥑',
  'Suscripciones': '🖥️',
  'Tarjetas': '💳',
  'Transporte': '🚗',
  'Vacaciones': '🏖️',
};

// Background of each category's button in the page. Related categories share a
// color. A category missing here gets CATEGORY_COLOR_DEFAULT.
// Alphabetical.
const CATEGORY_COLORS = {
  'Compras': '#1e3a8a',
  'Delivery': '#dc2626',
  'Educación': '#2563eb',
  'Hogar': '#0891b2',
  'Impuestos': '#2563eb',
  'Mascotas': '#f3b151',
  'Ocio': '#ec4899',
  'Otros': '#8b6b4f',
  'Salud': '#16a34a',
  'Supermercado': '#dc2626',
  'Suscripciones': '#0891b2',
  'Tarjetas': '#1e3a8a',
  'Transporte': '#7c3aed',
  'Vacaciones': '#ec4899',
};
const CATEGORY_COLOR_DEFAULT = '#52525b';

// Called from the page: every category as its name (what addExpense takes),
// its emoji and its button color, in the order of WEB_APP_CATEGORY_ORDER.
// Categories missing there come last, in sheet order.
function getCategories() {
  const order = WEB_APP_CATEGORY_ORDER;
  const rank = (name) => order.includes(name) ? order.indexOf(name) : order.length;
  return amountHeaders()
    .map((name, i) => ({ name, i }))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.i - b.i)
    .map(({ name }) => ({
      name,
      emoji: CATEGORY_EMOJIS[name] || name.charAt(0),
      color: CATEGORY_COLORS[name] || CATEGORY_COLOR_DEFAULT,
    }));
}

// Called from the page: true while run() holds the script lock, which it does
// for its whole scan, so the page waits instead of failing.
function isAutoRunning() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return true;
  lock.releaseLock();
  return false;
}

// Called from the page: adds one paid row to the current month's tab. The
// page sends the Detalle it shows.
function addExpense(category, amount, detail) {
  if (!amountHeaders().includes(category)) throw new Error('Unknown category');
  if (!(amount > 0 && amount <= MAX_AMOUNT)) throw new Error('Invalid amount');

  // The same lock as run(): never write the same tab at the same time
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const timeZone = Session.getScriptTimeZone();
    const now = new Date();
    writeRows(openSpreadsheet(), Utilities.formatDate(now, timeZone, 'yyyy-MM'), [{
      date: now,
      detail: String(detail || '').trim() || MANUAL_DETAIL,
      category,
      ars: amount,
      status: STATUS_PAID,
      note: '',
    }]);
  } finally {
    lock.releaseLock();
  }
}
