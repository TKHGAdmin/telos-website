/**
 * Telos Fitness - Main Interactivity
 * Handles: scroll-based nav, mobile menu, smooth scroll, scroll animations, FAQ accordion, active nav links
 */

document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  const body = document.body;
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const faqItems = document.querySelectorAll('.faq-item');
  const sections = document.querySelectorAll('[id]');

  // ===== 1. SCROLL-BASED NAV =====
  // Add .scrolled class to nav when page scrolls past 50px
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
    updateActiveNavLink();
  });

  // ===== 2. MOBILE MENU TOGGLE =====
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburger?.addEventListener('click', function() {
    body.classList.toggle('nav-open');
    hamburger.classList.toggle('active');
    mobileMenu?.classList.toggle('active');
  });

  // ===== DROPDOWN TOGGLES =====
  // Desktop: prevent default on dropdown toggle links
  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
    });
  });

  // Mobile: toggle dropdown open/close
  document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      this.closest('.mobile-dropdown').classList.toggle('active');
    });
  });

  // Close mobile menu when clicking on a nav link (but not dropdown toggles)
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (this.classList.contains('mobile-dropdown-toggle') || this.classList.contains('nav-dropdown-toggle')) return;
      body.classList.remove('nav-open');
      hamburger?.classList.remove('active');
      mobileMenu?.classList.remove('active');
    });
  });

  // ===== 3. SMOOTH SCROLL =====
  // All internal anchor links scroll smoothly to target section
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      // Only handle internal #anchor links (skip bare "#" from dropdown toggles)
      if (!href || !href.startsWith('#')) return;

      const targetId = href.substring(1);
      if (!targetId) return; // Skip bare "#" (dropdown toggles)
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

  // ===== 4. SCROLL ANIMATIONS =====
  // IntersectionObserver adds .visible class to .animate-on-scroll elements
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — keep the class once visible
      }
    });
  }, observerOptions);

  // Observe all animate-on-scroll elements
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Handle stagger-children — add incremental delays to child elements
  document.querySelectorAll('.stagger-children').forEach(container => {
    const children = container.querySelectorAll('.animate-on-scroll');
    children.forEach((child, index) => {
      child.style.setProperty('--stagger-index', index);
      child.style.animationDelay = (index * 0.1) + 's';
    });
  });

  // ===== 5. FAQ ACCORDION =====
  // Only one FAQ open at a time
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', function() {
      const isActive = item.classList.contains('active');

      // Close all other FAQs
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ===== 6. ACTIVE NAV LINK =====
  // Highlight nav link corresponding to current section in view
  function updateActiveNavLink() {
    let currentSection = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= sectionTop - 200) {
        currentSection = section.getAttribute('id');
      }
    });

    // Update active nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }

  // Call once on load
  updateActiveNavLink();
});
