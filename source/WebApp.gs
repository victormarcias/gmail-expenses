// Gmail Expenses: manual entry page. The script is deployed as a web app that
// only its owner can open, so Google's own sign-in is the authentication and
// no secret lives in the page.
// author: @victormarcias

// Detalle the page starts with, and the one used when it is left empty
const MANUAL_DETAIL = 'Manual';

// Largest amount, in pesos, the page lets through and addExpense accepts
const MAX_AMOUNT = 1000000;

// The page's logo and its browser tab icon: images of this repo, served by
// GitHub. They show once the repo has been pushed.
const IMAGES_URL =
  'https://raw.githubusercontent.com/victormarcias/gmail-expenses/develop/images';
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
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Shown beside each category in the page only: the sheet columns keep the
// plain names. A category missing here is listed without one.
const CATEGORY_EMOJIS = {
  'Compras': '🛍️',
  'Delivery': '🍔',
  'Educación': '🎓',
  'Hogar': '💡',
  'Impuestos': '🧾',
  'Mascotas': '🐾',
  'Ocio': '🍷',
  'Otros': '📦',
  'Salud': '💊',
  'Supermercado': '🛒',
  'Suscripciones': '🖥️',
  'Tarjetas': '💳',
  'Transporte': '🚗',
  'Vacaciones': '🏖️',
};

// Called from the page: every category as its name (what addExpense takes)
// and its label.
function getCategories() {
  return amountHeaders().map((name) => ({
    name,
    label: CATEGORY_EMOJIS[name] ? `${CATEGORY_EMOJIS[name]} ${name}` : name,
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
