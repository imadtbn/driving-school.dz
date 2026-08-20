/*
 * Unified AdSense manager for driving-school.dz
 * - Inserts only stable, page-aware placements.
 * - Defers each request until the unit is close to the viewport.
 * - Does not use document.write or block page rendering.
 */
(function () {
  'use strict';

  var CLIENT = 'ca-pub-5656416032906373';
  var placements = {
    lead: {
      className: 'ad-slot--display',
      format: 'auto',
      slot: '3143411927',
      responsive: true
    },
    leadAlt: {
      className: 'ad-slot--display',
      format: 'auto',
      slot: '1760836049',
      responsive: true
    },
    leadAlt2: {
      className: 'ad-slot--display',
      format: 'auto',
      slot: '5508509362',
      responsive: true
    },
    feed01: {
      className: 'ad-slot--fluid',
      format: 'fluid',
      layoutKey: '-fr+56+4k-d4+74',
      slot: '7867079394'
    },
    feed02: {
      className: 'ad-slot--fluid',
      format: 'fluid',
      layoutKey: '-h9-h+8-jr+r8',
      slot: '8546947691'
    },
    feed03: {
      className: 'ad-slot--fluid',
      format: 'fluid',
      layoutKey: '-h6-l+d-jc+qd',
      slot: '6152718642'
    },
    article01: {
      className: 'ad-slot--article',
      format: 'fluid',
      layout: 'in-article',
      slot: '6118497380'
    },
    article02: {
      className: 'ad-slot--article',
      format: 'fluid',
      layout: 'in-article',
      slot: '7319898418'
    },
    multiplex: {
      className: 'ad-slot--multiplex',
      format: 'autorelaxed',
      slot: '6528123169'
    }
  };

  function createSlot(name) {
    var config = placements[name];
    if (!config) return null;

    var wrapper = document.createElement('aside');
    wrapper.className = 'ad-slot ' + config.className + ' is-loading';
    wrapper.setAttribute('aria-label', 'إعلان');
    wrapper.setAttribute('data-ad-placement', name);

    var ad = document.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.setAttribute('data-ad-client', CLIENT);
    ad.setAttribute('data-ad-slot', config.slot);
    ad.setAttribute('data-ad-format', config.format);

    if (config.layoutKey) ad.setAttribute('data-ad-layout-key', config.layoutKey);
    if (config.layout) ad.setAttribute('data-ad-layout', config.layout);
    if (config.responsive) ad.setAttribute('data-full-width-responsive', 'true');

    wrapper.appendChild(ad);
    return wrapper;
  }

  function collapseIfUnfilled(wrapper, ad) {
    var status = ad.getAttribute('data-ad-status');
    if (status === 'unfilled') {
      wrapper.classList.remove('is-loading', 'is-loaded');
      wrapper.classList.add('is-empty');
      return true;
    }
    return false;
  }

  function requestAd(wrapper) {
    if (!wrapper || wrapper.dataset.adRequested === 'true') return;

    var ad = wrapper.querySelector('.adsbygoogle');
    if (!ad) return;

    wrapper.dataset.adRequested = 'true';

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      wrapper.classList.remove('is-loading');
      wrapper.classList.add('is-loaded');

      var observer = new MutationObserver(function () {
        if (collapseIfUnfilled(wrapper, ad)) observer.disconnect();
      });
      observer.observe(ad, { attributes: true, attributeFilter: ['data-ad-status'] });

      window.setTimeout(function () {
        collapseIfUnfilled(wrapper, ad);
        observer.disconnect();
      }, 5000);
    } catch (error) {
      wrapper.classList.remove('is-loading', 'is-loaded');
      wrapper.classList.add('is-empty');
      if (window.console && console.warn) console.warn('AdSense unit could not be initialized.', error);
    }
  }

  function scheduleAd(wrapper, observer) {
    if (!wrapper) return;
    if (observer) {
      observer.observe(wrapper);
      return;
    }

    var run = function () {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(function () { requestAd(wrapper); }, { timeout: 1800 });
      } else {
        window.setTimeout(function () { requestAd(wrapper); }, 0);
      }
    };
    run();
  }

  function insertAfter(reference, name) {
    var slot = createSlot(name);
    if (!reference || !slot || !reference.parentNode) return slot;
    reference.parentNode.insertBefore(slot, reference.nextSibling);
    return slot;
  }

  function insertBefore(reference, name) {
    var slot = createSlot(name);
    if (!reference || !slot || !reference.parentNode) return slot;
    reference.parentNode.insertBefore(slot, reference);
    return slot;
  }

  function insertWithinContent() {
    var main = document.querySelector('main');
    if (!main) return [];

    var inserted = [];
    var grids = main.querySelectorAll('.laws-grid, .tips-grid, .signs-grid');
    var cards = main.querySelectorAll('.cards-grid');
    var groups = grids.length ? grids : cards;

    if (groups.length >= 2) {
      var firstIndex = Math.max(1, Math.floor(groups.length / 2)) - 1;
      var secondIndex = groups.length - 1;
      inserted.push(insertAfter(groups[firstIndex], grids.length ? 'feed01' : 'article01'));
      if (secondIndex !== firstIndex) {
        inserted.push(insertAfter(groups[secondIndex], grids.length ? 'feed02' : 'article02'));
      }

      if (!grids.length && groups.length >= 4) {
        inserted.push(insertAfter(groups[2], 'feed03'));
      }
    }

    return inserted;
  }

  function buildPagePlan() {
    var slots = [];
    var main = document.querySelector('main');
    var hero = document.querySelector('.hero');
    var pageHeader = document.querySelector('.page-header');
    var directory = document.querySelector('.schools-map-container');
    var quiz = document.querySelector('.quiz-wrapper');

    if (!main && !hero && !directory && !quiz && !pageHeader) return slots;

    if (hero && !main) {
      slots.push(insertAfter(hero, 'lead'));
      var statsSection = document.querySelector('.stats-section');
      if (statsSection) {
        slots.push(insertAfter(statsSection, 'feed01'));
      }
      return slots;
    }

    if (quiz) {
      slots.push(insertAfter(quiz, 'leadAlt2'));
      var quizFooter = document.querySelector('footer');
      if (quizFooter) slots.push(insertBefore(quizFooter, 'multiplex'));
      return slots;
    }

    if (directory) {
      slots.push(insertBefore(directory, 'leadAlt'));
      return slots;
    }

    if (pageHeader && !main) {
      slots.push(insertAfter(pageHeader, 'leadAlt2'));
      return slots;
    }

    if (pageHeader && main) {
      slots.push(insertAfter(pageHeader, 'lead'));
    } else if (hero && main) {
      slots.push(insertAfter(hero, 'leadAlt2'));
    }

    slots = slots.concat(insertWithinContent());

    if (main && slots.length < 3) {
      var footer = document.querySelector('footer');
      if (footer) slots.push(insertBefore(footer, 'multiplex'));
    }

    return slots;
  }

  function init() {
    var slots = buildPagePlan().filter(Boolean);
    if (!slots.length) return;

    var nearViewport = 'IntersectionObserver' in window
      ? new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            scheduleAd(entry.target, null);
          });
        }, { rootMargin: '600px 0px', threshold: 0.01 })
      : null;

    slots.forEach(function (slot) { scheduleAd(slot, nearViewport); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
