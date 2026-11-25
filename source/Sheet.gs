// Gmail Expenses: spreadsheet writing. Every monthly tab has a header, one
// row per transaction sorted by date, and a TOTAL row at the bottom.
// author: @victormarcias
//
// Columns are matched by header name, not position, so tabs created before a
// category was added (or with columns added by hand) keep working.

const TOTAL_LABEL = 'TOTAL';
const FORMAT_DATE = 'dd/mm/yyyy';
const FORMAT_ARS = '"$ "#,##0.00';
const FORMAT_USD = '"US$ "#,##0.00';

const LEADING_COLUMNS = ['Fecha', 'Detalle'];
const TRAILING_COLUMNS = ['USD', 'Vencimiento', 'Estado'];

// The name of the tab for the month `date` falls in, in the script's time
// zone
function monthTab(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
}

function writeRows(spreadsheet, month, rows) {
  const sheet = spreadsheet.getSheetByName(month)
    || spreadsheet.insertSheet(month);
  const tabHeaders = ensureHeaders(sheet);
  const width = tabHeaders.length;
  const columnIndex = (header) => tabHeaders.indexOf(header) + 1;

  // The TOTAL row is rebuilt after sorting. Rows added by hand below it
  // leave it inside the data, so it's looked for in every row.
  deleteTotalRows(sheet, columnIndex('Fecha'));

  const values = rows.map((row) =>
    tabHeaders.map((header) => cellValue(row, header)));
  const notes = rows.map((row) =>
    tabHeaders.map((header) => (header === row.category ? row.note : '')));

  const firstNew = sheet.getLastRow() + 1;
  sheet.getRange(firstNew, 1, values.length, width)
    .setValues(values)
    .setNotes(notes);

  const dataRows = sheet.getLastRow() - 1;
  sheet.getRange(2, 1, dataRows, width)
    .sort({ column: columnIndex('Fecha'), ascending: true });

  // Formats and the Estado dropdown cover rows added by hand too
  const dataRange = (header) =>
    sheet.getRange(2, columnIndex(header), dataRows, 1);
  dataRange('Fecha').setNumberFormat(FORMAT_DATE);
  dataRange('Vencimiento').setNumberFormat(FORMAT_DATE);
  dataRange('USD').setNumberFormat(FORMAT_USD);
  amountHeaders().forEach((header) => {
    dataRange(header).setNumberFormat(FORMAT_ARS);
  });
  dataRange('Estado').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([STATUS_TO_PAY, STATUS_PAID], true)
      .build()
  );

  writeTotalRow(sheet, columnIndex, width, dataRows);
}

// Writes the header of a new tab, or appends the columns an existing tab is
// missing. Returns the tab's headers.
function ensureHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  const current = lastColumn
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
    : [];
  const missing = headers().filter((header) => !current.includes(header));
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length)
      .setValues([missing]);
  }

  const all = current.concat(missing);
  sheet.getRange(1, 1, 1, all.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return all;
}

function cellValue(row, header) {
  switch (header) {
    case 'Fecha': return row.date;
    case 'Detalle': return row.detail;
    case 'USD': return row.usd || '';
    case 'Vencimiento': return row.due || '';
    case 'Estado': return row.status;
    default: return header === row.category ? row.ars : '';
  }
}

// Deletes every TOTAL row, bottom up so the row numbers still to delete
// don't shift.
function deleteTotalRows(sheet, fechaColumn) {
  const dataRows = sheet.getLastRow() - 1;
  if (dataRows < 1) return;
  const fechas = sheet.getRange(2, fechaColumn, dataRows, 1).getValues();
  for (let index = fechas.length - 1; index >= 0; index--) {
    if (fechas[index][0] === TOTAL_LABEL) sheet.deleteRow(index + 2);
  }
}

// Per-column sums for every category and USD. Detalle is a text column, so
// it gets no sum.
function writeTotalRow(sheet, columnIndex, width, dataRows) {
  const totalRow = dataRows + 2;
  const cell = (header) => sheet.getRange(totalRow, columnIndex(header));
  const sumOf = (header) => {
    const data = sheet.getRange(2, columnIndex(header), dataRows, 1);
    return `=SUM(${data.getA1Notation()})`;
  };

  sheet.getRange(totalRow, 1, 1, width)
    .clearDataValidations()
    .setFontWeight('bold');
  cell('Fecha').setValue(TOTAL_LABEL);

  cell('USD').setFormula(sumOf('USD')).setNumberFormat(FORMAT_USD);
  amountHeaders().forEach((header) => {
    cell(header).setFormula(sumOf(header)).setNumberFormat(FORMAT_ARS);
  });
}

// Expected columns: the categories go in the same order as in CATEGORIES.
function headers() {
  return [...LEADING_COLUMNS, ...amountHeaders(), ...TRAILING_COLUMNS];
}

function amountHeaders() {
  return Object.keys(CATEGORIES);
}
