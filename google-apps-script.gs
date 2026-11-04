```javascript
// ===== Settings =====
var ADMIN_KEY = 'CHANGE-THIS-SECRET';

// Host contact number
var NOTIFY_PHONE = '919067853112';

// Email notification recipient
var EMAIL_NOTIFY = 'barimayur1265@gmail.com';

var NTFY_TOPIC = '';
var CALLMEBOT_APIKEY = '';

var SHEET_NAME = 'Guests';
var TZ = 'Asia/Kolkata';


// ===== Google Sheet =====
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(['Time', 'Name', 'Mobile', 'Guests']);
    sh.getRange('C:C').setNumberFormat('@');
  }

  return sh;
}


// ===== Calculate totals =====
function totals_(sh) {
  var rows = sh.getDataRange().getValues().slice(1);
  var guests = 0;

  rows.forEach(function (r) {
    guests += Number(r[3]) || 0;
  });

  return {
    logins: rows.length,
    guests: guests
  };
}


// ===== Guest Login / RSVP =====
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var p = e.parameter || {};
    var sh = sheet_();

    var name = String(p.name || '').trim().slice(0, 80);
    var mobile = String(p.mobile || '').replace(/\D/g, '').slice(-10);
    var guests = Number(p.guests) || 1;

    if (!name || mobile.length !== 10) {
      return ContentService.createTextOutput('invalid');
    }

    // Same mobile number updates existing entry
    var rows = sh.getDataRange().getValues();
    var found = -1;

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][2]).replace(/\D/g, '') === mobile) {
        found = i + 1;
        break;
      }
    }

    if (found < 0) {
      sh.appendRow([new Date(), name, mobile, guests]);
    } else {
      sh.getRange(found, 1, 1, 4).setValues([
        [new Date(), name, mobile, guests]
      ]);
    }

    var t = totals_(sh);

    var status = found < 0 ? 'NEW RSVP' : 'UPDATED RSVP';

    var msg =
      status + '\n\n' +
      'Wedding: Mayur & Ashwini\n\n' +
      'Guest Name: ' + name + '\n' +
      'Mobile: ' + mobile + '\n' +
      'Total Guests: ' + guests + '\n\n' +
      'Total invitees logged in: ' + t.logins + '\n' +
      'Total guests expected: ' + t.guests + '\n\n' +
      'Wedding Date: 19 December 2026';

    // Send email and other configured notifications
    notify_(name, msg);

    return ContentService.createTextOutput('ok');

  } finally {
    lock.releaseLock();
  }
}


// ===== Notification System =====
function notify_(name, msg) {

  // EMAIL NOTIFICATION
  try {
    MailApp.sendEmail({
      to: EMAIL_NOTIFY,
      subject: 'Wedding RSVP - ' + name,
      body: msg,
      name: 'Mayur & Ashwini Wedding Invitation'
    });
  } catch (err) {
    console.error('Email notification failed: ' + err);
  }


  // NTFY PUSH NOTIFICATION (Optional)
  if (NTFY_TOPIC) {
    try {
      UrlFetchApp.fetch('https://ntfy.sh/' + NTFY_TOPIC, {
        method: 'post',
        payload: msg,
        muteHttpExceptions: true,
        headers: {
          Title: 'Wedding RSVP',
          Priority: 'high',
          Tags: 'tada'
        }
      });
    } catch (err) {
      console.error('ntfy notification failed: ' + err);
    }
  }


  // WHATSAPP NOTIFICATION (Optional)
  if (CALLMEBOT_APIKEY) {
    try {
      UrlFetchApp.fetch(
        'https://api.callmebot.com/whatsapp.php?phone=' +
        NOTIFY_PHONE +
        '&text=' + encodeURIComponent(msg) +
        '&apikey=' + CALLMEBOT_APIKEY,
        { muteHttpExceptions: true }
      );
    } catch (err) {
      console.error('WhatsApp notification failed: ' + err);
    }
  }
}


// ===== Test Email Notification =====
function testNotify() {
  notify_(
    'Test Guest',
    'Test Wedding RSVP notification.\n\nEmail notification is working!'
  );
}


// ===== Admin Guest List =====
function doGet(e) {
  var p = e.parameter || {};
  var out;

  if (p.action === 'list' && p.key === ADMIN_KEY) {

    var sh = sheet_();
    var t = totals_(sh);

    var rows = sh.getDataRange().getValues().slice(1).map(function (r) {
      return {
        time: r[0] instanceof Date
          ? Utilities.formatDate(r[0], TZ, 'dd MMM yyyy, hh:mm a')
          : String(r[0]),

        name: r[1],
        mobile: String(r[2]),
        guests: r[3]
      };
    });

    out = {
      ok: true,
      logins: t.logins,
      guests: t.guests,
      rows: rows
    };

  } else {
    out = { ok: false };
  }

  var json = JSON.stringify(out);
  var cb = p.callback;

  if (cb && /^[\w$.]+$/.test(cb)) {
    return ContentService
      .createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
```