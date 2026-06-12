const API_URL = "/api/bookings";

const STATUS_LABELS = {
  new: "Nowe",
  scheduled: "Zaplanowane",
  in_progress: "W realizacji",
  completed: "Zakończone",
  cancelled: "Anulowane",
};

const APPLIANCE_LABELS = {
  refrigerator: "Lodówka",
  "washing-machine": "Pralka",
  dishwasher: "Zmywarka",
  "oven-stove": "Piekarnik lub kuchenka",
  dryer: "Suszarka",
  other: "Inne urządzenie",
};

function getToken() {
  return sessionStorage.getItem("auth_token");
}

function getUser() {
  return sessionStorage.getItem("auth_user");
}

function clearSession() {
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
}

if (!getToken()) {
  window.location.replace("/admin/login.html");
}

function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Basic ${getToken()}`,
    },
  });
}

const tbody = document.getElementById("tbody");
const searchEl = document.getElementById("search");
const statusFilterEl = document.getElementById("status-filter");
const countPill = document.getElementById("count-pill");
const footerText = document.getElementById("footer-text");
const lastUpdated = document.getElementById("last-updated");
const cardFooter = document.getElementById("card-footer");
const tableWrap = document.getElementById("table-wrap");
const detailForm = document.getElementById("detail-form");
const detailAlert = document.getElementById("detail-alert");
const detailsEmpty = document.getElementById("details-empty");
const detailsContent = document.getElementById("details-content");
const saveBtn = document.getElementById("btn-save");
const headerUser = document.getElementById("header-user");

let allBookings = [];
let visibleBookings = [];
let selectedBookingId = null;

if (headerUser && getUser()) {
  headerUser.textContent = getUser();
}

async function loadBookings() {
  showState("loading");

  try {
    const response = await authFetch(`${API_URL}?limit=500`);

    if (response.status === 401) {
      clearSession();
      window.location.replace("/admin/login.html");
      return;
    }

    if (!response.ok) {
      throw new Error(`Serwer zwrócił status ${response.status}.`);
    }

    allBookings = await response.json();
    lastUpdated.textContent = formatDateTime(new Date().toISOString(), true);
    renderStats(allBookings);
    applyFilters();

    if (selectedBookingId) {
      const freshSelected = allBookings.find((booking) => booking.id === selectedBookingId);
      if (freshSelected) renderDetails(freshSelected);
      else resetDetails();
    }
  } catch (error) {
    showState("error");
    document.getElementById("error-text").textContent = `Nie udało się pobrać danych: ${error.message}`;
  }
}

function renderStats(bookings) {
  const activeCount = bookings.filter((booking) => ["scheduled", "in_progress"].includes(booking.status)).length;
  const completedCount = bookings.filter((booking) => ["completed", "cancelled"].includes(booking.status)).length;

  document.getElementById("stat-total").textContent = bookings.length;
  document.getElementById("stat-new").textContent = bookings.filter((booking) => booking.status === "new").length;
  document.getElementById("stat-active").textContent = activeCount;
  document.getElementById("stat-completed").textContent = completedCount;
}

function applyFilters() {
  const query = searchEl.value.trim().toLowerCase();
  const statusValue = statusFilterEl.value;

  visibleBookings = allBookings.filter((booking) => {
    const matchesStatus = !statusValue || booking.status === statusValue;
    const haystack = [
      booking.name,
      booking.phone,
      booking.email || "",
      booking.problem_description,
      APPLIANCE_LABELS[booking.appliance_type] || booking.appliance_type,
    ].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesStatus && matchesSearch;
  });

  renderRows(visibleBookings);
}

function renderRows(bookings) {
  if (!bookings.length) {
    showState(searchEl.value.trim() || statusFilterEl.value ? "empty-search" : "empty");
    return;
  }

  showState("data");
  tbody.innerHTML = bookings.map((booking) => `
    <tr data-booking-id="${booking.id}" class="${booking.id === selectedBookingId ? "is-selected" : ""}">
      <td>${booking.id}</td>
      <td>
        <span class="table-name">${escapeHtml(booking.name)}</span>
        <span class="table-sub">${escapeHtml(booking.email || "Bez adresu e-mail")}</span>
      </td>
      <td>${escapeHtml(APPLIANCE_LABELS[booking.appliance_type] || booking.appliance_type)}</td>
      <td class="table-phone">
        <a href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone)}</a>
      </td>
      <td><span class="status-badge status-${booking.status}">${escapeHtml(STATUS_LABELS[booking.status] || booking.status)}</span></td>
      <td class="table-date">${escapeHtml(formatDateTime(booking.created_at))}</td>
    </tr>
  `).join("");

  countPill.textContent = bookings.length;
  footerText.textContent = `Pokazano ${bookings.length} z ${allBookings.length} zgłoszeń`;

  tbody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      const bookingId = Number(row.dataset.bookingId);
      const booking = allBookings.find((item) => item.id === bookingId);
      if (!booking) return;
      selectedBookingId = bookingId;
      renderRows(visibleBookings);
      renderDetails(booking);
    });
  });
}

function renderDetails(booking) {
  selectedBookingId = booking.id;
  detailsEmpty.hidden = true;
  detailsContent.hidden = false;
  hideDetailAlert();

  document.getElementById("detail-id-label").textContent = `#${booking.id}`;
  document.getElementById("detail-name").textContent = booking.name;
  document.getElementById("detail-phone").textContent = booking.phone;
  document.getElementById("detail-email").textContent = booking.email || "Brak";
  document.getElementById("detail-appliance").textContent = APPLIANCE_LABELS[booking.appliance_type] || booking.appliance_type;
  document.getElementById("detail-created").textContent = formatDateTime(booking.created_at);
  document.getElementById("detail-updated").textContent = formatDateTime(booking.updated_at);
  document.getElementById("detail-problem").textContent = booking.problem_description;
  document.getElementById("detail-status").value = booking.status;
  document.getElementById("detail-notes").value = booking.admin_notes || "";

  const badge = document.getElementById("detail-status-badge");
  badge.textContent = STATUS_LABELS[booking.status] || booking.status;
  badge.className = `status-badge status-${booking.status}`;
}

function resetDetails() {
  selectedBookingId = null;
  detailsContent.hidden = true;
  detailsEmpty.hidden = false;
  hideDetailAlert();
  renderRows(visibleBookings);
}

function showState(state) {
  document.getElementById("state-loading").hidden = state !== "loading";
  document.getElementById("state-empty").hidden = !["empty", "empty-search"].includes(state);
  document.getElementById("state-error").hidden = state !== "error";
  tableWrap.hidden = state !== "data";
  cardFooter.hidden = state !== "data";

  document.querySelector("#state-empty p").textContent = state === "empty-search"
    ? "Brak wyników dla aktualnych filtrów. Spróbuj poszerzyć wyszukiwanie."
    : "W systemie nie ma jeszcze żadnych zgłoszeń serwisowych.";

  if (state !== "data") {
    tbody.innerHTML = "";
    countPill.textContent = state === "loading" ? "..." : "0";
  }
}

function showDetailAlert(message) {
  detailAlert.textContent = message;
  detailAlert.hidden = false;
}

function hideDetailAlert() {
  detailAlert.hidden = true;
  detailAlert.textContent = "";
}

detailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideDetailAlert();

  if (!selectedBookingId) {
    showDetailAlert("Najpierw wybierz zgłoszenie z listy.");
    return;
  }

  const status = document.getElementById("detail-status").value;
  const adminNotes = document.getElementById("detail-notes").value.trim();

  saveBtn.disabled = true;

  try {
    const response = await authFetch(`${API_URL}/${selectedBookingId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        admin_notes: adminNotes,
      }),
    });

    if (response.status === 401) {
      clearSession();
      window.location.replace("/admin/login.html");
      return;
    }

    if (!response.ok) {
      throw new Error(`Nie udało się zapisać zmian (${response.status}).`);
    }

    const updatedBooking = await response.json();
    allBookings = allBookings.map((booking) => booking.id === updatedBooking.id ? updatedBooking : booking);
    renderStats(allBookings);
    applyFilters();
    renderDetails(updatedBooking);
    lastUpdated.textContent = formatDateTime(new Date().toISOString(), true);
    showDetailAlert("Zmiany zostały zapisane.");
  } catch (error) {
    showDetailAlert(error.message);
  } finally {
    saveBtn.disabled = false;
  }
});

document.getElementById("btn-reset-detail").addEventListener("click", () => {
  if (!selectedBookingId) return;
  const booking = allBookings.find((item) => item.id === selectedBookingId);
  if (booking) renderDetails(booking);
});

document.getElementById("btn-refresh").addEventListener("click", () => {
  loadBookings();
});

document.getElementById("retry-btn").addEventListener("click", () => {
  loadBookings();
});

document.getElementById("btn-signout").addEventListener("click", () => {
  clearSession();
  window.location.replace("/admin/login.html");
});

searchEl.addEventListener("input", applyFilters);
statusFilterEl.addEventListener("change", applyFilters);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateTime(isoString, timeOnly = false) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  if (timeOnly) {
    return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }

  return `${date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

loadBookings();
