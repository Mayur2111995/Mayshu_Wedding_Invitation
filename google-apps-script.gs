// ===== Settings =====
var ADMIN_KEY = 'CHANGE-THIS-SECRET';   // password for admin.html (keep it private)
var NOTIFY_PHONE = '9067853112';       // host WhatsApp number (optional alerts)
var NTFY_TOPIC = '';                     // instant phone push (free): pick a long secret name, e.g. mayshu-rsvp-8f3k2x9q
var CALLMEBOT_APIKEY = '';               // optional WhatsApp alert to NOTIFY_PHONE
var SHEET_NAME = 'Guests';
var TZ = 'Asia/Kolkata';

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Time', 'Name', 'Mobile', 'Guests']);
    sh.getRange('C:C').setNumberFormat('@');
  }
  return sh;
}

function totals_(sh) {
  var rows = sh.getDataRange().getValues().slice(1), guests = 0;
  rows.forEach(function (r) { guests += Number(r[3]) || 0; });
  return { logins: rows.length, guests: guests };
}

// Guest logs in on the website
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var p = e.parameter, sh = sheet_();
    var name = String(p.name || '').trim().slice(0, 80);
    var mobile = String(p.mobile || '').replace(/\D/g, '').slice(-10);
    var guests = Number(p.guests) || 1;
    if (!name || mobile.length !== 10) return ContentService.createTextOutput('invalid');

    // same mobile logging in again updates the row instead of double counting
    var rows = sh.getDataRange().getValues(), found = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][2]).replace(/\D/g, '') === mobile) { found = i + 1; break; }
    }
    if (found < 0) sh.appendRow([new Date(), name, mobile, guests]);
    else sh.getRange(found, 1, 1, 4).setValues([[new Date(), name, mobile, guests]]);

    var t = totals_(sh);
    var msg = (found < 0 ? 'New RSVP: ' : 'Updated RSVP: ') + name + ' (' + mobile + ') - ' + guests + ' guest(s)\nTotal invitees: ' + t.logins + ' | Total guests: ' + t.guests;
    notify_(name, msg);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Sends the alert on every channel that is configured
function notify_(name, msg) {
  if (NTFY_TOPIC) {
    try {
      UrlFetchApp.fetch('https://ntfy.sh/' + NTFY_TOPIC, {
        method: 'post', payload: msg, muteHttpExceptions: true,
        headers: { Title: 'Wedding RSVP', Priority: 'high', Tags: 'tada' }
      });
    } catch (x) {}
  }
  if (CALLMEBOT_APIKEY) {
    try {
      UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + NOTIFY_PHONE +
        '&text=' + encodeURIComponent(msg) + '&apikey=' + CALLMEBOT_APIKEY, { muteHttpExceptions: true });
    } catch (x) {}
  }
  try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Wedding RSVP: ' + name, msg); } catch (x) {}
}

// Run this once from the Apps Script editor (Run > testNotify) to check your alerts
function testNotify() {
  notify_('Test Guest', 'Test alert: notifications are working.');
}

// Admin page reads the list (needs ADMIN_KEY)
function doGet(e) {
  var p = e.parameter, out;
  if (p.action === 'list' && p.key === ADMIN_KEY) {
    var sh = sheet_(), t = totals_(sh);
    var rows = sh.getDataRange().getValues().slice(1).map(function (r) {
      return {
        time: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'dd MMM yyyy, hh:mm a') : String(r[0]),
        name: r[1], mobile: String(r[2]), guests: r[3]
      };
    });
    out = { ok: true, logins: t.logins, guests: t.guests, rows: rows };
  } else {
    out = { ok: false };
  }
  var json = JSON.stringify(out), cb = p.callback;
  if (cb && /^[\w$.]+$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
