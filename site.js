/* ============================================================
   Mitchell Pine Straw — shared site script
   ============================================================
   THREE THINGS TO FILL IN. Nothing else in the site needs
   touching — every page reads its settings from right here.

   1. GOOGLE_ADS_ID    Google Ads > Settings > "Google tag"
                       Looks like AW-1234567890
   2. FORM_CONVERSION  Google Ads > Goals > Conversions >
                       "Quote Form Submit" > Tag setup.
                       Paste ONLY the part after the slash.
   3. CALL_CONVERSION  Same, from "Phone Call Click".

   Until FORM_CONVERSION / CALL_CONVERSION are filled in, the
   site works normally and just doesn't report conversions.
   ============================================================ */

/* Verified Sept 11 2026 against Google Ads account 658-028-0043
   ("Mitchell Family Farms" — the login is sales@mitchellpinestraw.com).
   Pine straw shares this account with the bulk beef campaign, so the two
   are kept apart by campaign-specific conversion goals, not by account. */
var GOOGLE_ADS_ID   = 'AW-18436646791';
var FORM_CONVERSION = 'x8vECNSl5PMcEIfPo9dE';  /* "Pine Straw - Quote Form Submit" */
var CALL_CONVERSION = 'fRPpCNel5PMcEIfPo9dE';  /* "Pine Straw - Phone Click (diagnostic)" */

var PHONE_DISPLAY = '(229) 206-1836';
var PHONE_TEL     = '+12292061836';

/* ---------- nothing below here needs editing ---------- */
(function () {
  'use strict';

  var ATTR_KEY = 'mps_attr';     /* first-touch campaign data, this browser session */
  var LEAD_KEY = 'mps_lead';     /* one-time token proving a real submission happened */
  var DONE_KEY = 'mps_counted';  /* tokens already reported, so a reload can't re-fire */
  var SEEN_KEY = 'mps_thanks';   /* they genuinely submitted this session — copy only, never counting */

  /* sessionStorage/localStorage throw in some privacy modes — never let that break the page */
  function get(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function set(store, key, val) {
    try { window[store].setItem(key, val); } catch (e) { /* nothing we can do */ }
  }
  function del(store, key) {
    try { window[store].removeItem(key); } catch (e) { /* nothing we can do */ }
  }

  /* --- Google tag --- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  if (GOOGLE_ADS_ID) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ADS_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GOOGLE_ADS_ID);
  }

  function fireConversion(label, txnId) {
    if (!GOOGLE_ADS_ID || !label) return;
    var payload = { send_to: GOOGLE_ADS_ID + '/' + label };
    if (txnId) { payload.transaction_id = txnId; }
    gtag('event', 'conversion', payload);
  }

  /* ============================================================
     Campaign attribution
     Remember how this visitor first arrived, so the lead that
     shows up in the inbox says which ad paid for it.
     ============================================================ */
  var CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'msclkid'];
  var UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function captureAttribution() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }

    var found = {};
    var sawSomething = false;
    CLICK_IDS.concat(UTMS).forEach(function (k) {
      var v = params.get(k);
      if (v) { found[k] = v; sawSomething = true; }
    });

    /* First touch wins: don't let a later internal page view overwrite the ad click. */
    var existing = get('sessionStorage', ATTR_KEY);
    if (existing && !sawSomething) return;
    if (existing && sawSomething) {
      try {
        var prev = JSON.parse(existing);
        if (prev && CLICK_IDS.some(function (k) { return prev[k]; })) return;
      } catch (e) { /* corrupt value, fall through and overwrite */ }
    }

    found.landing_page = window.location.pathname + window.location.search;
    found.referrer = document.referrer || '';
    found.arrived_at = new Date().toISOString();
    set('sessionStorage', ATTR_KEY, JSON.stringify(found));
  }

  function readAttribution() {
    try { return JSON.parse(get('sessionStorage', ATTR_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  /* Copy what we know into the form's hidden fields, right before it posts. */
  function stampForm(form) {
    var a = readAttribution();
    function put(name, value) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) { el.value = value || ''; }
    }
    put('Ad click ID', a.gclid || a.gbraid || a.wbraid || a.msclkid || '');
    put('Campaign source', a.utm_source || '');
    put('Campaign medium', a.utm_medium || '');
    put('Campaign', a.utm_campaign || '');
    put('Keyword', a.utm_term || '');
    put('Landing page', a.landing_page || '');
    put('Referrer', a.referrer || '');
    put('Submitted at', new Date().toISOString());
  }

  function newToken() {
    return 'lead-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 10);
  }

  function alreadyCounted(token) {
    var raw = get('localStorage', DONE_KEY) || '';
    return raw.split(',').indexOf(token) !== -1;
  }
  function markCounted(token) {
    var raw = get('localStorage', DONE_KEY) || '';
    var list = raw ? raw.split(',') : [];
    list.push(token);
    if (list.length > 50) { list = list.slice(-50); }
    set('localStorage', DONE_KEY, list.join(','));
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  captureAttribution();

  ready(function () {

    /* --- Click-to-call. A click is not a connected call: this is a
           diagnostic signal, not a sales result. Real call measurement
           comes from a Google forwarding number in the ad. --- */
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () { fireConversion(CALL_CONVERSION); });
    });

    /* The homepage carries its own scroll + menu script; don't double-bind. */
    if (!document.body.hasAttribute('data-legacy-ui')) {

      document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href');
          var id = href.charAt(0) === '/' ? href.slice(1) : href;
          if (id.length < 2) return;
          var target = document.querySelector(id);
          if (!target) return;                       /* let it navigate to the homepage */
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        });
      });

      var menuBtn = document.querySelector('.mobile-menu-btn');
      var nav = document.querySelector('.nav');
      if (menuBtn && nav) {
        menuBtn.addEventListener('click', function () {
          var expanded = menuBtn.getAttribute('aria-expanded') === 'true';
          menuBtn.setAttribute('aria-expanded', String(!expanded));
          nav.classList.toggle('nav-open');
        });
        nav.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () {
            nav.classList.remove('nav-open');
            menuBtn.setAttribute('aria-expanded', 'false');
          });
        });
      }
    }

    /* --- Quote form --- */
    var form = document.getElementById('quoteForm');
    if (form) {
      var keyField = form.querySelector('input[name="access_key"]');
      var keyMissing = !keyField || keyField.value.indexOf('REPLACE') === 0;

      form.addEventListener('submit', function (e) {
        if (!form.checkValidity()) return;         /* browser shows its own messages */

        stampForm(form);

        if (keyMissing) {
          /* Safety net: never let a visitor think a dead form sent.
             Falls back to email so the lead is not lost. */
          e.preventDefault();
          window.location.href = 'mailto:sales@mitchellpinestraw.com' +
            '?subject=' + encodeURIComponent('Pine straw quote request') +
            '&body=' + encodeURIComponent(
              'Name: ' + (form.Name ? form.Name.value : '') +
              '\nCompany: ' + (form.Company ? form.Company.value : '') +
              '\nPhone: ' + (form.Phone ? form.Phone.value : '') +
              '\nEmail: ' + (form.Email ? form.Email.value : '') +
              '\nDelivery ZIP: ' + (form['Delivery ZIP'] ? form['Delivery ZIP'].value : '') +
              '\nProduct: ' + (form.Product ? form.Product.value : '') +
              '\nQuantity: ' + (form.Quantity ? form.Quantity.value : '') +
              '\nTimeline: ' + (form.Timeline ? form.Timeline.value : '') +
              '\nNotes: ' + (form.Notes ? form.Notes.value : ''));
          return;
        }

        /* Hand the thank-you page proof that a real submission happened.
           Without this token it will not report a conversion — that is what
           stops reloads, back-button hits and direct visits from counting. */
        var token = newToken();
        set('sessionStorage', LEAD_KEY, token);
        var ref = form.querySelector('[name="Reference"]');
        if (ref) { ref.value = token; }

        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      });
    }

    /* --- Thank-you page --- */
    if (document.body.getAttribute('data-conversion') === 'form') {
      var token = get('sessionStorage', LEAD_KEY);

      if (token && !alreadyCounted(token)) {
        markCounted(token);
        del('sessionStorage', LEAD_KEY);
        /* Remember, for this browser session only, that they really did send one.
           A reload then keeps the friendly copy without reporting a second lead. */
        set('sessionStorage', SEEN_KEY, '1');
        fireConversion(FORM_CONVERSION, token);
      } else if (get('sessionStorage', SEEN_KEY)) {
        /* Reload or back-button after a genuine submission: say the same thing,
           report nothing. */
      } else {
        /* Landed here without submitting — don't claim we received anything,
           and don't report a lead that never happened. */
        var h = document.getElementById('tyHeading');
        var p = document.getElementById('tyBody');
        if (h) { h.textContent = 'Looking for a quote?'; }
        if (p) {
          p.innerHTML = 'This is the page we show after a quote request comes through. ' +
            'If you were sending one and are not sure it went, ' +
            '<a href="/quote/">send it here</a> or give us a call and we will sort it out.';
        }
      }
    }
  });
})();
