// Invitation page: guest greeting, countdown, music, nav, RSVP links
(function () {
  var cfg = window.MAYSHU || {};
  var guest = {};
  try { guest = JSON.parse(localStorage.getItem('mayshuGuest') || '{}'); } catch (e) {}

  // Greeting + switch guest
  var who = document.getElementById('whoName');
  if (who && guest.name) who.textContent = 'Namaste, ' + guest.name.split(' ')[0];
  document.getElementById('logout').addEventListener('click', function (e) {
    e.preventDefault();
    try { localStorage.removeItem('mayshuGuest'); } catch (x) {}
    location.href = 'index.html';
  });

  // RSVP links
  var wa = document.getElementById('waBtn'), call = document.getElementById('callBtn');
  var msg = 'Namaste, this is ' + (guest.name || 'a guest') + '. I will attend the wedding of Mayur & Ashwini.' +
            (guest.guests ? ' Total guests: ' + guest.guests + '.' : '');
  if (cfg.HOST_PHONE) {
    wa.href = 'https://wa.me/' + cfg.HOST_PHONE + '?text=' + encodeURIComponent(msg);
    call.href = 'tel:+' + cfg.HOST_PHONE;
    call.textContent = 'Call ' + (cfg.HOST_PHONE_DISPLAY || '+' + cfg.HOST_PHONE);
  }

  // Active nav link
  var links = [].slice.call(document.querySelectorAll('#navlinks a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'couple', 'events', 'venue', 'rsvp'].forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  }

  // Countdown to Vaidik Wedding: 19 Dec 2026, 08:33 AM IST
  (function () {
    var target = new Date('2026-12-19T08:33:00+05:30').getTime();
    var el = { d: document.getElementById('d'), h: document.getElementById('h'), m: document.getElementById('m'), s: document.getElementById('s') };
    var box = document.getElementById('countdown'), note = document.getElementById('countNote');
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { box.style.display = 'none'; note.textContent = 'The celebrations have begun. Thank you for being a part of our day!'; return; }
      el.d.textContent = Math.floor(diff / 864e5);
      el.h.textContent = pad(Math.floor(diff % 864e5 / 36e5));
      el.m.textContent = pad(Math.floor(diff % 36e5 / 6e4));
      el.s.textContent = pad(Math.floor(diff % 6e4 / 1e3));
      setTimeout(tick, 1000);
    }
    tick();
  })();

  // Music: try to autoplay, else start on the first tap; button toggles
  var audio = document.getElementById('bgm'), mBtn = document.getElementById('musicBtn'), icon = document.getElementById('musicIcon');
  var PLAY = 'M8 5v14l11-7z', PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
  function setIcon(on) { icon.setAttribute('d', on ? PAUSE : PLAY); mBtn.classList.toggle('playing', on); }
  function play() { var p = audio.play(); if (p && p.then) p.then(function () { setIcon(true); }).catch(function () { setIcon(false); }); }
  mBtn.addEventListener('click', function (e) { e.stopPropagation(); if (audio.paused) play(); else { audio.pause(); setIcon(false); } });
  audio.addEventListener('error', function () { mBtn.style.display = 'none'; });
  play();
  var first = function () { if (audio.paused && !audio.dataset.userPaused) play(); };
  mBtn.addEventListener('click', function () { audio.dataset.userPaused = audio.paused ? '1' : ''; });
  document.addEventListener('click', first, { once: true });
  document.addEventListener('touchstart', first, { once: true });
})();
