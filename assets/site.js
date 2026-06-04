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

  document.addEventListener('DOMContentLoaded', function () {
    initNav(); initDropdowns(); initReveal(); initCounters(); initHeroSwitch();
  });
})();
