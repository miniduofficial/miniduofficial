(function () {
  'use strict';

  const NAV_ITEMS = [
    { key: 'home', label: 'Epicentre', href: 'index.html' },
    { key: 'essays', label: 'Articulations', href: 'Essays.html' },
    { key: 'fragments', label: 'Fragments', href: 'Shower Thoughts.html' },
    { key: 'contact', label: 'The Study', href: 'Contact.html' }
  ];

  const LOADING_QUOTES = [
    '"He who has a why to live can bear almost any how." - Friedrich Nietzsche',
    '"In the middle of winter, I found there was within me an invincible summer." - Albert Camus',
    '"You could leave life right now. Let that determine what you do and say and think." - Marcus Aurelius',
    '"Life can only be understood backwards; but it must be lived forwards." - Soren Kierkegaard',
    '"One must imagine Sisyphus happy." - Albert Camus',
    '"Amor fati: love your fate, which is in fact your life." - Friedrich Nietzsche',
    '"Imitation is the sincerest form of flattery that mediocrity can pay to greatness." - Oscar Wilde'
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let detailedAssetObserver;

  class SiteLoader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';
      this.className = 'progressive-bg';
      this.dataset.preview = this.dataset.preview || 'Landscape-preview.webp';
      this.innerHTML = `
        <div class="loading-symbol">
          <img src="Skull.gif" alt="" aria-hidden="true" decoding="async">
        </div>
        <p class="loading-text" data-loading-quote>Loading...</p>
        <div class="loading-progress" role="progressbar" aria-label="Loading page assets" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <span data-loading-progress></span>
        </div>
      `;
    }
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';

      const current = this.getAttribute('current') || document.body.dataset.section || sectionFromPath();
      const pageTitle = this.getAttribute('page-title') || document.body.dataset.pageTitle || document.title;
      const desktopNav = NAV_ITEMS.map(item => navLink(item, current, 'box')).join('');
      const mobileNav = NAV_ITEMS
        .filter(item => item.key !== current || current === 'article' || current === 'results')
        .map(item => navLink(item, current, 'box2'))
        .join('');

      this.innerHTML = `
        <div class="main-grid progressive-bg" data-preview="The Cave-preview.webp" data-src="The Cave-optimized.webp" data-priority="eager" aria-label="Site masthead">
          <div class="main-box masthead-logo">
            <a href="index.html" aria-label="Noble Homer's Blog home">
              <div class="logo">
                <img class="progressive-img" src="logo1-low.png" data-preview="logo1-low.png" data-src="logo1.png" data-priority="eager" alt="Noble Homer's Blog logo" decoding="async">
              </div>
            </a>
          </div>

          <div class="main-box masthead-content">
            <header class="site-title">
              <div class="title">Noble Homer's Blog</div>
            </header>
            <nav class="menu-items" aria-label="Primary navigation">
              ${desktopNav}
              ${searchControl('large')}
            </nav>
          </div>
        </div>

        <div class="main-box2 progressive-bg" data-preview="The Cave-preview.webp" data-src="The Cave-optimized.webp" data-priority="eager">
          <a href="index.html" aria-label="Noble Homer's Blog home">
            <div class="logo2">
              <img class="progressive-img" src="logo1-low.png" data-preview="logo1-low.png" data-src="logo1.png" data-priority="eager" alt="Noble Homer's Blog logo" decoding="async">
            </div>
          </a>
        </div>

        <div class="menu-title-wrapper">
          <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false">
            <span class="line"></span>
            <span class="line"></span>
            <span class="line"></span>
          </button>
          <div class="page-title">${escapeHtml(pageTitle)}</div>
          ${searchControl('small')}
          <nav class="menu-items-vertical" aria-label="Mobile navigation">
            ${mobileNav}
          </nav>
        </div>
      `;
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';
      this.innerHTML = `
        <footer class="site-footer">
          <div class="footer-container">
            <nav class="footer-nav" aria-label="Footer navigation">
              ${NAV_ITEMS.map(item => `<a href="${item.href}">${item.label}</a>`).join('<span aria-hidden="true">&middot;</span>')}
            </nav>
            <p class="footer-credit">&copy; 2025 Minidu Chandrawansa</p>
          </div>
        </footer>
      `;
    }
  }

  class BackToTop extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';
      this.innerHTML = `
        <button id="back-to-top" type="button" aria-label="Back to top">
          <img class="progressive-img" src="Up-preview.webp" data-preview="Up-preview.webp" data-src="Up-optimized.webp" alt="" aria-hidden="true" decoding="async">
        </button>
      `;
    }
  }

  customElements.define('site-loader', SiteLoader);
  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);
  customElements.define('back-to-top', BackToTop);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const previewTasks = upgradeProgressiveAssets();
    initLoadingScreen(previewTasks);
    initNavigation();
    initSearch();
    initParallax();
    initBackToTop();
  }

  function navLink(item, current, className) {
    const active = item.key === current;
    return `
      <a href="${item.href}" class="${className}${active ? ' is-active' : ''}"${active ? ' aria-current="page"' : ''}>
        ${item.label}
      </a>
    `;
  }

  function searchControl(size) {
    const label = size === 'large' ? 'Search site' : 'Search site from mobile header';
    return `
      <form class="search-bar" data-search-form role="search">
        <input type="search" placeholder="Ask the Oracle ..." aria-label="${label}" data-search-input>
        <button type="submit" aria-label="Search">
          <img class="progressive-img" src="Search-preview.webp" data-preview="Search-preview.webp" data-src="Search.png" data-priority="eager" alt="" aria-hidden="true" decoding="async">
        </button>
      </form>
    `;
  }

  function initNavigation() {
    document.querySelectorAll('site-header').forEach(header => {
      const toggle = header.querySelector('.menu-toggle');
      const menu = header.querySelector('.menu-items-vertical');
      const wrapper = header.querySelector('.menu-title-wrapper');
      if (!toggle || !menu || !wrapper) return;

      const setOpen = open => {
        toggle.setAttribute('aria-expanded', String(open));
        wrapper.classList.toggle('is-menu-open', open);
      };

      toggle.addEventListener('click', event => {
        event.stopPropagation();
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });

      document.addEventListener('click', event => {
        if (!wrapper.contains(event.target)) setOpen(false);
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') setOpen(false);
      });
    });
  }

  function initSearch() {
    document.addEventListener('submit', event => {
      const form = event.target.closest('[data-search-form]');
      if (!form) return;
      event.preventDefault();

      const input = form.querySelector('[data-search-input]');
      const query = input ? input.value.trim() : '';
      if (!validateSearch(query)) return;

      window.location.href = `results.html?query=${encodeURIComponent(query)}`;
    });
  }

  function validateSearch(query) {
    if (!query) {
      window.alert('Query cannot be empty. Please enter a valid search term.');
      return false;
    }

    if (query.length > 100) {
      window.alert('Query is too long. Please limit it to 100 characters.');
      return false;
    }

    if (!/^[a-zA-Z0-9\s,.!?'"-]+$/.test(query)) {
      window.alert('Query contains invalid characters. Please use only letters, numbers, and basic punctuation.');
      return false;
    }

    return true;
  }

  function initLoadingScreen(previewTasks) {
    const loader = document.querySelector('site-loader');
    const quote = loader ? loader.querySelector('[data-loading-quote]') : null;
    const progress = loader ? loader.querySelector('[data-loading-progress]') : null;
    const progressBar = progress ? progress.parentElement : null;
    if (!loader || !quote || !progress || !progressBar) return;

    quote.textContent = randomQuote();
    const interval = window.setInterval(() => {
      quote.classList.add('is-changing');
      window.setTimeout(() => {
        quote.textContent = randomQuote();
        quote.classList.remove('is-changing');
      }, 180);
    }, 4000);

    const skull = loader.querySelector('.loading-symbol img');
    const tasks = [...previewTasks, waitForImageElement(skull)];
    let completed = 0;

    const trackedTasks = tasks.map(task => Promise.resolve(task).finally(() => {
      completed += 1;
      const percentage = Math.round((completed / tasks.length) * 100);
      progress.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', String(percentage));
    }));

    const minimumDisplay = prefersReducedMotion.matches
      ? Promise.resolve()
      : new Promise(resolve => window.setTimeout(resolve, 500));

    Promise.all([Promise.allSettled(trackedTasks), minimumDisplay]).then(() => {
      quote.textContent = randomQuote();
      loader.classList.add('is-hidden');
      window.clearInterval(interval);
      window.setTimeout(() => {
        loader.hidden = true;
      }, prefersReducedMotion.matches ? 0 : 500);
    });
  }

  function randomQuote() {
    return LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)];
  }

  function upgradeProgressiveAssets() {
    const assets = [
      ...Array.from(document.querySelectorAll('img.progressive-img')).map(el => ({ el, isBackground: false })),
      ...Array.from(document.querySelectorAll('.progressive-bg')).map(el => ({ el, isBackground: true }))
    ];
    const previewTasks = assets.map(({ el, isBackground }) => upgradeAsset(el, isBackground));

    Promise.allSettled(previewTasks).then(() => {
      assets.forEach(({ el, isBackground }) => queueDetailedAsset(el, isBackground));
    });

    return previewTasks;
  }

  function upgradeAsset(el, isBackground) {
    const hi = el.dataset.src;
    const lo = el.dataset.preview;
    if (!lo && !hi) return Promise.resolve();

    if (lo) applyAsset(el, lo, isBackground);

    const previewReady = isBackground
      ? preloadImage(lo)
      : waitForImageElement(el);

    previewReady.then(() => {
      el.classList.add('preview-loaded');
    });

    return previewReady;
  }

  function queueDetailedAsset(el, isBackground) {
    const hi = el.dataset.src;
    if (!hi || hi === el.dataset.preview || el.closest('site-loader')) return;

    const load = () => loadDetailedAsset(el, hi, isBackground);
    if (el.dataset.priority === 'eager' || !('IntersectionObserver' in window)) {
      load();
      return;
    }

    detailedAssetObserver ||= new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        detailedAssetObserver.unobserve(entry.target);
        loadDetailedAsset(
          entry.target,
          entry.target.dataset.src,
          entry.target.classList.contains('progressive-bg')
        );
      });
    }, { rootMargin: '600px 0px' });

    detailedAssetObserver.observe(el);
  }

  function loadDetailedAsset(el, src, isBackground) {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      applyAsset(el, src, isBackground);
      el.classList.add('loaded');
    };
    image.src = src;
  }

  function preloadImage(src) {
    if (!src) return Promise.resolve();
    return new Promise(resolve => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
      if (image.complete) resolve();
    });
  }

  function waitForImageElement(image) {
    if (!image || image.complete) return Promise.resolve();
    return new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  function applyAsset(el, src, isBackground) {
    if (isBackground) {
      el.style.setProperty('--progressive-image', `url("${src}")`);
    } else {
      el.src = src;
    }
  }

  function initParallax() {
    const parallaxImages = Array.from(document.querySelectorAll('.parallax-image'));
    if (!parallaxImages.length || prefersReducedMotion.matches) return;

    let ticking = false;
    const update = () => {
      const offset = Math.round(window.scrollY * 0.25);
      parallaxImages.forEach(el => {
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    const sync = () => {
      button.classList.toggle('visible', window.scrollY > 260);
    };

    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
      });
    });

    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  function sectionFromPath() {
    const path = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    if (path === 'index.html' || path === '') return 'home';
    if (path === 'Essays.html') return 'essays';
    if (path === 'Shower Thoughts.html') return 'fragments';
    if (path === 'Contact.html') return 'contact';
    if (path === 'results.html') return 'results';
    return 'article';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }
})();
