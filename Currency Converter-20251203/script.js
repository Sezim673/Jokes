const API_URL = "https://open.er-api.com/v6/latest/USD";

const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const form = document.getElementById("converter-form");
const resultEl = document.getElementById("result");
const rateInfoEl = document.getElementById("rate-info");
const errorEl = document.getElementById("error");
const swapBtn = document.getElementById("swap");

// --- Список валют ---
async function loadCurrencies() {
  try {
    clearError();
    const res = await fetch(API_URL);

    if (!res.ok) throw new Error("Ошибка сети");

    const data = await res.json();
    if (data.result !== "success") throw new Error("Ошибка API");

    const base = data.base_code;  // USD
    const rates = data.rates;     // {EUR: 0.92, ...}

    const currencies = Object.keys(rates).sort();
    if (!currencies.includes(base)) currencies.unshift(base);

    fillSelect(fromSelect, currencies, "USD");
    fillSelect(toSelect, currencies, "EUR");
  } catch (e) {
    showError("Не удалось загрузить список валют.");
    console.error(e);
  }
}

function fillSelect(select, list, defaultVal) {
  select.innerHTML = "";
  for (const code of list) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    if (code === defaultVal) opt.selected = true;
    select.appendChild(opt);
  }
}

// --- Конвертация ---
async function convertCurrency(amount, from, to) {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Ошибка сети");
  const data = await res.json();

  if (data.result !== "success") throw new Error("Ошибка API");

  const rates = data.rates;

  if (!rates[from] || !rates[to]) throw new Error("Неизвестная валюта");

  const amountInUSD = amount / rates[from]; 
  const result = amountInUSD * rates[to];
  const rate = rates[to] / rates[from];

  return {
    result,
    rate,
    date: data.time_last_update_utc
  };
}

// --- Обработчик формы ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!amount || amount <= 0) {
    showError("Введите сумму больше 0");
    return;
  }

  if (from === to) {
    showError("Выберите разные валюты");
    return;
  }

  resultEl.textContent = "Конвертация...";
  rateInfoEl.textContent = "";

  try {
    const { result, rate, date } = await convertCurrency(amount, from, to);

    resultEl.textContent = `${amount.toFixed(2)} ${from} = ${result.toFixed(2)} ${to}`;

    rateInfoEl.textContent = `Курс: 1 ${from} = ${rate.toFixed(4)} ${to} (обновлено: ${date})`;

  } catch (err) {
    showError("Ошибка при загрузке курса");
    console.error(err);
  }
});

// --- Меняем валюты местами ---
swapBtn.addEventListener("click", () => {
  const f = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = f;
});

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.classList.add("hidden");
  errorEl.textContent = "";
}

loadCurrencies();
