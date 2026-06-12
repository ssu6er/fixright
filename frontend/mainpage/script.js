document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const nav = document.querySelector('.nav');
  const bookingForm = document.getElementById('booking-form');
  const formSuccess = document.getElementById('form-success');

  const closeMobileMenu = () => {
    if (!nav || !hamburger) return;
    nav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  const updateFaqHeights = () => {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const answer = item.querySelector('.faq-answer');
      const symbol = item.querySelector('.faq-symbol');
      const question = item.querySelector('.faq-question');

      if (!answer) return;

      if (item.classList.contains('active')) {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        if (symbol) symbol.textContent = '-';
        if (question) question.setAttribute('aria-expanded', 'true');
      } else {
        answer.style.maxHeight = '0px';
        if (symbol) symbol.textContent = '+';
        if (question) question.setAttribute('aria-expanded', 'false');
      }
    });
  };

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const currentItem = button.closest('.faq-item');
      if (!currentItem) return;

      const isActive = currentItem.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach((item) => item.classList.remove('active'));

      if (!isActive) currentItem.classList.add('active');
      updateFaqHeights();
    });
  });

  if (bookingForm && formSuccess) {
    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      bookingForm.hidden = true;
      formSuccess.hidden = false;
    });
  }

  const getHeaderOffset = () => {
    const header = document.getElementById('site-header');
    return header ? header.offsetHeight + 14 : 14;
  };

  const easeInOutCubic = (time) => (
    time < 0.5
      ? 4 * time * time * time
      : 1 - Math.pow(-2 * time + 2, 3) / 2
  );

  const smoothScrollTo = (targetY, duration = 900) => {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();

    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
    smoothScrollTo(targetTop, 900);
    window.history.pushState(null, '', targetId);
  }, true);

  updateFaqHeights();
  window.addEventListener('resize', updateFaqHeights);
});
