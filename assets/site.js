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
    initNav(); initDropdowns(); initReveal(); initCounters(); initHeroSwitch(); initLeadPopup();
  });
})();
