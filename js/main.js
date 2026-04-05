/**
 * Telos Fitness - Main Interactivity
 * Premium micro-interactions, scroll animations, 3D tilt, counters, cursor glow
 */

document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  const body = document.body;
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const faqItems = document.querySelectorAll('.faq-item');
  const sections = document.querySelectorAll('[id]');

  // ===== 1. SCROLL-BASED NAV (Glassmorphism) =====
  let lastScroll = 0;
  window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
    lastScroll = scrollY;
    updateActiveNavLink();
  }, { passive: true });

  // ===== 2. MOBILE MENU TOGGLE =====
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburger?.addEventListener('click', function() {
    body.classList.toggle('nav-open');
    hamburger.classList.toggle('active');
    mobileMenu?.classList.toggle('active');
  });

  // ===== DROPDOWN TOGGLES =====
  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
    });
  });

  document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      this.closest('.mobile-dropdown').classList.toggle('active');
    });
  });

  // Close mobile menu when clicking on a nav link
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (this.classList.contains('mobile-dropdown-toggle') || this.classList.contains('nav-dropdown-toggle')) return;
      body.classList.remove('nav-open');
      hamburger?.classList.remove('active');
      mobileMenu?.classList.remove('active');
    });
  });

  // ===== 3. SMOOTH SCROLL =====
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const targetId = href.substring(1);
      if (!targetId) return;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ===== 4. SCROLL ANIMATIONS (Enhanced with blur) =====
  const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Stagger children with enhanced delays
  document.querySelectorAll('.stagger-children').forEach(container => {
    const children = container.querySelectorAll('.animate-on-scroll');
    children.forEach((child, index) => {
      child.style.setProperty('--stagger-index', index);
      child.style.animationDelay = (index * 0.1) + 's';
    });
  });

  // ===== 5. FAQ ACCORDION (Enhanced timing) =====
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', function() {
      const isActive = item.classList.contains('active');
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ===== 6. ACTIVE NAV LINK =====
  function updateActiveNavLink() {
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 200) {
        currentSection = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }
  updateActiveNavLink();

  // ===== 7. CURSOR GLOW (Desktop only) =====
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.innerWidth > 768) {
    let cursorX = 0, cursorY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', function(e) {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (!cursorGlow.classList.contains('active')) {
        cursorGlow.classList.add('active');
      }
    });

    function animateCursor() {
      glowX += (cursorX - glowX) * 0.08;
      glowY += (cursorY - glowY) * 0.08;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mouseleave', () => {
      cursorGlow.classList.remove('active');
    });
    document.addEventListener('mouseenter', () => {
      cursorGlow.classList.add('active');
    });
  }

  // ===== 8. HERO MOUSE-TRACKING SPOTLIGHT =====
  const heroSpotlight = document.querySelector('.hero-spotlight');
  const heroSection = document.querySelector('.hero');

  if (heroSpotlight && heroSection && window.innerWidth > 768) {
    heroSection.addEventListener('mousemove', function(e) {
      const rect = heroSection.getBoundingClientRect();
      heroSpotlight.style.left = (e.clientX - rect.left) + 'px';
      heroSpotlight.style.top = (e.clientY - rect.top) + 'px';
    });
  }

  // ===== 9. 3D CARD TILT EFFECT =====
  const tiltCards = document.querySelectorAll('.card-tilt');

  if (window.innerWidth > 768) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', function(e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((y - centerY) / centerY) * -6;
        const tiltY = ((x - centerX) / centerX) * 6;

        card.style.setProperty('--tilt-x', tiltX + 'deg');
        card.style.setProperty('--tilt-y', tiltY + 'deg');
        card.style.setProperty('--glow-x', (x / rect.width * 100) + '%');
        card.style.setProperty('--glow-y', (y / rect.height * 100) + '%');
      });

      card.addEventListener('mouseleave', function() {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--glow-x', '50%');
        card.style.setProperty('--glow-y', '50%');
      });
    });
  }

  // ===== 10. STAT COUNTER ANIMATION =====
  const statNumbers = document.querySelectorAll('[data-count]');
  let statsAnimated = false;

  const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.5 });

  if (statNumbers.length > 0) {
    const statsContainer = statNumbers[0].closest('.about-stats-row');
    if (statsContainer) {
      statsObserver.observe(statsContainer);
    }
  }

  function animateCounters() {
    statNumbers.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 1200;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      }

      el.textContent = '0';
      requestAnimationFrame(update);
    });
  }

  // ===== 11. MAGNETIC BUTTON EFFECT =====
  const magneticButtons = document.querySelectorAll('.btn-primary, .btn-outline');

  if (window.innerWidth > 768) {
    magneticButtons.forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translateY(-2px) translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
      });
    });
  }

  // ===== 12. PARALLAX HERO CONTENT ON SCROLL =====
  const heroContent = document.querySelector('.hero-content');

  if (heroContent) {
    window.addEventListener('scroll', function() {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        const opacity = 1 - (scrollY / (window.innerHeight * 0.7));
        const translateY = scrollY * 0.3;
        heroContent.style.opacity = Math.max(0, opacity);
        heroContent.style.transform = `translateY(${translateY}px)`;
      }
    }, { passive: true });
  }

  // ===== 13. RIPPLE EFFECT ON BUTTON CLICK =====
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out forwards;
        pointer-events: none;
        z-index: 10;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyle);

  // ===== 14. SMOOTH SECTION HEADING REVEAL =====
  // Add slide-from-left animation to section labels
  document.querySelectorAll('.section-label').forEach(label => {
    if (!label.closest('.hero')) {
      label.classList.add('animate-on-scroll');
      label.setAttribute('data-anim', 'slide-left');
      observer.observe(label);
    }
  });
});
