/* ============================================================
   EXOTICS BY LEGACY — main.js
   Modular, sequential — no framework dependencies
============================================================ */

/* ── 1. PRELOADER ─────────────────────────────────────────── */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  let isHidden = false;

  const hide = () => {
    if (isHidden) return;
    isHidden = true;

    preloader.classList.add('hidden');
    preloader.style.pointerEvents = 'none';

    preloader.addEventListener('transitionend', () => {
      preloader.style.display = 'none';
      
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    }, { once: true });
  };

  setTimeout(hide, 1500);

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide);
  }
})();

/* ── HEADER SCROLL STATE ──────────────────────────────────── */
(function initHeaderScrollState() {
  const header = document.getElementById('site-header');
  const spacer = document.querySelector('.hero-scroll-spacer');
  if (!header) return;

  header.classList.remove('header-hidden');

  const update = () => {
    const y = window.scrollY;

    // Gold border + blur appear only when next section starts showing
    // = when user has scrolled past the hero spacer
    const heroThreshold = spacer
      ? spacer.offsetTop + spacer.offsetHeight - window.innerHeight
      : window.innerHeight;

    if (y > heroThreshold) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    // Safety gate: keep header visible near top
    if (y < window.innerHeight * 0.5) {
      document.body.classList.remove('scrolled-deep');
      header.classList.remove('header-hidden');
    } else {
      document.body.classList.add('scrolled-deep');
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
})();






/* ── 2. HERO VIDEO — SIMPLE STATE MACHINE ─────────────────── */
(function initHeroVideo() {
  const spacer = document.querySelector('.hero-scroll-spacer');
  const video = document.getElementById('hero-video');
  const textInit = document.getElementById('text-initial');
  const textFinal = document.getElementById('text-final');
  if (!spacer || !video) return;

  video.pause();
  video.currentTime = 0;

  /* ── State: 'waiting' | 'playing' | 'done' ── */
  let state = 'waiting';
  let resetting = false;
  let textSwitched = false;
  let lastTouchY = 0;
  let lastY = window.scrollY;

  const inHeroZone = () => {
    const r = spacer.getBoundingClientRect();
    return r.top <= 0 && r.bottom > window.innerHeight * 0.1;
  };

  function showFinalText() {
    if (textSwitched) return;
    textSwitched = true;
    textFinal.style.display = 'block';
    requestAnimationFrame(() => {
      textInit?.classList.add('hidden-text');
      textFinal?.classList.add('visible');
      textFinal?.removeAttribute('aria-hidden');
      textInit?.setAttribute('aria-hidden', 'true');
    });
  }

  function showInitialText() {
    if (!textSwitched) return;
    textSwitched = false;
    textInit.style.display = 'block';
    requestAnimationFrame(() => {
      textFinal?.classList.remove('visible');
      textInit?.classList.remove('hidden-text');
      textFinal?.setAttribute('aria-hidden', 'true');
      textInit?.removeAttribute('aria-hidden');
    });
  }

  textInit?.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'opacity' && textInit.classList.contains('hidden-text')) {
      textInit.style.display = 'none';
    }
  });
  textFinal?.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'opacity' && !textFinal.classList.contains('visible')) {
      textFinal.style.display = 'none';
    }
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration || state !== 'playing') return;
    // Unlock and show text 2 seconds before end
    if (video.duration - video.currentTime <= 2.0 && !textSwitched) {
      showFinalText();
      state = 'done'; // this unlocks scroll
    }
  });

  video.addEventListener('ended', () => {
    if (state !== 'done') {
      state = 'done';
      showFinalText();
    }
  });

  function smoothReset() {
    if (resetting || state === 'waiting' || state === 'playing') return;
    resetting = true;

    showInitialText();

    video.style.transition = 'opacity 0.3s ease';
    video.style.opacity = '0';

    setTimeout(() => {
      video.pause();
      video.currentTime = 0;
      state = 'waiting';

      video.style.opacity = '1';

      setTimeout(() => {
        video.style.transition = '';
        resetting = false;
      }, 350);
    }, 300);
  }

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    // Reset when user scrolls back up into the hero container and scrolling upwards
    if (y < lastY && inHeroZone() && state === 'done') {
      smoothReset();
    }

    lastY = y;
  }, { passive: true });

  /* ── WHEEL ── */
  window.addEventListener('wheel', (e) => {
    if (!inHeroZone()) return;

    if (state === 'playing') {
      return;
    }

    if (state === 'waiting' && e.deltaY > 0) {
      state = 'playing';
      video.play().catch(() => { });
      return;
    }
  }, { passive: true });

  /* ── TOUCH ── */
  window.addEventListener('touchstart', (e) => {
    lastTouchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!inHeroZone()) return;
    const delta = lastTouchY - e.touches[0].clientY;

    if (state === 'playing') {
      return;
    }
    if (state === 'waiting' && delta > 5) {
      state = 'playing';
      video.play().catch(() => { });
      return;
    }
  }, { passive: true });

})();


/* ── 3. HEADER HIDE WHEN CTA SECTION ENTERS VIEW ─────────── */


(function initHeaderHide() {
  const header = document.getElementById('site-header');
  const cta = document.getElementById('cta');   // final section above footer
  if (!header || !cta) return;

  const check = () => {
    const ctaTop = cta.getBoundingClientRect().top;
    const vh = window.innerHeight;

    // Hide header once the CTA section enters the viewport
    if (ctaTop < vh && window.scrollY > vh * 0.5) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }
  };

  window.addEventListener('scroll', check, { passive: true });
  check();
})();




/* ── 4. MOBILE HAMBURGER MENU ─────────────────────────────── */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close');
  if (!hamburger || !mobileMenu) return;

  function openSidebar() {
    mobileMenu.classList.add('open');
    overlay?.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // lock page scroll
  }

  function closeSidebar() {
    mobileMenu.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // restore scroll
  }

  // Hamburger toggles sidebar
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  // X close button inside sidebar
  closeBtn?.addEventListener('click', closeSidebar);

  // Clicking backdrop closes sidebar
  overlay?.addEventListener('click', closeSidebar);

  // Clicking any nav link closes sidebar
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeSidebar);
  });

  // Escape key closes sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
})();


/* ── 5. TESTIMONIAL SLIDER ────────────────────────────────── */
(function initTestimonialSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (!slides.length) return;

  let current = 0;
  let autoTimer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5500);
  }

  resetAuto();

  const slider = document.querySelector('.testimonial-slider');
  if (slider) {
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', resetAuto);
  }
})();

/* ── 6. SCROLL REVEAL ─────────────────────────────────────── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(entry.target.parentElement.children);
          const delay = siblings.indexOf(entry.target) * 90;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();
