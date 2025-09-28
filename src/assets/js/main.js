(() => {
  const state = {
    reports: [],
    currentCategory: 'volunteer',
    hero: {
      slider: null,
      dotsContainer: null,
      slides: [],
      autoSlideTimer: null,
      currentIndex: 0,
      isDragging: false,
      dragStartX: 0,
      sliderWidth: 0,
      pointerId: null,
      startScroll: 0,
      maxScroll: 0,
      dragDelta: 0,
      prefersReducedMotion: false,
    },
    reportsSlider: {
      container: null,
      track: null,
      pagination: null,
      currentIndex: 0,
      perView: 1,
      pages: 0,
      cardWidth: 0,
      gap: 16,
      containerWidth: 0,
      maxTranslate: 0,
      step: 0,
      currentTranslate: 0,
      startTranslate: 0,
      dragStartX: 0,
      isDragging: false,
      pointerId: null,
      allowClick: true,
      didDrag: false,
      resizeTimer: null,
      dots: [],
      totalArticles: 0,
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupDrawer();
    setupHeroSlider();
    setupReports();
  });

  function setupDrawer() {
    const toggle = document.querySelector('.menu-toggle');
    const drawer = document.querySelector('.site-drawer');
    const backdrop = document.querySelector('.drawer-backdrop');
    if (!toggle || !drawer || !backdrop) return;

    const navLinks = drawer.querySelectorAll('a[href^="#"]');
    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex="0"]';
    let lastFocused = null;

    function openDrawer() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      backdrop.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      const focusable = drawer.querySelector(focusableSelectors);
      if (focusable) focusable.focus();
      document.addEventListener('keydown', handleKeydown);
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      backdrop.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      if (lastFocused) lastFocused.focus();
      document.removeEventListener('keydown', handleKeydown);
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeDrawer() : openDrawer();
    });

    backdrop.addEventListener('click', closeDrawer);

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });
  }

  function setupHeroSlider() {
    const slider = document.querySelector('[data-slider]');
    const dotsContainer = document.querySelector('.hero-dots');
    if (!slider || !dotsContainer) return;

    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    if (!slides.length) return;

    const heroState = state.hero;
    heroState.slider = slider;
    heroState.dotsContainer = dotsContainer;
    heroState.slides = slides;
    heroState.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'hero-dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `スライド${index + 1}`);
      dot.addEventListener('click', () => {
        stopAutoSlide();
        goToSlide(index);
        startAutoSlide();
      });
      dotsContainer.appendChild(dot);
    });

    goToSlide(0, { animate: false });
    startAutoSlide();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoSlide();
      } else {
        startAutoSlide();
      }
    });

    slider.addEventListener('pointerdown', handlePointerDown);
    slider.addEventListener('pointermove', handlePointerMove);
    slider.addEventListener('pointerup', handlePointerUp);
    slider.addEventListener('pointercancel', handlePointerUp);
    slider.addEventListener('pointerleave', handlePointerUp);

    function goToSlide(index, options = {}) {
      const total = heroState.slides.length;
      const normalized = ((index % total) + total) % total;
      heroState.currentIndex = normalized;
      heroState.sliderWidth = slider.clientWidth || 1;
      const targetLeft = heroState.sliderWidth * normalized;
      heroState.maxScroll = slider.scrollWidth - heroState.sliderWidth;

      if (typeof slider.scrollTo === 'function') {
        slider.scrollTo({
          left: targetLeft,
          behavior: options.animate === false ? 'auto' : 'smooth',
        });
      } else {
        slider.scrollLeft = targetLeft;
      }

      heroState.startScroll = targetLeft;
      updateDots(normalized);
    }

    function updateDots(activeIndex) {
      const dots = heroState.dotsContainer.querySelectorAll('.hero-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === activeIndex);
        dot.setAttribute('aria-selected', idx === activeIndex ? 'true' : 'false');
      });
    }

    function startAutoSlide() {
      if (heroState.prefersReducedMotion) return;
      stopAutoSlide();
      heroState.autoSlideTimer = window.setInterval(() => {
        goToSlide(heroState.currentIndex + 1);
      }, 6000);
    }

    function stopAutoSlide() {
      if (heroState.autoSlideTimer) {
        clearInterval(heroState.autoSlideTimer);
        heroState.autoSlideTimer = null;
      }
    }

    function handlePointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      heroState.isDragging = true;
      heroState.pointerId = event.pointerId;
      heroState.dragStartX = event.clientX;
      heroState.dragDelta = 0;
      heroState.sliderWidth = slider.clientWidth || 1;
      slider.classList.add('is-dragging');
      stopAutoSlide();
      heroState.startScroll = slider.scrollLeft;
      heroState.sliderWidth = slider.clientWidth || 1;
      heroState.maxScroll = slider.scrollWidth - heroState.sliderWidth;

      if (slider.setPointerCapture) {
        slider.setPointerCapture(event.pointerId);
      }
    }

    function handlePointerMove(event) {
      if (!heroState.isDragging || heroState.pointerId !== event.pointerId) {
        return;
      }

      const delta = event.clientX - heroState.dragStartX;
      heroState.dragDelta = delta;
      const maxScroll = Math.max(heroState.maxScroll || 0, 0);
      const nextScroll = Math.min(Math.max(heroState.startScroll - delta, 0), maxScroll);
      slider.scrollLeft = nextScroll;
    }

    function handlePointerUp(event) {
      if (!heroState.isDragging || (heroState.pointerId !== null && heroState.pointerId !== event.pointerId)) {
        return;
      }

      const diff = slider.scrollLeft - heroState.startScroll;
      const threshold = heroState.sliderWidth * 0.18;
      slider.classList.remove('is-dragging');
      heroState.isDragging = false;

      if (slider.releasePointerCapture && heroState.pointerId !== null) {
        slider.releasePointerCapture(heroState.pointerId);
      }

      heroState.pointerId = null;

      if (diff > threshold || heroState.dragDelta < -threshold) {
        goToSlide(heroState.currentIndex + 1);
      } else if (diff < -threshold || heroState.dragDelta > threshold) {
        goToSlide(heroState.currentIndex - 1);
      } else {
        goToSlide(heroState.currentIndex);
      }

      startAutoSlide();
    }
  }

  function setupReports() {
    const container = document.querySelector('[data-reports-slider]');
    const track = container ? container.querySelector('[data-reports-track]') : null;
    const pagination = document.querySelector('[data-reports-pagination]');
    const tabs = Array.from(document.querySelectorAll('.reports-tab'));

    if (!container || !track || !pagination || !tabs.length) return;

    const sliderState = state.reportsSlider;
    sliderState.container = container;
    sliderState.track = track;
    sliderState.pagination = pagination;
    sliderState.counter = document.querySelector('[data-reports-counter]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const category = tab.getAttribute('data-category');
        if (state.currentCategory === category) return;
        state.currentCategory = category;
        sliderState.currentIndex = 0;
        updateCategoryTabs(tabs, category);
        renderReports({ resetIndex: true });
      });
    });

    container.addEventListener('pointerdown', handleReportsPointerDown);
    container.addEventListener('pointermove', handleReportsPointerMove);
    container.addEventListener('pointerup', handleReportsPointerUp);
    container.addEventListener('pointercancel', handleReportsPointerUp);
    container.addEventListener('pointerleave', handleReportsPointerUp);
    track.addEventListener('click', handleTrackClick, true);

    window.addEventListener('resize', handleReportsResize);

    loadReportsData()
      .then((data) => {
        state.reports = Array.isArray(data) ? data : [];
        renderReports({ resetIndex: true });
      })
      .catch((error) => {
        console.error(error);
        showReportsMessage('記事を読み込めませんでした。', 'reports-error');
      });
  }

  function updateCategoryTabs(tabs, activeCategory) {
    tabs.forEach((tab) => {
      const isActive = tab.getAttribute('data-category') === activeCategory;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function renderReports({ resetIndex = true } = {}) {
    const sliderState = state.reportsSlider;
    const { track, container, pagination, counter } = sliderState;
    if (!track || !container || !pagination) return;

    track.innerHTML = '';
    pagination.innerHTML = '';

    const parseDate = (value) => {
      if (!value) return new Date(0);
      const normalized = value.replace(/\//g, '-');
      return new Date(normalized);
    };

    const filteredArticles = state.reports
      .filter((item) => item.category === state.currentCategory)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    sliderState.totalArticles = filteredArticles.length;

    if (!filteredArticles.length) {
      showReportsMessage('該当する記事がありません。', 'reports-empty');
      sliderState.pages = 0;
      sliderState.currentIndex = 0;
      sliderState.currentTranslate = 0;
      sliderState.track.style.transform = 'translateX(0)';
      if (counter) counter.textContent = '';
      return;
    }

    container.classList.remove('is-empty');
    sliderState.allowClick = true;

    filteredArticles.forEach((article) => {
      const card = createReportCard(article);
      track.appendChild(card);
    });

    window.requestAnimationFrame(() => {
      updateReportsLayout({ resetIndex });
      updateReportsCounter();
    });
  }

  function updateReportsLayout({ resetIndex = false } = {}) {
    const sliderState = state.reportsSlider;
    const { track, container, pagination } = sliderState;
    if (!track || !container || !pagination) return;

    const cards = Array.from(track.querySelectorAll('.report-card'));
    if (!cards.length) {
      pagination.innerHTML = '';
      sliderState.pages = 0;
      sliderState.currentIndex = 0;
      sliderState.currentTranslate = 0;
      track.style.transform = 'translateX(0)';
      return;
    }

    const perView = getReportsPerView();
    sliderState.perView = perView;

    cards.forEach((card) => {
      card.style.flex = `0 0 ${100 / perView}%`;
    });

    const gap = getGapValue(track);
    sliderState.gap = gap;
    sliderState.containerWidth = container.clientWidth || 1;

    const cardRect = cards[0].getBoundingClientRect();
    sliderState.cardWidth = cardRect.width;
    sliderState.step = cardRect.width + gap;
    sliderState.pages = Math.max(1, Math.ceil(cards.length / perView));
    const totalWidth = cardRect.width * cards.length + gap * (cards.length - 1);
    sliderState.maxTranslate = Math.max(0, totalWidth - sliderState.containerWidth);

    if (resetIndex) {
      sliderState.currentIndex = 0;
      sliderState.currentTranslate = 0;
    } else {
      sliderState.currentIndex = clamp(sliderState.currentIndex, 0, sliderState.pages - 1);
    }

    buildReportsDots();
    goToReportsSlide(sliderState.currentIndex, { animate: false });
  }

  function buildReportsDots() {
    const sliderState = state.reportsSlider;
    const { pagination, pages, totalArticles, track } = sliderState;
    if (!pagination) return;

    pagination.innerHTML = '';
    sliderState.dots = [];

    if (!track || totalArticles < 3 || pages <= 1) {
      return;
    }

    const dotCount = Math.min(pages, 3);

    for (let i = 0; i < dotCount; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pagination-dot';
      dot.dataset.index = String(i);
      dot.addEventListener('click', () => {
        const page = Number.parseInt(dot.dataset.page || '0', 10);
        goToReportsSlide(page);
      });
      pagination.appendChild(dot);
      sliderState.dots.push(dot);
    }

    updateReportsDots();
    updateReportsCounter();
  }

  function updateReportsDots() {
    const sliderState = state.reportsSlider;
    const { dots, pages, currentIndex, totalArticles } = sliderState;
    if (!dots || !dots.length) return;

    const dotCount = dots.length;

    dots.forEach((dot) => {
      dot.classList.remove('is-active', 'is-edge-left', 'is-edge-right');
    });

    if (totalArticles < 3 || pages <= 1) {
      dots.forEach((dot) => {
        dot.dataset.page = '0';
      });
      return;
    }

    if (pages <= dotCount) {
      dots.forEach((dot, idx) => {
        dot.dataset.page = String(idx);
        dot.disabled = idx === currentIndex;
        if (idx === currentIndex) {
          dot.classList.add('is-active');
        }
      });

      if (currentIndex === 0) {
        dots[0].classList.add('is-edge-left');
      }
      if (currentIndex === pages - 1) {
        dots[dotCount - 1].classList.add('is-edge-right');
      }
      return;
    }

    // pages > dotCount (i.e. > 3) → show first, current, last representation
    const firstDot = dots[0];
    const lastDot = dots[dotCount - 1];
    const middleDot = dots.length === 3 ? dots[1] : null;

    firstDot.dataset.page = '0';
    lastDot.dataset.page = String(pages - 1);

    if (middleDot) {
      let middleTarget = currentIndex;
      if (currentIndex === 0) {
        middleTarget = Math.min(1, pages - 1);
      } else if (currentIndex === pages - 1) {
        middleTarget = Math.max(pages - 2, 0);
      }
      middleDot.dataset.page = String(middleTarget);
    }

    if (currentIndex === 0) {
      firstDot.classList.add('is-edge-left');
    } else if (currentIndex === pages - 1) {
      lastDot.classList.add('is-edge-right');
    } else if (middleDot) {
      middleDot.classList.add('is-active');
    }
  }

  function goToReportsSlide(index, options = {}) {
    const sliderState = state.reportsSlider;
    const { track } = sliderState;
    if (!track || sliderState.pages === 0) return;

    const clampedIndex = clamp(index, 0, sliderState.pages - 1);
    sliderState.currentIndex = clampedIndex;

    const targetTranslate = clamp(
      clampedIndex * sliderState.step,
      0,
      sliderState.maxTranslate,
    );

    sliderState.currentTranslate = targetTranslate;

    if (options.animate === false) {
      track.style.transition = 'none';
      track.style.transform = `translateX(-${targetTranslate}px)`;
      requestAnimationFrame(() => {
        track.style.transition = '';
      });
    } else {
      track.style.transition = '';
      track.style.transform = `translateX(-${targetTranslate}px)`;
    }

    updateReportsDots();
    updateReportsCounter();
  }

  function updateReportsCounter() {
    const sliderState = state.reportsSlider;
    const { counter, perView, currentIndex, totalArticles } = sliderState;
    if (!counter) return;

    if (!totalArticles) {
      counter.textContent = '';
      return;
    }

    const start = currentIndex * perView + 1;
    const end = Math.min(totalArticles, start + perView - 1);
    counter.textContent = `${start} / ${totalArticles}`;
  }
  function handleReportsPointerDown(event) {
    const sliderState = state.reportsSlider;
    if (!sliderState.container || sliderState.pages <= 1) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    sliderState.isDragging = true;
    sliderState.pointerId = event.pointerId;
    sliderState.dragStartX = event.clientX;
    sliderState.startTranslate = sliderState.currentTranslate;
    sliderState.container.classList.add('is-dragging');
    sliderState.allowClick = true;
    sliderState.didDrag = false;

    if (sliderState.track) {
      sliderState.track.style.transition = 'none';
    }

    if (sliderState.container.setPointerCapture) {
      sliderState.container.setPointerCapture(event.pointerId);
    }
  }

  function handleReportsPointerMove(event) {
    const sliderState = state.reportsSlider;
    if (!sliderState.isDragging || sliderState.pointerId !== event.pointerId || !sliderState.track) {
      return;
    }

    const delta = event.clientX - sliderState.dragStartX;
    if (Math.abs(delta) > 6) {
      sliderState.allowClick = false;
      sliderState.didDrag = true;
    }

    const nextTranslate = clamp(
      sliderState.startTranslate - delta,
      0,
      sliderState.maxTranslate,
    );

    sliderState.currentTranslate = nextTranslate;
    sliderState.track.style.transform = `translateX(-${nextTranslate}px)`;
  }

  function handleReportsPointerUp(event) {
    const sliderState = state.reportsSlider;
    if (!sliderState.isDragging || (sliderState.pointerId !== null && sliderState.pointerId !== event.pointerId)) {
      return;
    }

    sliderState.isDragging = false;

    if (sliderState.container) {
      sliderState.container.classList.remove('is-dragging');
      if (sliderState.container.releasePointerCapture && sliderState.pointerId !== null) {
        sliderState.container.releasePointerCapture(sliderState.pointerId);
      }
    }

    sliderState.pointerId = null;

    if (sliderState.track) {
      sliderState.track.style.transition = '';
    }

    if (sliderState.step > 0) {
      const targetIndex = Math.round(sliderState.currentTranslate / sliderState.step);
      goToReportsSlide(targetIndex);
    } else {
      goToReportsSlide(sliderState.currentIndex);
    }

    if (!sliderState.allowClick) {
      window.setTimeout(() => {
        sliderState.allowClick = true;
      }, 0);
    }
    sliderState.didDrag = false;
  }

  function handleTrackClick(event) {
    const sliderState = state.reportsSlider;
    if (!sliderState.allowClick) {
      event.preventDefault();
      event.stopPropagation();
      sliderState.allowClick = true;
    }
  }

  function handleReportsResize() {
    const sliderState = state.reportsSlider;
    if (!sliderState.track) return;

    window.clearTimeout(sliderState.resizeTimer);
    sliderState.resizeTimer = window.setTimeout(() => {
      updateReportsLayout({ resetIndex: false });
    }, 150);
  }

  function showReportsMessage(message, className) {
    const sliderState = state.reportsSlider;
    const { track, container, pagination } = sliderState;
    if (!track || !container || !pagination) return;

    track.innerHTML = '';
    const paragraph = document.createElement('p');
    paragraph.className = className;
    paragraph.textContent = message;
    track.appendChild(paragraph);
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    container.classList.add('is-empty');
    pagination.innerHTML = '';
    sliderState.pages = 0;
    sliderState.currentIndex = 0;
    sliderState.currentTranslate = 0;
    sliderState.totalArticles = 0;
    sliderState.dots = [];
  }

  function createReportCard(article) {
    const card = document.createElement('article');
    card.className = 'report-card';

    const meta = document.createElement('div');
    meta.className = 'report-card__meta';

    const date = document.createElement('span');
    date.className = 'report-card__date';
    date.textContent = article.date || '';

    const title = document.createElement('span');
    title.className = 'report-card__title';
    title.textContent = article.title || '';

    const overview = document.createElement('p');
    overview.className = 'report-card__overview';
    overview.textContent = article.overview || '';

    meta.appendChild(date);
    meta.appendChild(title);

    const arrow = document.createElement('span');
    arrow.className = 'report-card__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '＞';

    card.appendChild(meta);
    card.appendChild(overview);
    card.appendChild(arrow);

    if (article.url) {
      card.dataset.interactive = 'true';
      card.dataset.url = article.url;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      const navigate = () => {
        window.location.href = article.url;
      };
      card.addEventListener('click', navigate);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate();
        }
      });
    } else {
      card.dataset.interactive = 'false';
      card.classList.add('is-static');
    }

    return card;
  }

  }

  function getGapValue(element) {
    const styles = window.getComputedStyle(element);
    const gapValue = styles.columnGap || styles.gap || '0';
    const parsed = Number.parseFloat(gapValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getReportsPerView() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width >= 960) return 3;
    if (width >= 720) return 2;
    return 1;
  }

  function loadReportsData() {
    if (window.__ARTICLES__) {
      return Promise.resolve(window.__ARTICLES__);
    }

    return fetch('/assets/data/articles.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load articles.json');
        }
        return response.json();
      });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
