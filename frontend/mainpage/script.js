const API_URL = "/api/bookings";

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav");
  const bookingForm = document.getElementById("booking-form");
  const formSuccess = document.getElementById("form-success");
  const formAlert = document.getElementById("form-alert");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnLoader = submitBtn?.querySelector(".btn-loader");

  const closeMobileMenu = () => {
    if (!nav || !hamburger) return;
    nav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  const updateFaqHeights = () => {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const answer = item.querySelector(".faq-answer");
      const symbol = item.querySelector(".faq-symbol");
      const question = item.querySelector(".faq-question");

      if (!answer) return;

      if (item.classList.contains("active")) {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        if (symbol) symbol.textContent = "-";
        if (question) question.setAttribute("aria-expanded", "true");
      } else {
        answer.style.maxHeight = "0px";
        if (symbol) symbol.textContent = "+";
        if (question) question.setAttribute("aria-expanded", "false");
      }
    });
  };

  if (hamburger && nav) {
    hamburger.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const currentItem = button.closest(".faq-item");
      if (!currentItem) return;

      const isActive = currentItem.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach((item) => item.classList.remove("active"));

      if (!isActive) currentItem.classList.add("active");
      updateFaqHeights();
    });
  });

  const getHeaderOffset = () => {
    const header = document.getElementById("site-header");
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

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();

    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
    smoothScrollTo(targetTop, 900);
    window.history.pushState(null, "", targetId);
  }, true);

  const fields = {
    name: document.getElementById("name"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    appliance_type: document.getElementById("appliance_type"),
    problem_description: document.getElementById("problem_description"),
  };

  const errorNodes = {
    name: document.getElementById("name-error"),
    phone: document.getElementById("phone-error"),
    email: document.getElementById("email-error"),
    appliance_type: document.getElementById("appliance-error"),
    problem_description: document.getElementById("problem-error"),
  };

  const labelMap = {
    refrigerator: "Lodówka",
    "washing-machine": "Pralka",
    dishwasher: "Zmywarka",
    "oven-stove": "Piekarnik lub kuchenka",
    dryer: "Suszarka",
    other: "Inne urządzenie",
  };

  const clearFieldError = (fieldName) => {
    const field = fields[fieldName];
    const errorNode = errorNodes[fieldName];
    if (field) field.classList.remove("input-error");
    if (errorNode) errorNode.textContent = "";
  };

  const setFieldError = (fieldName, message) => {
    const field = fields[fieldName];
    const errorNode = errorNodes[fieldName];
    if (field) field.classList.add("input-error");
    if (errorNode) errorNode.textContent = message;
  };

  const clearAllErrors = () => {
    Object.keys(errorNodes).forEach(clearFieldError);
    if (formAlert) {
      formAlert.hidden = true;
      formAlert.textContent = "";
    }
  };

  const showFormAlert = (message) => {
    if (!formAlert) return;
    formAlert.textContent = message;
    formAlert.hidden = false;
  };

  const validateForm = () => {
    clearAllErrors();

    const values = {
      name: fields.name?.value.trim() || "",
      phone: fields.phone?.value.trim() || "",
      email: fields.email?.value.trim() || "",
      appliance_type: fields.appliance_type?.value.trim() || "",
      problem_description: fields.problem_description?.value.trim() || "",
    };

    let valid = true;

    if (values.name.length < 2) {
      setFieldError("name", "Podaj imię i nazwisko.");
      valid = false;
    }

    const digitsOnly = values.phone.replace(/\D/g, "");
    const nationalNumber = digitsOnly.startsWith("48") ? digitsOnly.slice(2) : digitsOnly;
    const isPolishMobile = /^[4-8]\d{8}$/.test(nationalNumber);

    if (!/^\+?[\d\s()-]{9,20}$/.test(values.phone) || !isPolishMobile) {
      setFieldError("phone", "Podaj poprawny polski numer komórkowy.");
      valid = false;
    }

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setFieldError("email", "Podaj poprawny adres e-mail.");
      valid = false;
    }

    if (!values.appliance_type) {
      setFieldError("appliance_type", "Wybierz typ urządzenia.");
      valid = false;
    }

    if (values.problem_description.length < 10) {
      setFieldError("problem_description", "Opisz problem w kilku słowach.");
      valid = false;
    }

    return { valid, values };
  };

  const setSubmitting = (isSubmitting) => {
    if (submitBtn) submitBtn.disabled = isSubmitting;
    if (btnText) btnText.hidden = isSubmitting;
    if (btnLoader) btnLoader.hidden = !isSubmitting;
  };

  if (bookingForm && formSuccess) {
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      if (!field) return;
      field.addEventListener("input", () => clearFieldError(fieldName));
      field.addEventListener("change", () => clearFieldError(fieldName));
    });

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const { valid, values } = validateForm();
      if (!valid) return;

      setSubmitting(true);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          if (response.status === 422 && payload?.detail) {
            payload.detail.forEach((issue) => {
              const fieldName = issue.loc?.[issue.loc.length - 1];
              if (fieldName && errorNodes[fieldName]) {
                const message = fieldName === "phone"
                  ? "Podaj poprawny polski numer komórkowy."
                  : fieldName === "email"
                    ? "Podaj poprawny adres e-mail."
                    : "Sprawdź to pole.";
                setFieldError(fieldName, message);
              }
            });
          } else {
            showFormAlert("Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.");
          }
          return;
        }

        bookingForm.reset();
        if (fields.appliance_type) fields.appliance_type.value = "";
        bookingForm.hidden = true;
        formSuccess.hidden = false;

        const applianceText = labelMap[values.appliance_type] || "urządzenie";
        formSuccess.querySelector("p").textContent = `Dziękujemy. Zgłoszenie dotyczące: ${applianceText.toLowerCase()} zostało wysłane. Skontaktujemy się z Tobą, aby potwierdzić termin wizyty.`;
      } catch {
        showFormAlert("Serwer jest chwilowo niedostępny. Spróbuj ponownie później.");
      } finally {
        setSubmitting(false);
      }
    });
  }

  updateFaqHeights();
  window.addEventListener("resize", updateFaqHeights);
});
