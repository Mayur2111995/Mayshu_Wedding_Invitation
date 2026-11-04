// Admin dashboard: reads the guest list from Google Apps Script (needs the admin key)
(function () {
  var cfg = window.MAYSHU || {};
  var $ = function (id) { return document.getElementById(id); };
  var data = [];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    var q = $('search').value.trim().toLowerCase();
    var list = data.filter(function (g) { return !q || (g.name + ' ' + g.mobile).toLowerCase().indexOf(q) > -1; });
    $('rows').innerHTML = list.map(function (g, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(g.name) + '</td><td><a href="tel:+91' + esc(g.mobile) + '">' + esc(g.mobile) +
             '</a></td><td>' + esc(g.guests) + '</td><td>' + esc(g.time) + '</td></tr>';
    }).join('') || '<tr><td colspan="5">No guests found.</td></tr>';
  }

  function summaryText() {
    var total = data.reduce(function (s, g) { return s + (Number(g.guests) || 0); }, 0);
    var t = 'Wedding RSVP summary\nInvitees logged in: ' + data.length + '\nTotal guests: ' + total + '\n\n';
    data.forEach(function (g, i) { t += (i + 1) + '. ' + g.name + ' - ' + g.mobile + ' (' + g.guests + ')\n'; });
    return t.length > 1500 ? t.slice(0, 1500) + '\n...' : t;
  }

  function show(d) {
    data = d.rows || [];
    $('statLogins').textContent = d.logins;
    $('statGuests').textContent = d.guests;
    $('panel').hidden = false;
    $('waSummary').href = 'https://wa.me/' + (cfg.HOST_PHONE || '') + '?text=' + encodeURIComponent(summaryText());
    render();
  }

  function load() {
    var key = $('keyInput').value.trim();
    $('adminError').textContent = '';
    if (!cfg.APPS_SCRIPT_URL) { $('adminError').textContent = 'APPS_SCRIPT_URL is empty in config.js.'; return; }
    var cb = 'cb' + Date.now(), s = document.createElement('script');
    window[cb] = function (d) {
      delete window[cb]; s.remove();
      if (!d || !d.ok) { $('adminError').textContent = 'Wrong admin key.'; $('panel').hidden = true; return; }
      try { sessionStorage.setItem('mayshuKey', key); } catch (x) {}
      show(d);
    };
    s.onerror = function () { $('adminError').textContent = 'Could not reach the server. Check the Apps Script URL and deployment.'; };
    s.src = cfg.APPS_SCRIPT_URL + '?action=list&key=' + encodeURIComponent(key) + '&callback=' + cb + '&_=' + Date.now();
    document.head.appendChild(s);
  }

  $('keyForm').addEventListener('submit', function (e) { e.preventDefault(); load(); });
  $('refresh').addEventListener('click', load);
  $('search').addEventListener('input', render);
  $('csv').addEventListener('click', function () {
    var rows = [['Name', 'Mobile', 'Guests', 'Logged in']].concat(data.map(function (g) { return [g.name, g.mobile, g.guests, g.time]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'wedding-guests.csv'; a.click();
  });

  try { var k = sessionStorage.getItem('mayshuKey'); if (k) { $('keyInput').value = k; load(); } } catch (x) {}
})();
