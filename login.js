// Login page: validate, send to Google Sheet, go to invitation
(function () {
  var cfg = window.MAYSHU || {};
  var form = document.getElementById('gateForm');
  var err = document.getElementById('gateError');
  var btn = document.getElementById('gateBtn');
  var done = false;

  function go() { if (done) return; done = true; location.href = 'invitation.html'; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim().replace(/\s+/g, ' ');
    var mobile = form.mobile.value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
    var guests = form.guests.value;

    if (name.length < 2) { err.textContent = 'Please enter your name.'; form.name.focus(); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { err.textContent = 'Please enter a valid 10-digit mobile number.'; form.mobile.focus(); return; }
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Opening...';

    try { localStorage.setItem('mayshuGuest', JSON.stringify({ name: name, mobile: mobile, guests: guests })); } catch (x) {}

    if (cfg.APPS_SCRIPT_URL) {
      var data = new URLSearchParams({ name: name, mobile: mobile, guests: guests });
      fetch(cfg.APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data }).catch(function () {}).then(go);
      setTimeout(go, 3000); // never keep a guest waiting on a slow network
    } else {
      go();
    }
  });

  // Returning guest: prefill details
  try {
    var saved = JSON.parse(localStorage.getItem('mayshuGuest') || 'null');
    if (saved && saved.name) {
      form.name.value = saved.name; form.mobile.value = saved.mobile || '';
      if (saved.guests) form.guests.value = saved.guests;
      btn.textContent = 'Continue';
    }
  } catch (x) {}

  setTimeout(function () { form.name.focus(); }, 300);
})();
