// Gmail Expenses: manual entry page. The script is deployed as a web app that
// only its owner can open, so Google's own sign-in is the authentication and
// no secret lives in the page.
// author: @victormarcias

// Detalle the page starts with, and the one used when it is left empty
const MANUAL_DETAIL = 'Manual';

// The logo of the page and of its browser tab: the README's image, served by
// GitHub. It shows once the repo has been pushed.
const LOGO_URL =
  'https://raw.githubusercontent.com/victormarcias/gmail-expenses/develop/images/logo.png';

function doGet() {
  const page = HtmlService.createTemplateFromFile('WebAppPage');
  page.logoUrl = LOGO_URL;
  return page.evaluate()
    .setFaviconUrl(LOGO_URL)
    .setTitle('Gmail Expenses')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Called from the page: the category names, in sheet-column order.
function getCategories() {
  return amountHeaders();
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
  if (!(amount > 0)) throw new Error('Invalid amount');

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
