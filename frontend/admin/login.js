const API_URL = "/api/bookings";

const form = document.getElementById("login-form");
const btnSubmit = document.getElementById("btn-submit");
const btnLabel = btnSubmit.querySelector(".btn-label");
const btnSpinner = btnSubmit.querySelector(".btn-spinner");
const alertBox = document.getElementById("alert-error");
const alertText = document.getElementById("alert-text");
const togglePw = document.getElementById("toggle-pw");
const pwInput = document.getElementById("password");

if (sessionStorage.getItem("auth_token")) {
  window.location.replace("/admin/admin.html");
}

togglePw.addEventListener("click", () => {
  const reveal = pwInput.type === "password";
  pwInput.type = reveal ? "text" : "password";
  togglePw.textContent = reveal ? "Ukryj" : "Pokaż";
});

["username", "password"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => {
    clearFieldError(id);
    hideAlert();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  let valid = true;

  if (!username) {
    showFieldError("username", "Podaj login.");
    valid = false;
  }
  if (!password) {
    showFieldError("password", "Podaj hasło.");
    valid = false;
  }
  if (!valid) return;

  setLoading(true);
  hideAlert();

  const token = btoa(`${username}:${password}`);

  try {
    const response = await fetch(`${API_URL}?limit=1`, {
      headers: { Authorization: `Basic ${token}` },
    });

    if (response.ok) {
      sessionStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_user", username);
      window.location.replace("/admin/admin.html");
    } else if (response.status === 401) {
      showAlert("Nieprawidłowy login lub hasło. Spróbuj ponownie.");
      document.getElementById("password").value = "";
      document.getElementById("password").focus();
    } else {
      showAlert(`Serwer zwrócił błąd ${response.status}. Spróbuj ponownie później.`);
    }
  } catch {
    showAlert("Nie udało się połączyć z serwerem.");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  btnSubmit.disabled = isLoading;
  btnLabel.hidden = isLoading;
  btnSpinner.hidden = !isLoading;
}

function showAlert(message) {
  alertText.textContent = message;
  alertBox.hidden = false;
}

function hideAlert() {
  alertBox.hidden = true;
}

function showFieldError(id, message) {
  const input = document.getElementById(id);
  const errorNode = document.getElementById(`${id}-error`);
  input.classList.add("is-error");
  if (errorNode) errorNode.textContent = message;
}

function clearFieldError(id) {
  const input = document.getElementById(id);
  const errorNode = document.getElementById(`${id}-error`);
  input.classList.remove("is-error");
  if (errorNode) errorNode.textContent = "";
}
