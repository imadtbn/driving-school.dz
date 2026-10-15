/* قائمة تنقل ميسّرة على الهاتف والأجهزة اللوحية */
(() => {
  'use strict';
  const breakpoint = window.matchMedia('(max-width: 1150px)');
  document.querySelectorAll('.header').forEach((header) => {
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('#primary-navigation');
    if (!toggle || !nav) return;

    const icon = toggle.querySelector('i');
    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'فتح قائمة التنقل');
      if (icon) icon.className = 'fas fa-bars';
    };

    toggle.addEventListener('click', () => {
      const opening = !nav.classList.contains('is-open');
      if (!opening) {
        closeMenu();
        return;
      }
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'إغلاق قائمة التنقل');
      if (icon) icon.className = 'fas fa-xmark';
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (breakpoint.matches && !header.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
      closeMenu();
      toggle.focus();
    });
    if (breakpoint.addEventListener) {
      breakpoint.addEventListener('change', closeMenu);
    } else if (breakpoint.addListener) {
      breakpoint.addListener(closeMenu);
    }
  });
})();
