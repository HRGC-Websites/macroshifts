// Macroshifts — shared site behavior
(function () {
  // Mobile nav
  function initNav() {
    var burger = document.querySelector('.nav-burger');
    var links = document.querySelector('.nav-links');
    if (burger && links) {
      burger.addEventListener('click', function () {
        links.classList.toggle('open');
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); });
      });
    }
  }

  // Dropdown nav (accessible toggle for keyboard + touch)
  function initDropdowns() {
    var triggers = document.querySelectorAll('.nav-drop-trigger');
    if (!triggers.length) return;
    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = btn.getAttribute('aria-expanded') === 'true';
        triggers.forEach(function (b) { if (b !== btn) b.setAttribute('aria-expanded', 'false'); });
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
    document.addEventListener('click', function (e) {
      triggers.forEach(function (btn) {
        var parent = btn.closest('.nav-dropdown');
        if (parent && !parent.contains(e.target)) {
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        triggers.forEach(function (btn) { btn.setAttribute('aria-expanded', 'false'); });
      }
    });
  }

  // Scroll reveal
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var d = el.getAttribute('data-delay');
          if (d) el.style.transitionDelay = d + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // Animated counters
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var prefix = el.getAttribute('data-prefix') || '';
        var dec = (el.getAttribute('data-dec') === '1');
        var start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          var val = target * e;
          el.textContent = prefix + (dec ? val.toFixed(1) : Math.round(val)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  // Hero direction switcher (home only)
  function initHeroSwitch() {
    var sw = document.querySelector('.hero-switch');
    if (!sw) return;
    var heroes = document.querySelectorAll('[data-hero]');
    var saved = localStorage.getItem('ms_hero') || 'a';
    function show(key) {
      heroes.forEach(function (h) { h.style.display = (h.getAttribute('data-hero') === key) ? '' : 'none'; });
      sw.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-go') === key);
      });
      localStorage.setItem('ms_hero', key);
    }
    sw.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-go')); window.scrollTo({top:0,behavior:'smooth'}); });
    });
    show(saved);
  }

  // Seasonal discount popup — month-themed (with holiday-window overrides),
  // falling particles, email capture. Fires after 30s OR on exit-intent.
  // Skipped on /Contact. Once per visitor via localStorage flag 'ms_season_state'.
  var SEASON_CONFIG = {
    jan:         { emoji: '🎆', particle: '✨', accent: '#E6A300', accentDark: '#B58200', headline: 'New year, new build.',          eyebrow: 'January Offer',       fine: 'New engagements booked before Jan 31.' },
    feb:         { emoji: '❤️', particle: '💗', accent: '#E63A56', accentDark: '#B5263F', headline: 'Fall in love with shipping.',  eyebrow: 'Valentine\'s Offer',  fine: 'New engagements booked before Feb 28.' },
    mar:         { emoji: '☘️', particle: '🍀', accent: '#2EA869', accentDark: '#1F7E4D', headline: 'Lucky founders save big.',     eyebrow: 'St. Patrick\'s Offer', fine: 'New engagements booked before Mar 31.' },
    apr:         { emoji: '🌷', particle: '🌸', accent: '#E574B3', accentDark: '#B14C8A', headline: 'Spring into your build.',       eyebrow: 'Spring Offer',        fine: 'New engagements booked before Apr 30.' },
    may:         { emoji: '🌸', particle: '🌼', accent: '#E58FCF', accentDark: '#B0689F', headline: 'Bloom this season.',            eyebrow: 'May Offer',           fine: 'New engagements booked before May 31.' },
    jun:         { emoji: '☀️', particle: '✨', accent: '#E6A300', accentDark: '#B58200', headline: 'Bright move, founder.',         eyebrow: 'Summer Offer',        fine: 'New engagements booked before Jun 30.' },
    jul:         { emoji: '🎆', particle: '🎇', accent: '#E63A56', accentDark: '#B5263F', headline: 'Declare independence — from bad agencies.', eyebrow: 'July 4th Offer', fine: 'New engagements booked before Jul 31.' },
    aug:         { emoji: '🏖️', particle: '☀️', accent: '#2F8CBC', accentDark: '#1E6A92', headline: 'Sun-up to ship-up.',            eyebrow: 'August Offer',        fine: 'New engagements booked before Aug 31.' },
    sep:         { emoji: '🍂', particle: '🍁', accent: '#D67A2A', accentDark: '#A85D1A', headline: 'New season, new shipping cycle.', eyebrow: 'Fall Offer',         fine: 'New engagements booked before Sep 30.' },
    oct:         { emoji: '🎃', particle: '👻', accent: '#9333EA', accentDark: '#6B1FAD', headline: 'No tricks. Real treat.',         eyebrow: 'Halloween Offer',     fine: 'New engagements booked before Oct 31.' },
    nov:         { emoji: '🦃', particle: '🍂', accent: '#C2410C', accentDark: '#922F09', headline: 'We\'re thankful for founders.',  eyebrow: 'Thanksgiving Offer',  fine: 'New engagements booked before Nov 30.' },
    blackfriday: { emoji: '🛍️', particle: '🛒', accent: '#0A0A0A', accentDark: '#000000', headline: 'Biggest deal of the year.',     eyebrow: 'Black Friday · Cyber Monday', fine: 'Limited window — Black Friday through Cyber Monday.' },
    dec:         { emoji: '⛄', particle: '❄️', accent: '#2F8CBC', accentDark: '#1E6A92', headline: 'Wrap up the year shipping.',     eyebrow: 'Winter Offer',        fine: 'New engagements booked before Dec 31.' },
    christmas:   { emoji: '🎄', particle: '🎁', accent: '#C8102E', accentDark: '#9B0C24', headline: 'Ship before the new year.',     eyebrow: 'Christmas Offer',     fine: 'Code expires Dec 31 — kick off in Q1.' },
  };

  // Map a date to the right season key.
  //   Black Friday window:  Nov 22 – Dec 2 (covers Thanksgiving-week sales + Cyber Monday tail)
  //   Christmas window:      Dec 15 – Dec 31
  //   Everything else:        defaults to the month key (jan…dec)
  function getSeasonKey(d) {
    var m = d.getMonth();   // 0-11
    var day = d.getDate();  // 1-31
    if ((m === 10 && day >= 22) || (m === 11 && day <= 2)) return 'blackfriday';
    if (m === 11 && day >= 15) return 'christmas';
    return ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][m];
  }

  function initSeasonPopup() {
    var path = window.location.pathname;
    if (/\/Contact\/?$/i.test(path) || path === '/Contact') return;
    try { if (localStorage.getItem('ms_season_state') === 'done') return; } catch (e) {}

    var shown = false;
    var timer = setTimeout(show, 30000);
    function onExitIntent(e) { if (e.clientY < 10 && !shown) show(); }
    document.addEventListener('mouseleave', onExitIntent);

    function show() {
      if (shown) return;
      shown = true;
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onExitIntent);

      // Allow ?season=oct etc. URL override for previewing any theme.
      var override = (new URLSearchParams(window.location.search)).get('season');
      var seasonKey = (override && SEASON_CONFIG[override]) ? override : getSeasonKey(new Date());
      var s = SEASON_CONFIG[seasonKey];

      var modal = document.createElement('div');
      modal.className = 'season-modal';
      modal.style.setProperty('--season-accent', s.accent);
      modal.style.setProperty('--season-accent-dark', s.accentDark);
      modal.innerHTML =
        '<div class="season-backdrop"></div>' +
        '<div class="particles" aria-hidden="true"></div>' +
        '<div class="season-card" role="dialog" aria-modal="true" aria-labelledby="season-title">' +
        '  <button class="season-close" aria-label="Close" type="button">×</button>' +
        '  <span class="season-emoji" aria-hidden="true">' + s.emoji + '</span>' +
        '  <span class="season-eyebrow">' + s.eyebrow + '</span>' +
        '  <h2 id="season-title">' + s.headline + '</h2>' +
        '  <span class="season-discount"><span class="pct">Up to 75%</span> OFF<span class="lbl">any studio engagement</span></span>' +
        '  <p>Drop your email and we\'ll send the discount code — plus a short note on whether it\'s the right fit for what you\'re building.</p>' +
        '  <form class="season-form" novalidate>' +
        '    <input type="email" name="email" placeholder="you@yourcompany.com" required autocomplete="email">' +
        '    <button type="submit">Claim discount →</button>' +
        '  </form>' +
        '  <p class="season-fine">' + s.fine + ' One per visitor. No spam.</p>' +
        '  <div class="season-success" style="display:none;">' +
        '    <div class="ok">✓</div>' +
        '    <h3>You\'re in.</h3>' +
        '    <p>Check your inbox in the next minute or two for the code.</p>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(modal);

      // Falling particles
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        var particles = modal.querySelector('.particles');
        var count = 16;
        for (var i = 0; i < count; i++) {
          var p = document.createElement('span');
          p.className = 'particle';
          p.textContent = s.particle;
          p.style.left = (Math.random() * 100) + '%';
          p.style.animationDuration = (6 + Math.random() * 6) + 's';
          p.style.animationDelay = (Math.random() * 5) + 's';
          p.style.fontSize = (14 + Math.random() * 14) + 'px';
          particles.appendChild(p);
        }
      }

      requestAnimationFrame(function () { modal.classList.add('open'); });

      function close() {
        modal.classList.remove('open');
        setTimeout(function () { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 320);
        document.removeEventListener('keydown', escKey);
        try { if (localStorage.getItem('ms_season_state') !== 'done') localStorage.setItem('ms_season_state', 'dismissed'); } catch (e) {}
      }
      function escKey(e) { if (e.key === 'Escape') close(); }

      modal.querySelector('.season-close').addEventListener('click', close);
      modal.querySelector('.season-backdrop').addEventListener('click', close);
      document.addEventListener('keydown', escKey);

      var form = modal.querySelector('.season-form');
      var success = modal.querySelector('.season-success');
      var fine = modal.querySelector('.season-fine');
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnHtml = submitBtn.innerHTML;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[name="email"]');
        if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
          input.style.borderColor = s.accent;
          input.focus();
          return;
        }
        var payload = {
          name: 'Seasonal popup lead',
          email: input.value.trim(),
          message: 'Requested ' + s.eyebrow + ' discount code from popup on ' + window.location.pathname,
          page: window.location.pathname,
          season: seasonKey,
        };
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending…';

        fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(function (r) {
            if (!r.ok) throw new Error('Server error ' + r.status);
            return r.json();
          })
          .then(function () {
            form.style.display = 'none';
            if (fine) fine.style.display = 'none';
            success.style.display = 'block';
            try { localStorage.setItem('ms_season_state', 'done'); } catch (e) {}
            setTimeout(close, 3200);
          })
          .catch(function (err) {
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
            alert("Sorry, something went wrong. Email hello@macroshifts.com and we'll get you the code.");
          });
      });
    }
  }

  // Lead popup — fires after 35s OR on exit-intent, whichever first.
  // Skipped on /Contact (full form already there) and after a previous submission.
  function initLeadPopup() {
    var path = window.location.pathname;
    if (/\/Contact\/?$/i.test(path) || path === '/Contact') return;
    try { if (localStorage.getItem('ms_lead_state') === 'done') return; } catch (e) {}

    var shown = false;
    var timer = setTimeout(show, 35000);

    function onExitIntent(e) {
      if (e.clientY < 10 && !shown) show();
    }
    document.addEventListener('mouseleave', onExitIntent);

    function show() {
      if (shown) return;
      shown = true;
      clearTimeout(timer);
      document.removeEventListener('mouseleave', onExitIntent);

      var modal = document.createElement('div');
      modal.className = 'lead-modal';
      modal.innerHTML =
        '<div class="lead-backdrop"></div>' +
        '<div class="lead-card" role="dialog" aria-modal="true" aria-labelledby="lead-title">' +
        '  <button class="lead-close" aria-label="Close" type="button">×</button>' +
        '  <span class="eyebrow">Quick question</span>' +
        '  <h2 id="lead-title">Got 30 seconds?</h2>' +
        '  <p>Tell us what you’re working on and we’ll reply with honest, specific thoughts within one business day.</p>' +
        '  <form class="lead-form" novalidate>' +
        '    <label>Your name<input type="text" name="name" required autocomplete="name"></label>' +
        '    <label>Email<input type="email" name="email" required autocomplete="email"></label>' +
        '    <label>What are you working on?<textarea name="message" rows="3" required></textarea></label>' +
        '    <button type="submit" class="btn btn-primary">Send <span class="arr">→</span></button>' +
        '  </form>' +
        '  <div class="lead-success" style="display:none;">' +
        '    <div class="ok">✓</div>' +
        '    <h3>Got it. Thanks.</h3>' +
        '    <p>Someone from the studio will reply within one business day.</p>' +
        '  </div>' +
        '</div>';
      document.body.appendChild(modal);

      requestAnimationFrame(function () { modal.classList.add('open'); });

      function close() {
        modal.classList.remove('open');
        setTimeout(function () { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 280);
        document.removeEventListener('keydown', escKey);
        try { if (localStorage.getItem('ms_lead_state') !== 'done') localStorage.setItem('ms_lead_state', 'dismissed'); } catch (e) {}
      }
      function escKey(e) { if (e.key === 'Escape') close(); }

      modal.querySelector('.lead-close').addEventListener('click', close);
      modal.querySelector('.lead-backdrop').addEventListener('click', close);
      document.addEventListener('keydown', escKey);

      var form = modal.querySelector('.lead-form');
      var success = modal.querySelector('.lead-success');
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnHtml = submitBtn.innerHTML;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (f) {
          if (!f.value.trim()) { f.style.borderColor = 'var(--coral)'; ok = false; }
          else { f.style.borderColor = ''; }
        });
        if (!ok) return;

        var payload = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          message: form.message.value.trim(),
          page: window.location.pathname,
        };
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending…';

        fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(function (r) {
            if (!r.ok) throw new Error('Server error ' + r.status);
            return r.json();
          })
          .then(function () {
            form.style.display = 'none';
            success.style.display = 'block';
            try { localStorage.setItem('ms_lead_state', 'done'); } catch (e) {}
            setTimeout(close, 2800);
          })
          .catch(function (err) {
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
            alert("Sorry, something went wrong sending that. Please email hello@macroshifts.com directly.");
          });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav(); initDropdowns(); initReveal(); initCounters(); initHeroSwitch();
    // Seasonal discount popup is the main popup. initLeadPopup is left defined for
    // future re-enable but is intentionally not invoked here.
    initSeasonPopup();
  });
})();
