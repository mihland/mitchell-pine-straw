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

var GOOGLE_ADS_ID   = 'AW-18436646791';  /* NOTE: this is the Mitchell Family Farms
                                            account. If pine straw gets its own
                                            Google Ads account, swap this ID. */
var FORM_CONVERSION = '';                /* e.g. 'aB1cDEfGhIjKlMnOp' */
var CALL_CONVERSION = '';

var PHONE_DISPLAY = '(229) 206-1836';
var PHONE_TEL     = '+12292061836';

/* ---------- nothing below here needs editing ---------- */
(function () {
  'use strict';

  /* --- Load the Google tag --- */
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

  function fireConversion(label) {
    if (!GOOGLE_ADS_ID || !label) return;
    gtag('event', 'conversion', { send_to: GOOGLE_ADS_ID + '/' + label });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {

    /* --- Every click-to-call counts as a conversion --- */
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () { fireConversion(CALL_CONVERSION); });
    });

    /* The homepage carries its own scroll + menu script; don't double-bind. */
    if (!document.body.hasAttribute('data-legacy-ui')) {
      /* --- Smooth scroll for same-page anchors --- */
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

      /* --- Mobile menu --- */
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

        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      });
    }

    /* --- Thank-you page fires the form conversion once --- */
    if (document.body.getAttribute('data-conversion') === 'form') {
      fireConversion(FORM_CONVERSION);
    }
  });
})();
