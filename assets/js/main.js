(() => {
  const state = {
    reports: [],
    currentCategory: 'volunteer',
    menu: {
      isOpen: false,
    },
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
      startIndex: 0,
      dragDelta: 0,
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupCircularNav();
    setupHeroSlider();
    setupReports();
  });

  function setupCircularNav() {
    const toggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('[data-circular-nav]');
    const wheel = overlay ? overlay.querySelector('[data-nav-wheel]') : null;
    if (!toggle || !overlay || !wheel) return;

    const items = Array.from(wheel.querySelectorAll('[data-nav-item]'));
    if (!items.length) return;

    const gapAngle = 20;
    const arcSpan = 360 - gapAngle;

    const navState = {
      rotation: 0,
      lastAngle: 0,
      pointerId: null,
      isDragging: false,
      startRotation: 0,
      didDrag: false,
      radius: 0,
      snapTimer: null,
      hideTimer: null,
      resizeTimer: null,
      baseAngles: [],
      step: 0,
      gapAngle,
      arcSpan,
    };

    if (items.length === 1) {
      navState.baseAngles = [0];
      navState.step = 360;
    } else {
      navState.step = 360 / items.length;
      navState.baseAngles = items.map((_, index) => index * navState.step);
      const desiredGapCenter = -90;
      const lastBaseAngle = navState.baseAngles[items.length - 1] ?? 0;
      const gapCenterWithoutRotation = lastBaseAngle + navState.step / 2;
      navState.rotation = normalizeAngle(desiredGapCenter - gapCenterWithoutRotation);
    }

    let lastFocused = null;

    const closeTargets = overlay.querySelectorAll('[data-nav-close]');
    const prefersReducedMotionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const shouldReduceMotion = Boolean(prefersReducedMotionQuery && prefersReducedMotionQuery.matches);
    let openingAnimation = null;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeNav();
      } else {
        openNav();
      }
    });

    closeTargets.forEach((element) => {
      element.addEventListener('click', () => {
        closeNav();
      });
    });

    overlay.addEventListener('transitionend', (event) => {
      if (event.target !== overlay || event.propertyName !== 'opacity') return;
      if (!state.menu.isOpen) {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      }
    });

    wheel.addEventListener('pointerdown', handlePointerDown);
    wheel.addEventListener('pointermove', handlePointerMove);
    wheel.addEventListener('pointerup', handlePointerUp);
    wheel.addEventListener('pointercancel', handlePointerUp);
    wheel.addEventListener('pointerleave', handlePointerUp);
    wheel.addEventListener('wheel', handleWheel, { passive: false });

    window.addEventListener('resize', handleResize);

    items.forEach((item) => {
      item.addEventListener('click', (event) => {
        if (navState.didDrag) {
          navState.didDrag = false;
          return;
        }

        event.preventDefault();
        const targetSelector = item.dataset.target;
        const url = item.dataset.url;
        closeNav();

        window.setTimeout(() => {
          if (targetSelector) {
            const target = document.querySelector(targetSelector);
            if (target && typeof target.scrollIntoView === 'function') {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else if (url) {
            window.open(url, '_blank', 'noopener');
          }
        }, 280);
      });
    });

    function openNav() {
      if (state.menu.isOpen) return;
      lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        overlay.classList.add('is-visible');
        playOpeningAnimation();
        updateWheel(true);
      });
      state.menu.isOpen = true;
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'メニューを閉じる');
      focusActiveItem();
      document.addEventListener('keydown', handleKeydown);
    }

    function closeNav() {
      if (!state.menu.isOpen) return;
      state.menu.isOpen = false;
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'メニューを開く');
      document.body.classList.remove('nav-open');
      document.removeEventListener('keydown', handleKeydown);
      wheel.classList.remove('is-dragging');
      cancelOpeningAnimation();
      navState.isDragging = false;
      navState.pointerId = null;
      navState.didDrag = false;
      window.clearTimeout(navState.snapTimer);
      window.clearTimeout(navState.resizeTimer);
      window.clearTimeout(navState.hideTimer);
      navState.snapTimer = null;
      navState.resizeTimer = null;
      navState.hideTimer = window.setTimeout(() => {
        if (!state.menu.isOpen) {
          overlay.hidden = true;
          overlay.setAttribute('aria-hidden', 'true');
        }
      }, 260);

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        toggle.focus();
      }
    }

    function playOpeningAnimation() {
      if (shouldReduceMotion) return;
      cancelOpeningAnimation();
      if (typeof wheel.animate === 'function') {
        openingAnimation = wheel.animate(
          [
            { transform: 'rotate(57deg) scale(0.91)' },
            { transform: 'rotate(-30deg) scale(1.06)', offset: 0.55 },
            { transform: 'rotate(0deg) scale(1)' },
          ],
          {
            duration: 650,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          },
        );
        openingAnimation.onfinish = () => {
          wheel.style.transform = '';
          openingAnimation = null;
        };
        openingAnimation.oncancel = () => {
          wheel.style.transform = '';
          openingAnimation = null;
        };
      } else {
        // Fallback for older browsers: apply CSS animation via inline style.
        wheel.style.animation = 'circular-nav-opening-spin 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards';
        window.setTimeout(() => {
          wheel.style.animation = '';
        }, 670);
      }
    }

    function cancelOpeningAnimation() {
      if (openingAnimation) {
        openingAnimation.cancel();
        openingAnimation = null;
      }
      if (wheel.style.animation) {
        wheel.style.animation = '';
      }
      wheel.style.transform = '';
    }

    function handleKeydown(event) {
      if (!state.menu.isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNav();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        rotateBy(-navState.step);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        rotateBy(navState.step);
      }
    }

    function handlePointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      navState.isDragging = true;
      navState.pointerId = event.pointerId;
      navState.startRotation = navState.rotation;
      navState.lastAngle = getPointerAngle(event);
      navState.didDrag = false;
      wheel.classList.add('is-dragging');
      if (wheel.setPointerCapture) {
        wheel.setPointerCapture(event.pointerId);
      }
    }

    function handlePointerMove(event) {
      if (!navState.isDragging || navState.pointerId !== event.pointerId) {
        return;
      }

      const angle = getPointerAngle(event);
      if (Number.isNaN(angle)) return;

      const delta = shortestAngle(navState.lastAngle, angle);
      navState.rotation += delta;
      navState.lastAngle = angle;

      if (Math.abs(navState.rotation - navState.startRotation) > navState.step * 0.2) {
        navState.didDrag = true;
      }

      updateWheel();
    }

    function handlePointerUp(event) {
      if (!navState.isDragging || (navState.pointerId !== null && navState.pointerId !== event.pointerId)) {
        return;
      }

      navState.isDragging = false;
      navState.pointerId = null;
      wheel.classList.remove('is-dragging');

      if (wheel.releasePointerCapture && event.pointerId !== undefined) {
        wheel.releasePointerCapture(event.pointerId);
      }

      snapToActive();
      navState.didDrag = false;
    }

    function handleWheel(event) {
      event.preventDefault();
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Number.isNaN(delta)) return;

      navState.rotation += delta * 0.35;
      navState.didDrag = true;
      updateWheel();
      scheduleSnap();
    }

    function handleResize() {
      if (!state.menu.isOpen) return;
      window.clearTimeout(navState.resizeTimer);
      navState.resizeTimer = window.setTimeout(() => {
        navState.radius = 0;
        updateWheel(true);
      }, 140);
    }

    function rotateBy(amount) {
      navState.rotation += amount;
      navState.didDrag = true;
      updateWheel();
      scheduleSnap();
    }

    function scheduleSnap() {
      window.clearTimeout(navState.snapTimer);
      navState.snapTimer = window.setTimeout(() => {
        snapToActive();
        navState.didDrag = false;
      }, 160);
    }

    function snapToActive() {
      const index = getActiveItemIndex();
      if (index === null) return;

      const targetAngle = navState.baseAngles[index];
      const current = normalizeAngle(targetAngle + navState.rotation);
      navState.rotation -= current;
      updateWheel();
      focusActiveItem();
    }

    function focusActiveItem() {
      const index = getActiveItemIndex();
      const item = items[index] || items[0];
      if (item) {
        item.focus({ preventScroll: true });
      }
    }

    function updateWheel(force = false) {
      const rect = wheel.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      if (force || !navState.radius) {
        navState.radius = Math.max(rect.width / 2 - 12, rect.width * 0.62);
      }

      const activeIndex = getActiveItemIndex();

      items.forEach((item, index) => {
        const baseAngle = navState.baseAngles[index] ?? 0;
        const angle = baseAngle + navState.rotation;
        const distance = Math.abs(normalizeAngle(angle));

        const proximity = Math.max(0, 1 - Math.min(distance / (navState.step * 1.1 || 1), 1));
        const scale = 0.84 + proximity * 0.22;
        const opacity = 0.52 + proximity * 0.42;

        const angleRad = (angle * Math.PI) / 180;
        const targetX = Math.cos(angleRad) * navState.radius;
        const targetY = Math.sin(angleRad) * navState.radius;
        const translateX = `calc(${targetX.toFixed(3)}px - 50%)`;
        const translateY = `calc(${targetY.toFixed(3)}px - 50%)`;

        item.style.transform = `translate(${translateX}, ${translateY}) scale(${scale.toFixed(3)})`;
        item.style.opacity = opacity.toFixed(3);
        item.style.zIndex = String(100 + Math.round(proximity * 100));
        item.classList.toggle('is-active', index === activeIndex);
        item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
      });

      const toPositive = (value) => ((value % 360) + 360) % 360;
      if (items.length >= 2) {
        const topAngle = toPositive(navState.baseAngles[0] + navState.rotation);
        const contactAngle = toPositive(navState.baseAngles[items.length - 1] + navState.rotation);
        const forwardDiff = (topAngle - contactAngle + 360) % 360;
        const gapCenter = (contactAngle + forwardDiff / 2) % 360;
        const arcStart = (gapCenter + navState.gapAngle / 2) % 360;
        const cssArcStart = (arcStart + 90) % 360;
        wheel.style.setProperty('--nav-arc-start', `${cssArcStart}deg`);
      } else {
        const cssArcStart = (toPositive(navState.rotation) + 90) % 360;
        wheel.style.setProperty('--nav-arc-start', `${cssArcStart}deg`);
      }

      wheel.style.setProperty('--nav-arc-span', `${navState.arcSpan}deg`);
    }

    function getActiveItemIndex() {
      let indexOfActive = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      items.forEach((_, index) => {
        const angle = navState.baseAngles[index] + navState.rotation;
        const distance = Math.abs(normalizeAngle(angle));
        if (distance < minDistance) {
          minDistance = distance;
          indexOfActive = index;
        }
      });

      return indexOfActive;
    }

    function getPointerAngle(event) {
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radians = Math.atan2(event.clientY - cy, event.clientX - cx);
      return radians * (180 / Math.PI);
    }

    function shortestAngle(from, to) {
      let diff = to - from;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      return diff;
    }

    function normalizeAngle(angle) {
      const normalized = ((angle % 360) + 360) % 360;
      return normalized > 180 ? normalized - 360 : normalized;
    }
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
    const reduceMotionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    heroState.prefersReducedMotion = Boolean(reduceMotionQuery && reduceMotionQuery.matches);

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
      const threshold = heroState.sliderWidth * 0.1;
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
    sliderState.startIndex = sliderState.currentIndex;
    sliderState.dragDelta = 0;
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

    sliderState.dragDelta = delta;

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
      const diff = sliderState.currentTranslate - sliderState.startTranslate;
      const threshold = sliderState.step * 0.2;
      let targetIndex = sliderState.startIndex;

      if (diff > threshold || sliderState.dragDelta < -threshold) {
        targetIndex += 1;
      } else if (diff < -threshold || sliderState.dragDelta > threshold) {
        targetIndex -= 1;
      }

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
    sliderState.dragDelta = 0;
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
