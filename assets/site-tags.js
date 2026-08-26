/*
 * محمّل الوسوم المركزي لموقع driving-school.dz
 * المسؤوليات: GTM، توثيق إعداد GA4، AdSense، وMicrosoft Clarity.
 * لا تضع مفاتيح سرية هنا؛ هذه المعرفات عامة وتخص أدوات القياس والنشر.
 */
(() => {
  'use strict';

  if (window.__siteTagsLoaded) return;
  window.__siteTagsLoaded = true;

  const config = Object.freeze({
    // ضع هنا معرف حاوية Google Tag Manager: GTM-XXXXXXX
    gtmId: 'xxxxxxxx',
    // ضع هنا معرف قياس GA4. لا يتم تشغيل gtag مباشرة؛ التشغيل يكون عبر GTM.
    ga4MeasurementId: 'xxxxxxxx',
    // معرف ناشر AdSense متوفر في إعدادات الموقع.
    adsenseClient: 'ca-pub-5656416032906373',
    // ضع هنا معرف مشروع Microsoft Clarity: xxxxxxxxxx
    clarityId: 'xxxxxxxx'
  });

  window.__siteTagsConfig = config;
  const state = { gtm: false, adsense: false, clarity: false };
  const isMissingId = (value) => !value || /^x+$/i.test(value.replace(/[-_\s]/g, ''));

  const loadScriptOnce = (src, onload) => {
    const existing = Array.from(document.scripts).find((script) => (
      script.dataset.siteTagSrc === src || script.src === src
    ));

    if (existing) {
      if (onload) {
        if (existing.dataset.siteTagLoaded === 'true') onload();
        else existing.addEventListener('load', onload, { once: true });
      }
      return existing;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.siteTagSrc = src;
    script.addEventListener('load', () => {
      script.dataset.siteTagLoaded = 'true';
      if (onload) onload();
    }, { once: true });
    script.addEventListener('error', () => {
      console.warn('تعذر تحميل مصدر خارجي:', src);
    }, { once: true });
    document.head.appendChild(script);
    return script;
  };

  const runWhenIdle = (callback, timeout) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, timeout);
    }
  };

  const loadGtm = () => {
    if (state.gtm || isMissingId(config.gtmId)) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    state.gtm = true;
    loadScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`);
  };

  const syncAdContainer = (block) => {
    const container = block.closest('.ad-slot');
    if (!container) return;

    const status = block.getAttribute('data-ad-status');
    if (status === 'unfilled') {
      container.classList.remove('is-loading', 'is-loaded');
      container.classList.add('is-empty');
    } else if (status === 'filled') {
      container.classList.remove('is-loading', 'is-empty');
      container.classList.add('is-loaded');
    }
  };

  const watchAdContainer = (block) => {
    syncAdContainer(block);
    if (!('MutationObserver' in window)) return;

    const observer = new MutationObserver(() => {
      syncAdContainer(block);
      if (block.getAttribute('data-ad-status') === 'unfilled') observer.disconnect();
    });
    observer.observe(block, { attributes: true, attributeFilter: ['data-ad-status'] });
  };

  const initializeAd = (block) => {
    if (!block || block.dataset.siteTagQueued === 'true') return;
    if (block.hasAttribute('data-adsbygoogle-status')) return;

    block.dataset.siteTagQueued = 'true';
    watchAdContainer(block);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      block.removeAttribute('data-site-tag-queued');
      console.warn('تعذر تهيئة وحدة AdSense:', error);
    }
  };

  const ensureAdsenseMeta = () => {
    if (document.querySelector('meta[name="google-adsense-account"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = config.adsenseClient;
    document.head.appendChild(meta);
  };

  const queueVisibleAds = () => {
    const blocks = Array.from(document.querySelectorAll('ins.adsbygoogle'));
    if (!blocks.length) return;

    const queueAll = () => blocks.forEach(initializeAd);
    if (!('IntersectionObserver' in window)) {
      runWhenIdle(queueAll, 1800);
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        instance.unobserve(entry.target);
        initializeAd(entry.target);
      });
    }, { rootMargin: '600px 0px', threshold: 0.01 });

    blocks.forEach((block) => observer.observe(block));
  };

  const loadAdsense = () => {
    if (state.adsense || isMissingId(config.adsenseClient)) return;
    if (!document.querySelector('ins.adsbygoogle')) return;

    state.adsense = true;
    ensureAdsenseMeta();
    loadScriptOnce(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsenseClient)}`,
      queueVisibleAds
    );
  };

  const loadClarity = () => {
    if (state.clarity || isMissingId(config.clarityId)) return;

    window.clarity = window.clarity || function (...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
    state.clarity = true;
    loadScriptOnce(`https://www.clarity.ms/tag/${encodeURIComponent(config.clarityId)}`);
  };

  loadGtm();
  window.addEventListener('load', () => {
    runWhenIdle(loadAdsense, 2500);
    runWhenIdle(loadClarity, 5000);
  }, { once: true, passive: true });
})();
