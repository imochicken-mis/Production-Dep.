// ===================================================================
// KPI email automation (Google Apps Script)
//
// Add this file to the SAME Apps Script project as the existing backend
// code, then run setupKpiEditTrigger() once from the Apps Script editor.
// ===================================================================

/**
 * Creates one installable edit trigger.  A simple `onEdit` trigger cannot
 * send mail because it does not have permission to call MailApp.
 */
function setupKpiEditTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'onKpiSheetEdit';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

  // The legacy daily trigger uses a different processing path.  Removing it
  // here prevents it racing this row-level trigger and sending duplicates.
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'dailyKpiCheck';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

  ScriptApp.newTrigger('onKpiSheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

/** Removes only the installable KPI edit trigger. */
function removeKpiEditTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'onKpiSheetEdit';
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
}

/**
 * Runs after a user edits a configured KPI sheet.  It deliberately ignores
 * edits to every other column, including Status, to prevent trigger loops.
 */
function onKpiSheetEdit(event) {
  if (!event || !event.range) return;

  var sheet = event.range.getSheet();
  var matchingConfig = Object.keys(KPI_ALERT_CONFIG).map(function (key) {
    return { key: key, config: KPI_ALERT_CONFIG[key] };
  }).filter(function (item) {
    return item.config.sheetName === sheet.getName();
  })[0];

  if (!matchingConfig || event.range.getRow() === 1) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var valueColumn = findColumnIndex_(headers, matchingConfig.config.efficiencyHeader) + 1;
  var editStarts = event.range.getColumn();
  var editEnds = editStarts + event.range.getNumColumns() - 1;

  // Process only when the configured KPI-value column was changed.  This
  // works for a single edit and for pasted blocks of rows.
  if (valueColumn < editStarts || valueColumn > editEnds) return;

  var firstRow = Math.max(2, event.range.getRow());
  var lastRow = event.range.getLastRow();
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    for (var row = firstRow; row <= lastRow; row++) {
      processKpiRowAfterEdit_(matchingConfig.key, matchingConfig.config, sheet, headers, row);
    }
  } finally {
    lock.releaseLock();
  }
}

/** Processes one row and writes Sent only after all configured emails send. */
function processKpiRowAfterEdit_(kpiKey, config, sheet, headers, row) {
  var valueColumn = findColumnIndex_(headers, config.efficiencyHeader) + 1;
  var statusColumn = findColumnIndex_(headers, config.statusHeader) + 1;
  var dateColumn = findColumnIndex_(headers, 'Date') + 1;
  var rawValue = sheet.getRange(row, valueColumn).getValue();
  var currentStatus = String(sheet.getRange(row, statusColumn).getValue()).trim().toLowerCase();

  if (rawValue === '' || rawValue === null || rawValue === undefined || currentStatus === 'sent') return;

  var value = Number(rawValue);
  if (!isFinite(value)) {
    sheet.getRange(row, statusColumn).setNote('Email not sent: KPI value is not a number.');
    return;
  }

  // Keep the current alert rule: send only when the entered KPI misses its
  // configured standard.  A value inside the standard must not be marked Sent.
  if (!isValueOutOfRange_(value, config)) return;

  var rawDate = sheet.getRange(row, dateColumn).getValue();
  var date = rawDate instanceof Date
    ? Utilities.formatDate(rawDate, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd')
    : String(rawDate || '');
  var alertLevel = getKpiAlertLevel_(kpiKey, value, config);
  var recipients = Object.keys(config.recipients || {}).map(function (name) {
    return { name: name, address: config.recipients[name] };
  }).filter(function (recipient) {
    return Boolean(recipient.address);
  });

  if (!recipients.length) {
    sheet.getRange(row, statusColumn).setNote('Email not sent: no recipients configured.');
    return;
  }

  var deliveryKey = [sheet.getSheetId(), row, date, value].join('|');
  var properties = PropertiesService.getDocumentProperties();
  var completedRecipients = JSON.parse(properties.getProperty(deliveryKey) || '[]');
  var errors = [];
  recipients.forEach(function (recipient) {
    if (completedRecipients.indexOf(recipient.name) !== -1) return;
    var result = sendKpiAlertEmail_(kpiKey, date, value, alertLevel, recipient.address, recipient.name, config);
    if (result.success) {
      completedRecipients.push(recipient.name);
      properties.setProperty(deliveryKey, JSON.stringify(completedRecipients));
    } else {
      errors.push(recipient.address + ': ' + result.error);
    }
  });

  if (errors.length === 0 && completedRecipients.length === recipients.length) {
    sheet.getRange(row, statusColumn)
      .setValue('Sent')
      .setNote('Sent on ' + new Date().toISOString() + ' | Value: ' + value + '% | Alert: ' + alertLevel);
    logKpiAlertToSheet_(kpiKey, date, value, alertLevel);
    properties.deleteProperty(deliveryKey);
  } else {
    // Do not write Sent for a partial/failed delivery. Successful recipients
    // are recorded temporarily, so a retry does not send them a duplicate.
    sheet.getRange(row, statusColumn).setNote('Email not sent: ' + errors.join(' | '));
  }
}

/** Correctly maps both "higher is better" and "lower is better" KPI bands. */
function getKpiAlertLevel_(kpiKey, value, config) {
  var limits = STATUS_THRESHOLDS[kpiKey];
  if (!limits) return 'caution';

  if (config.isLowerBetter) {
    if (value >= limits.critical) return 'critical';
    if (value >= limits.warning) return 'warning';
    return 'caution';
  }

  if (value <= limits.critical) return 'critical';
  if (value <= limits.warning) return 'warning';
  return 'caution';
}
