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

  const MODEL_VIEWER_MODULE = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let detailedAssetObserver;

  class SiteLoader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';
      this.className = 'progressive-bg';
      this.dataset.preview = this.dataset.preview || 'Landscape-preview.webp';
      this.dataset.src = this.dataset.src || 'Landscape-loader.webp';
      this.dataset.priority = 'eager';
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
              <div class="logo" data-3d-logo>
                <img class="progressive-img logo-fallback" src="logo1-low.png" data-preview="logo1-low.png" data-src="logo1.png" data-priority="eager" alt="Noble Homer's Blog logo" decoding="async">
                <model-viewer class="logo-model" src="assets/models/noble-homer-logo.glb?v=4" poster="logo1-low.png" alt="" camera-orbit="0deg 90deg auto" field-of-view="30deg" environment-image="neutral" shadow-intensity="1.15" exposure="0.84" interaction-prompt="none" animation-name="SpinOnce" animation-crossfade-duration="0"></model-viewer>
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
          <button class="mobile-search-toggle" type="button" aria-label="Open search" aria-expanded="false" aria-controls="mobile-search-form">
            <img class="progressive-img" src="Search-preview.webp" data-preview="Search-preview.webp" data-src="Search.png" data-priority="eager" alt="" aria-hidden="true" decoding="async">
          </button>
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
      const currentYear = new Date().getFullYear();
      this.innerHTML = `
        <footer class="site-footer">
          <div class="footer-container">
            <nav class="footer-nav" aria-label="Footer navigation">
              ${NAV_ITEMS.map(item => `<a href="${item.href}">${item.label}</a>`).join('<span aria-hidden="true">&middot;</span>')}
            </nav>
            <nav class="footer-external" aria-label="External links">
              <a href="https://www.youtube.com/@miniduchandrawansa5121" target="_blank" rel="noopener noreferrer">YouTube</a>
              <span aria-hidden="true">&middot;</span>
              <a href="https://github.com/miniduofficial" target="_blank" rel="noopener noreferrer">GitHub</a>
            </nav>
            <p class="footer-credit">&copy; ${currentYear} Minidu Chandrawansa</p>
          </div>
        </footer>
      `;
    }
  }

  class YouTubeEmbed extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';

      const videoId = this.dataset.videoId || '';
      const title = this.dataset.title || 'YouTube video';
      const preview = this.dataset.preview || '';
      const image = this.dataset.image || preview;
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId) || !preview) return;

      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const isLocalPreview = window.location.protocol === 'file:';

      if (isLocalPreview) {
        this.innerHTML = `
          <a class="video-poster video-poster--external" href="${watchUrl}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHtml(title)} on YouTube (opens in a new tab)">
            <img class="progressive-img" src="${escapeHtml(preview)}" data-preview="${escapeHtml(preview)}" data-src="${escapeHtml(image)}" alt="" decoding="async">
            <span class="video-play" aria-hidden="true"></span>
            <span class="video-external-note">Watch on YouTube</span>
          </a>
        `;
        return;
      }

      this.innerHTML = `
        <button class="video-poster" type="button" aria-label="Play ${escapeHtml(title)}">
          <img class="progressive-img" src="${escapeHtml(preview)}" data-preview="${escapeHtml(preview)}" data-src="${escapeHtml(image)}" alt="" decoding="async">
          <span class="video-play" aria-hidden="true"></span>
        </button>
      `;

      this.querySelector('.video-poster').addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
        iframe.title = title;
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        this.replaceChildren(iframe);
      });
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
  customElements.define('youtube-embed', YouTubeEmbed);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const assetPlan = upgradeProgressiveAssets();
    initLoadingScreen(assetPlan);
    initNavigation();
    initSearch();
    init3DLogo();
    initHeroCarousel();
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
    const id = size === 'small' ? ' id="mobile-search-form"' : '';
    return `
      <form class="search-bar"${id} data-search-form role="search">
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
      const searchToggle = header.querySelector('.mobile-search-toggle');
      const searchForm = wrapper && wrapper.querySelector(':scope > .search-bar');
      if (!toggle || !menu || !wrapper) return;

      const setOpen = open => {
        toggle.setAttribute('aria-expanded', String(open));
        wrapper.classList.toggle('is-menu-open', open);
      };

      const setSearchOpen = open => {
        if (!searchToggle || !searchForm) return;
        searchToggle.setAttribute('aria-expanded', String(open));
        searchToggle.setAttribute('aria-label', open ? 'Close search' : 'Open search');
        wrapper.classList.toggle('is-search-open', open);
        if (open) searchForm.querySelector('[data-search-input]')?.focus();
      };

      toggle.addEventListener('click', event => {
        event.stopPropagation();
        const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
        setSearchOpen(false);
        setOpen(willOpen);
      });

      searchToggle?.addEventListener('click', event => {
        event.stopPropagation();
        const willOpen = searchToggle.getAttribute('aria-expanded') !== 'true';
        setOpen(false);
        setSearchOpen(willOpen);
      });

      document.addEventListener('click', event => {
        if (!wrapper.contains(event.target)) {
          setOpen(false);
          setSearchOpen(false);
        }
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          setOpen(false);
          setSearchOpen(false);
        }
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

  function init3DLogo() {
    const desktopMotion = window.matchMedia('(min-width: 881px) and (hover: hover) and (prefers-reduced-motion: no-preference)');
    const logo = document.querySelector('[data-3d-logo]');
    const model = logo && logo.querySelector('.logo-model');
    if (!desktopMotion.matches || !logo || !model || !supportsWebGL()) return;

    let ready = false;

    const playOnce = () => {
      if (!ready || typeof model.play !== 'function') return;
      model.currentTime = 0;
      model.play({ repetitions: 1 });
    };

    model.addEventListener('load', () => {
      ready = true;
      logo.classList.add('is-3d-ready');
      if (typeof model.pause === 'function') model.pause();
      model.currentTime = 0;
    }, { once: true });

    logo.addEventListener('mouseenter', playOnce);
    logo.closest('a')?.addEventListener('focus', playOnce);

    import(MODEL_VIEWER_MODULE).catch(() => {
      ready = false;
      logo.classList.remove('is-3d-ready');
    });
  }

  function supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (error) {
      return false;
    }
  }

  function initHeroCarousel() {
    const carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const previous = carousel.querySelector('[data-carousel-previous]');
    const next = carousel.querySelector('[data-carousel-next]');
    if (slides.length < 2 || dots.length !== slides.length || !previous || !next) return;

    let current = 0;
    let timer;
    let interactionPaused = false;
    let touchStartX;

    const show = index => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === current));
      });
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      stop();
      if (prefersReducedMotion.matches || document.hidden || interactionPaused) return;
      timer = window.setInterval(() => show(current + 1), 9000);
    };

    previous.addEventListener('click', () => {
      show(current - 1);
      start();
    });

    next.addEventListener('click', () => {
      show(current + 1);
      start();
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.carouselDot));
        start();
      });
    });

    carousel.addEventListener('mouseenter', () => {
      interactionPaused = true;
      stop();
    });
    carousel.addEventListener('mouseleave', () => {
      interactionPaused = false;
      start();
    });
    carousel.addEventListener('focusin', () => {
      interactionPaused = true;
      stop();
    });
    carousel.addEventListener('focusout', event => {
      if (!carousel.contains(event.relatedTarget)) {
        interactionPaused = false;
        start();
      }
    });
    carousel.addEventListener('touchstart', event => {
      touchStartX = event.changedTouches[0]?.clientX;
      interactionPaused = true;
      stop();
    }, { passive: true });
    carousel.addEventListener('touchend', event => {
      const touchEndX = event.changedTouches[0]?.clientX;
      if (Number.isFinite(touchStartX) && Number.isFinite(touchEndX) && Math.abs(touchEndX - touchStartX) > 50) {
        show(current + (touchEndX < touchStartX ? 1 : -1));
      }
      touchStartX = undefined;
      interactionPaused = false;
      start();
    }, { passive: true });
    carousel.addEventListener('touchcancel', () => {
      touchStartX = undefined;
      interactionPaused = false;
      start();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    show(0);
    start();
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

  function initLoadingScreen({ previewTasks, loaderDetailReady }) {
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
    const tasks = [...previewTasks, waitForImageElement(skull), loaderDetailReady];
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
    const previewsReady = Promise.allSettled(previewTasks);
    const loaderAsset = assets.find(({ el }) => el.matches('site-loader'));

    const loaderDetailReady = previewsReady.then(async () => {
      if (loaderAsset) {
        await queueDetailedAsset(loaderAsset.el, loaderAsset.isBackground);
      }

      assets
        .filter(asset => asset !== loaderAsset)
        .forEach(({ el, isBackground }) => queueDetailedAsset(el, isBackground));
    });

    return { previewTasks, loaderDetailReady };
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
    if (!hi || hi === el.dataset.preview) return Promise.resolve();

    const load = () => loadDetailedAsset(el, hi, isBackground);
    if (el.dataset.priority === 'eager' || !('IntersectionObserver' in window)) {
      return load();
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
    return Promise.resolve();
  }

  function loadDetailedAsset(el, src, isBackground) {
    return new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        applyAsset(el, src, isBackground);
        el.classList.add('loaded');
        resolve();
      };
      image.onerror = resolve;
      image.src = src;
    });
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
