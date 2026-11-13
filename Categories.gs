// Gmail Expenses: categories, their senders and the patterns that read them.
// author: @victormarcias
//
// Everything here is meant to be edited by hand. Each list entry is either a
// plain string (matched against the sender's name or address, using the
// category's default patterns) or an object that overrides any of the
// category's patterns for that sender:
//
//   { name: 'X', from: 'x.com.ar', amount: /Total\s*\$\s*([\d.,]+)/i }
//
// `reroute` ({ body, name, category }): when the body matches, the row gets
// that name and goes in that category instead, for a sender whose emails
// belong in two categories and only the body tells them apart.

const STATUS_TO_PAY = 'Pagar';
const STATUS_PAID = 'Pagado';

// Generic patterns. The first capture group is the amount. Amounts can be
// written either way: 12.345,67 or 12,345.67. Pesos can come as "$", "ARS" or
// "AR$", but not "US$" or "U$S". The keyword must start a word, so a
// subtotal isn't taken for the total.
const PESOS = /(?:ARS\s*\$?|AR\$|(?<!US|U)\$)/.source;
const AMOUNT_ARS = new RegExp(`\\b(?:total(?: a pagar)?|importe|monto|saldo actual)[^\\d$]{0,40}?${PESOS}\\s*([\\d.,]+)`, 'i');
const AMOUNT_USD = /(?:U\$S|US\$|USD)\s*([\d.,]+)/i;
const DUE_DATE = /venc(?:imiento|e)[^\d]{0,40}(\d{1,2}\/\d{1,2}\/\d{2,4})/i;

// Paid with a credit card, so already part of the card statement: entries
// with this as skipIf are marked as processed without a row.
const CREDIT_CARD = /tarjeta de cr[eé]dito|credit card|cuotas/i;

// Subject of a receipt (as opposed to a bill or a promo)
const RECEIPT = /recibo|pago|factura|cobro|compra|pagaste|receipt|purchase|payment/i;

// Subject of a payment email that isn't money going out: money coming in,
// refunds, and failed or pending payments
const NOT_PAID = new RegExp([
  'recibiste', 'cobraste', 'devoluci[oó]n', 'reintegro', 'reembolso', 'refund',
  'rechazad', 'pendiente', 'cancelad', 'fall[oói]', 'declined', 'failed',
].join('|'), 'i');

// Credit card statements (resumen de tarjeta).
const CREDIT_CARDS = [
  // Value first, then its label: "11 Noviembre 2026 Fecha de vencimiento
  // $ 50.079,83 Saldo en pesos U$S 88,84 Saldo en dólares"
  {
    name: 'Brubank',
    amount: /(?<!U)\$\s*([\d.,]+)\s*Saldo en pesos/i,
    usd: /(?:U\$S|US\$|USD)\s*([\d.,]+)\s*Saldo en d[oó]lares/i,
    due: /(\d{1,2}\s+[a-z]+\s+\d{4})\s*Fecha de vencimiento/i,
  },
  // "Saldo en pesos: 68.314,43" (no $), "Vencimiento: 11 Nov 26"
  {
    name: 'Galicia',
    amount: /Saldo en pesos:\s*\$?\s*([\d.,]+)/i,
    usd: /Saldo en d[oó]lares:\s*(?:U\$S|US\$|USD)?\s*([\d.,]+)/i,
    due: /Vencimiento:\s*(\d{1,2}\s+[a-z]{3}\w*\.?\s+\d{2,4})/i,
  },
  // Short or common names go by domain, so they don't catch unrelated senders.
  'Santander', 'BBVA', 'Banco Macro', 'ICBC', 'Credicoop', 'Banco Patagonia',
  'Supervielle', 'Comafi', 'Hipotecario', 'American Express',
  { name: 'Nación', from: 'bna.com.ar' },
  { name: 'Provincia', from: 'bancoprovincia.com.ar' },
  { name: 'Ciudad', from: 'bancociudad.com.ar' },
  { name: 'Naranja X', from: 'naranjax.com' },
  { name: 'Ualá', from: 'uala.com.ar' },
  // No due statement, only "Pagaste $ X": already paid.
  {
    name: 'Mercado Pago',
    subject: new RegExp(`(?=.*(?:${RECEIPT.source}))(?=.*(?:${CREDIT_CARD.source}))`, 'i'),
    amount: new RegExp(`\\b(?:total(?: a pagar)?|importe|monto|saldo actual|pagaste)[^\\d$]{0,40}?${PESOS}\\s*([\\d.,]+)`, 'i'),
    status: STATUS_PAID,
  },
];

// The house's essentials: electricity, gas, water, municipal taxes. They're
// paid through a wallet, so their bills are ignored: these names only decide
// that a payment to them goes in Hogar (see PAYMENTS). Expensas and cleaning
// are paid by transfer: their aliases go in TRANSFERS (Transfers.gs).
const HOGAR = [
  // Electricity
  'Cooperativa Electrica', 'Edemsa', 'Edenor', 'Edesur', 'Edelap', 'EPEC',
  // Gas
  'Ecogas', 'Metrogas', 'Naturgy', 'Camuzzi', 'Litoral Gas',
  // Water
  'AYSAM', 'AySA', 'Aguas Cordobesas', 'ABSA',
  // Taxes
  'Municipio',
  // Home insurance: paid by hand, so its due notice is read and the row waits
  // as Pagar. The notice isn't a card charge, so nothing is skipped.
  {
    name: 'La Segunda',
    from: 'lasegunda.com.ar',
    subject: /por vencer/i,
    amount: AMOUNT_ARS,
    due: DUE_DATE,
    status: STATUS_TO_PAY,
    viaPayments: false,
  },
];

// Secondary bills: phone, internet, TV, and any digital service.
const SERVICES = [
  // Phone, internet, TV: like HOGAR, bills are ignored and the names only
  // categorize payments
  'Movistar', 'Tuenti', { name: 'Claro', from: 'claro.com.ar' },
  { name: 'Personal', from: 'personal.com.ar' }, 'Telecentro', 'DirecTV',
  // Digital services (streaming, music, games, apps, cloud, AI): charged
  // automatically, so their receipts are read, with no due date, sometimes in
  // USD, and credit card charges are skipped. Only receipts, so promos are
  // ignored.
  ...[
    // Streaming and music
    { name: 'Netflix', from: 'netflix.com' },
    { name: 'HBO Max', from: 'hbomax.com' },
    { name: 'Disney+', from: 'disneyplus.com' },
    { name: 'Paramount+', from: 'paramountplus.com' },
    { name: 'Spotify', from: 'spotify.com' },
    // Games
    { name: 'Steam', from: 'steampowered.com' },
    { name: 'Nintendo', from: 'nintendo.com' },
    // Apps, cloud and AI
    { name: 'Google Play', from: 'googleplay-noreply@google.com' },
    { name: 'Apple', from: 'apple.com' },
    { name: 'Microsoft', from: 'microsoft.com' },
    { name: 'ChatGPT', from: 'openai.com' },
    { name: 'Claude', from: 'anthropic.com' },
  ].map((entry) => ({
    subject: RECEIPT, usd: AMOUNT_USD, skipIf: CREDIT_CARD, viaPayments: false, ...entry,
  })),
];

// Health insurance (prepaga).
const PREPAGAS = [
  'OSDE', 'Swiss Medical', 'Galeno', 'Medife', 'Omint', 'Medicus', 'Nobis',
  'Sancor Salud', 'Prevencion Salud', 'Avalian', 'Accord Salud',
  'Federada Salud', 'Jerarquicos Salud', 'Hospital Italiano', 'Hospital Aleman',
  'Hospital Britanico',
];

// Each key is a column of the sheet, in this order, between Detalle and USD.
// To add a category, add a key here: tabs that already exist get the new
// column appended at the end.
//
// Category defaults. `subject` must match for a message to be handled at all;
// messages from a known sender whose subject doesn't match are left untouched.
// `viaPayments`: the senders' own emails are never read; their names only
// decide the category of a payment to them (see PAYMENTS).
const CATEGORIES = {
  'Hogar': {
    entries: HOGAR,
    viaPayments: true,
  },
  'Servicios': {
    // Only the digital services are read (they set viaPayments: false)
    entries: SERVICES,
    viaPayments: true,
    amount: AMOUNT_ARS,
    status: STATUS_PAID,
  },
  'Salud': {
    entries: PREPAGAS,
    subject: /factura|disponible|cuota/i,
    amount: AMOUNT_ARS,
    due: DUE_DATE,
    // Paid by automatic debit: the bill is already paid when it's due
    status: STATUS_PAID,
  },
  'Tarjetas': {
    entries: CREDIT_CARDS,
    // "Resumen" plus a card, in any order, so account statements (caja de
    // ahorro, cuenta corriente) are ignored. Galicia's card statement is
    // "Resumen de Cuenta VISA", so "cuenta" alone can't rule one out.
    subject: /^(?=.*resumen)(?=.*(?:tarjeta|visa|master|amex|american express|cabal|naranja))/i,
    amount: AMOUNT_ARS,
    usd: AMOUNT_USD,
    due: DUE_DATE,
    status: STATUS_TO_PAY,
  },
  'Transporte': {
    entries: [
      { name: 'Uber', from: 'uber.com', subject: /viaje|trip/i, excludeSubject: /eats/i },
      { name: 'Cabify', from: 'cabify.com', subject: /viaje|recibo|trip/i },
    ],
    amount: AMOUNT_ARS,
    usd: AMOUNT_USD,
    status: STATUS_PAID,
  },
  'Compras': {
    entries: [
      // Only debit / account money purchases: credit card ones are already
      // part of the card statement. skipIf marks the mail as processed without
      // adding a row; if onlyIf doesn't match, it goes to review.
      {
        name: 'MercadoLibre',
        from: 'mercadolibre.com.ar',
        subject: /compraste|tu compra/i,
        skipIf: CREDIT_CARD,
        onlyIf: /d[eé]bito|dinero (?:disponible|en cuenta)|mercado pago/i,
      },
    ],
    amount: AMOUNT_ARS,
    status: STATUS_PAID,
  },
  // Also gets PedidosYa Market orders, rerouted from Delivery
  'Supermercado': {
    entries: [
      // Supermarket chains' online orders. Short or common names go by
      // domain, so they don't catch unrelated senders.
      { name: 'Jumbo', from: 'jumbo.com.ar' },
      { name: 'Disco', from: 'disco.com.ar' },
      { name: 'Vea', from: 'vea.com.ar' },
      { name: 'Coto', from: 'coto.com.ar' },
      { name: 'Carrefour', from: 'carrefour.com.ar' },
      { name: 'Día', from: 'supermercadosdia.com.ar' },
      { name: 'ChangoMâs', from: 'changomas.com.ar' },
      { name: 'La Anónima', from: 'laanonima.com.ar' },
    ],
    subject: /pedido|compra|orden|recibo/i,
    amount: AMOUNT_ARS,
    status: STATUS_PAID,
  },
  'Delivery': {
    entries: [
      // Its grocery store shares the sender and the subject: only the body
      // names it, so those orders are rerouted to Supermercado
      {
        name: 'PedidosYa',
        from: 'pedidosya.com',
        subject: /pedido|recibo|plus/i,
        reroute: {
          body: /PedidosYa Market/i,
          name: 'PedidosYa Market',
          category: 'Supermercado',
        },
      },
      { name: 'Rappi', from: 'rappi', subject: /pedido|orden|recibo|prime/i },
      { name: 'Uber Eats', from: 'uber.com', subject: /eats/i },
    ],
    amount: AMOUNT_ARS,
    status: STATUS_PAID,
  },
  // No senders of its own: payment confirmations from senders that aren't
  // known ('Otros pagos', in PAYMENTS)
  'Otros': {
    entries: [],
  },
};

// Payment and transfer confirmations, from any wallet or homebanking ("Pago
// aprobado en X", "Pagaste tu factura de X", "Transferiste a X"). They're not
// a column: each one is a Pagado row named after the `payee` (or the
// subject), in the category of the recipient's alias (TRANSFERS, in
// Transfers.gs) or of a known sender with that name, or `category` if none.
// Paid by credit card (skipIf), it adds nothing: it's already in the
// statement. Entries accept the same overrides as any category's, `category`
// included.
const PAYMENTS = {
  entries: [
    { name: 'Mercado Pago', from: 'mercadopago.com.ar' },
    // Reads invoices due from Brubank: one row per invoice ("Edemsa: $ 1.234
    // Vence el 07-11-2026"). `items` is global: name, amount, due date.
    {
      name: 'Brubank',
      from: 'brubank.com',
      subject: /por vencer/i,
      items: /([A-ZÁÉÍÓÚÑ][^:.,$]{0,40}?):\s*\$\s*([\d.,]+)\s*Vence el (\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,
      category: 'Hogar',
      status: STATUS_TO_PAY,
      // Not paid yet, so it can't be in a card statement
      skipIf: null,
    },
    // Any other sender: payment confirmations from gateways and shops ("Tu
    // pago ha sido acreditado a X.", "Pago aprobado", "Confirmación de
    // compra"). Emails from a known sender (Mercado Pago included) never get
    // here. Named after the payee in the subject or, failing that, the
    // sender's name.
    {
      name: 'Otros pagos',
      anySender: true,
      // Gmail can't search with regexes: this narrows the search, and
      // `subject` decides
      query: 'subject:(pago OR compra OR payment OR comprobante OR recibo)',
      subject: new RegExp([
        'pago (?:ha sido |fue )?(?:acreditado|aprobado|confirmado|exitoso|realizado|recibido)',
        '(?:confirmaci[oó]n|comprobante|recibo) de (?:tu )?(?:pago|compra)',
        'recibimos tu pago',
        'compra (?:fue )?(?:aprobada|confirmada|exitosa)',
        'gracias por tu (?:pago|compra)',
        'payment (?:confirmation|received|successful|receipt)',
      ].join('|'), 'i'),
      // NOT_PAID, plus bills and reminders, which come before paying
      excludeSubject: new RegExp(`${NOT_PAID.source}|vence|vencimiento|recordatorio|reminder|\\bdue\\b`, 'i'),
      payee: /(?:acreditado|aprobado|realizado|pago|compra) (?:a|en)\s+(.+?)\.?$/i,
      category: 'Otros',
    },
  ],
  subject: /pago|pagaste|compraste|transferiste|transferencia|enviaste/i,
  // NOT_PAID, plus purchases already handled by their own entry in Compras
  excludeSubject: new RegExp(`${NOT_PAID.source}|mercado ?libre`, 'i'),
  // On the subject; the capture group is who was paid
  payee: /(?:aprobado en|pagaste(?: tu factura de| a)?|compraste a|pago (?:a|de|en)|transferiste a|transferencia a|enviaste dinero a)\s+(.+)$/i,
  amount: new RegExp(`\\b(?:pagaste|transferiste|enviaste|pago de|total|importe|monto)[^\\d$]{0,40}?${PESOS}\\s*([\\d.,]+)`, 'i'),
  skipIf: CREDIT_CARD,
  category: 'Compras',
  status: STATUS_PAID,
};
