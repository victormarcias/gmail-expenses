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

// Fast path for one row dated now, which belongs last and needs no sort: it
// goes right above the TOTAL row, and only that row is formatted. A tab with
// no TOTAL at the bottom, or missing the row's column, goes through
// writeRows.
function writeManualRow(spreadsheet, month, row) {
  const sheet = spreadsheet.getSheetByName(month);
  const lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return writeRows(spreadsheet, month, [row]);

  const tabHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0].map(String);
  const columnIndex = (header) => tabHeaders.indexOf(header) + 1;
  // Checked first: the TOTAL lookup below needs the Fecha column
  const complete = headers().every((header) => tabHeaders.includes(header));
  if (!complete) return writeRows(spreadsheet, month, [row]);
  const totalAtBottom =
    sheet.getRange(lastRow, columnIndex('Fecha')).getValue() === TOTAL_LABEL;
  if (!totalAtBottom) return writeRows(spreadsheet, month, [row]);

  sheet.insertRowBefore(lastRow);
  const width = tabHeaders.length;
  const formatOf = (header) => {
    if (header === 'Fecha' || header === 'Vencimiento') return FORMAT_DATE;
    if (header === 'USD') return FORMAT_USD;
    return amountHeaders().includes(header) ? FORMAT_ARS : 'General';
  };
  sheet.getRange(lastRow, 1, 1, width)
    .setValues([tabHeaders.map((header) => cellValue(row, header))])
    .setNumberFormats([tabHeaders.map(formatOf)])
    .setFontWeight('normal');
  sheet.getRange(lastRow, columnIndex('Estado')).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([STATUS_TO_PAY, STATUS_PAID], true)
      .build()
  );

  // The sums are rewritten in one call so they cover the new row. A plain
  // text in setFormulas is read as a formula, so the TOTAL label goes after.
  const totalRow = lastRow + 1;
  const sumOf = (header) => {
    const data = sheet.getRange(2, columnIndex(header), totalRow - 2, 1);
    return `=SUM(${data.getA1Notation()})`;
  };
  sheet.getRange(totalRow, 1, 1, width).setFormulas([tabHeaders.map(
    (header) => {
      const summed = header === 'USD' || amountHeaders().includes(header);
      return summed ? sumOf(header) : '';
    })]);
  sheet.getRange(totalRow, columnIndex('Fecha')).setValue(TOTAL_LABEL);
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
