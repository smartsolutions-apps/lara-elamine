/* ============================================================
   Lara El Amine — site behaviour
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     CONFIG — contact form endpoint
     The Google Apps Script web app URL (ends in /exec). Source and
     setup steps: docs/contact-form.gs and README.md.

     Leave it empty and the form falls back to opening the visitor's
     own mail app — which fails silently for anyone on webmail, so
     an empty endpoint means enquiries are being lost. Fill it in.
     ============================================================ */
  var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxI-B1SauiLPOsqI6-dPzFKQcivGJNRGtlgHuKkUGqEuGBM_7myajAt1K1MRBlbO98wfQ/exec';


  /* User-facing strings the script produces, kept together so they are easy to
     find and change. */
  var T = {
    mailSubject: 'Enquiry via lara-elamine.web.app',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    required: 'This field is required.',
    chooseOne: 'Please choose one.',
    badEmail: 'Please enter a valid email address.',
    fixFields: 'Please complete the highlighted fields.',
    already: 'You have already sent an enquiry \u2014 I will be in touch shortly.',
    thanks: 'Thank you \u2014 your message has been sent.',
    sending: 'Sending\u2026',
    openingMail: 'Opening your email app \u2014 press send to complete.',
    replySoon: 'Thank you \u2014 I will reply within two business days.',
    failed: 'Something went wrong. Please try WhatsApp instead.',
    mailLabels: {
      subject: 'Website enquiry', contactingAs: 'Contacting as', name: 'Name',
      email: 'Email', organisation: 'Organisation', interest: 'Interested in', none: '\u2014'
    }
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var formLoadedAt = Date.now();

  /* ---------- Email address, assembled at runtime ----------
     The address is never written into the HTML. It is stored as two
     base64 chunks on the button and joined only when a real person
     clicks, so address-harvesting crawlers find nothing to scrape. */
  function mailAddress(el) {
    var node = el || document.querySelector('.js-mail');
    if (!node) return '';
    return atob(node.dataset.a) + String.fromCharCode(64) + atob(node.dataset.b);
  }

  document.querySelectorAll('.js-mail').forEach(function (el) {
    el.addEventListener('click', function () {
      window.location.href = 'mailto:' + mailAddress(el) +
        '?subject=' + encodeURIComponent(T.mailSubject);
    });
  });

  /* ---------- Sticky header state + scroll progress ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (header) header.classList.toggle('is-stuck', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('mobileNav');
  var scrim = document.getElementById('navScrim');

  function setNav(open) {
    if (!toggle || !drawer || !scrim) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? T.closeMenu : T.openMenu);
    drawer.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });
  // Close the drawer if the viewport grows past the mobile breakpoint.
  window.matchMedia('(min-width: 981px)').addEventListener('change', function (e) {
    if (e.matches) setNav(false);
  });

  /* ---------- Scroll-spy on the desktop nav ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-desktop a[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle(
            'is-active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.dataset.delay || '0', 10);
        entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { revealer.observe(el); });

    /* Safety net. IntersectionObserver delivers asynchronously, so a fast
       momentum flick or a scripted jump can skip past an element before it
       is ever reported as intersecting — leaving that section permanently
       invisible. Once scrolling settles, force-reveal anything at or above
       the fold that the observer missed. */
    var sweepTimer;
    function sweepReveals() {
      var vh = window.innerHeight;
      revealables.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < vh) {
          el.style.transitionDelay = '0ms';
          el.classList.add('is-in');
        }
      });
    }
    window.addEventListener('scroll', function () {
      clearTimeout(sweepTimer);
      sweepTimer = setTimeout(sweepReveals, 150);
    }, { passive: true });
    window.addEventListener('load', sweepReveals);
    setTimeout(sweepReveals, 1200);

    /* A page opened in a background tab has a hidden, zero-height viewport, so
       the observer reports nothing until the tab is brought forward. Sweep on
       the way in so the first screenful is never blank. */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') setTimeout(sweepReveals, 60);
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  function fieldWrap(input) { return input.closest('.field'); }

  function showError(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    var slot = wrap.querySelector('[data-error-for="' + input.id + '"]');
    if (slot) slot.textContent = message;
  }

  function clearError(input) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    var slot = wrap.querySelector('[data-error-for="' + input.id + '"]');
    if (slot) slot.textContent = '';
  }

  function validate(input) {
    /* Radios report their own value whether or not they are selected, so the
       group has to be asked directly — otherwise an untouched choice passes. */
    if (input.type === 'radio') {
      var picked = form.querySelector('input[name="' + input.name + '"]:checked');
      if (!picked) {
        showError(input, T.chooseOne);
        return false;
      }
      clearError(input);
      return true;
    }

    var value = (input.value || '').trim();
    if (!value) {
      showError(input, T.required);
      return false;
    }
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      showError(input, T.badEmail);
      return false;
    }
    clearError(input);
    return true;
  }

  if (form) {
    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

    required.forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldWrap(input) && fieldWrap(input).classList.contains('has-error')) validate(input);
      });
      // A radio group only fires `change`, and clearing the error should not
      // wait for the field to lose focus.
      if (input.type === 'radio') {
        form.querySelectorAll('input[name="' + input.name + '"]').forEach(function (r) {
          r.addEventListener('change', function () { validate(input); });
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = null;
      required.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });

      if (firstBad) {
        if (status) {
          status.textContent = T.fixFields;
          status.className = 'form-status is-err';
        }
        firstBad.focus();
        return;
      }

      var data = new FormData(form);

      /* ----- Spam gates (all silent: a bot gets the same "thanks" a human does,
         so it has no signal to iterate against) ----- */

      // 1. Honeypot — hidden field that only an automated filler would touch.
      if ((data.get('website') || '').trim() !== '') { fakeSuccess(); return; }

      // 2. Time trap — humans do not read and complete this form in under 4 seconds.
      if (Date.now() - formLoadedAt < 4000) { fakeSuccess(); return; }

      // 3. Link flooding — the classic payload of a form-spam blast.
      var msg = String(data.get('message') || '');
      if ((msg.match(/https?:\/\//gi) || []).length > 2 || /\[url=|<a\s+href/i.test(msg)) {
        fakeSuccess(); return;
      }

      // 4. Rate limit — one enquiry per browser per 10 minutes.
      try {
        var last = parseInt(sessionStorage.getItem('sent') || '0', 10);
        if (last && Date.now() - last < 600000) {
          status.textContent = T.already;
          status.className = 'form-status is-ok';
          return;
        }
      } catch (e) {}

      send(data);
    });
  }

  function fakeSuccess() {
    if (!status) return;
    status.textContent = T.thanks;
    status.className = 'form-status is-ok';
    form.reset();
  }

  function send(data) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; }
    if (status) { status.textContent = T.sending; status.className = 'form-status'; }

    // FORM_ENDPOINT is set at the top of this file. Until it is filled in we fall
    // back to the visitor's own mail client, with the address assembled at runtime
    // so it never appears in the page source for harvesters to scrape.
    if (!FORM_ENDPOINT) {
      var L = T.mailLabels;
      var subject = L.subject + ' - ' + (data.get('interest') || '');
      var body = [
        L.contactingAs + ': ' + (data.get('contactType') || L.none),
        L.name + ': ' + data.get('name'),
        L.email + ': ' + data.get('email'),
        L.organisation + ': ' + (data.get('organisation') || L.none),
        L.interest + ': ' + data.get('interest'),
        '',
        data.get('message')
      ].join('\n');

      window.location.href = 'mailto:' + mailAddress() +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (btn) btn.disabled = false;
      if (status) {
        status.textContent = T.openingMail;
        status.className = 'form-status is-ok';
      }
      return;
    }

    /* URLSearchParams rather than the FormData object: it posts as
       application/x-www-form-urlencoded, which (a) is a CORS-simple request so
       the browser sends no preflight, and (b) is the shape Apps Script parses
       into e.parameter. Posting FormData here silently arrives empty. */
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: new URLSearchParams(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      // Tolerate a non-JSON body rather than failing a delivered enquiry.
      return r.json().catch(function () { return { ok: true }; });
    }).then(function (res) {
      if (res && res.ok === false) throw new Error(res.error || 'rejected');
      try { sessionStorage.setItem('sent', String(Date.now())); } catch (e) {}
      form.reset();
      if (status) {
        status.textContent = T.replySoon;
        status.className = 'form-status is-ok';
      }
    }).catch(function () {
      if (status) {
        status.textContent = T.failed;
        status.className = 'form-status is-err';
      }
    }).then(function () {
      if (btn) btn.disabled = false;
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
