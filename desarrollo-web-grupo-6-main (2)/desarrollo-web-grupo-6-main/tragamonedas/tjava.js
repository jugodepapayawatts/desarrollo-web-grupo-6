const SYMBOLS = [
  { id: "cherry", label: "🍒", name: "Cherry", multiplier: 2 },
  { id: "bar", label: "BAR", name: "Bar", multiplier: 3 },
  { id: "seven", label: "7", name: "Lucky 7", multiplier: 5 },
  { id: "diamond", label: "💎", name: "Diamante", multiplier: 8 },
];

const state = {
  balance: obtenerSaldo ? obtenerSaldo() : 10000,
  currentBet: 5,
  jackpot: 2500,
};

const elements = {
  balance: document.querySelector(".balance-box strong"),
  jackpot: document.querySelector(".machine-header span:last-child"),
  betSummary: document.querySelector(".bet-summary strong"),
  spinButton: document.querySelector(".spin-button"),
  playButton: document.querySelector(".action-btn"),
  resetButton: document.querySelector(".action-btn.secondary"),
  betButtons: Array.from(document.querySelectorAll(".bet-btn")),
  reels: Array.from(document.querySelectorAll(".reel span")),
};

function randomizador() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function actualizar() {
  state.balance = obtenerSaldo ? obtenerSaldo() : state.balance;
  elements.balance.textContent = `${state.balance} CLP`;
  elements.betSummary.textContent = `${state.currentBet} CLP`;
  elements.jackpot.textContent = `Jackpot: ${state.jackpot}`;

  const isDisabled = state.balance < state.currentBet;
  elements.spinButton.disabled = isDisabled;
  elements.spinButton.style.opacity = isDisabled ? "0.6" : "1";
}

function setBet(value) {
  state.currentBet = value;

  elements.betButtons.forEach((button) => {
    const buttonValue = Number(button.textContent.replace(" CLP", ""));
    button.classList.toggle("active", buttonValue === value);
  });

  actualizar();
}

function resolveSpin(result) {
  const counts = {};

  result.forEach((symbol) => {
    counts[symbol.id] = (counts[symbol.id] || 0) + 1;
  });

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  if (!winner) {
    return;
  }

  const [symbolId, count] = winner;
  const symbol = SYMBOLS.find((item) => item.id === symbolId);

  let prize = 0;
  let resultado = "perdida";

  if (result.every((item) => item.id === "seven")) {
    prize = state.jackpot;
    state.balance += prize;
    state.jackpot = 2500;
    resultado = "ganada";
    alert(`¡JACKPOT! Has ganado ${prize} CLP.`);
  } else if (count === 3) {
    prize = state.currentBet * symbol.multiplier * 2;
    state.balance += prize;
    state.jackpot = Math.max(2500, state.jackpot - Math.round(prize * 0.35));
    resultado = "ganada";
    alert(`¡Excelente! Has ganado ${prize.toFixed(2)} CLP.`);
  } else if (count === 2) {
    prize = state.currentBet * symbol.multiplier;
    state.balance += prize;
    state.jackpot = Math.max(2500, state.jackpot - Math.round(prize * 0.2));
    resultado = "ganada";
    alert(`¡Buen intento! Has ganado ${prize.toFixed(2)} CLP.`);
  } else {
    state.jackpot += Math.round(state.currentBet * 2);
    alert("No has ganado esta vez. ¡Sigue intentando!");
  }

  guardarSaldo(state.balance);
  registrarPartida?.("Tragamonedas", resultado);
  actualizar();
}

function Jugar() {
  if (state.balance < state.currentBet) {
    alert("No tienes saldo suficiente para apostar este importe.");
    return;
  }

  state.balance -= state.currentBet;
  guardarSaldo(state.balance);
  state.jackpot += Math.round(state.currentBet * 2);
  actualizar();

  let spinCount = 0;
  const totalSpins = 18;

  const interval = setInterval(() => {
    elements.reels.forEach((reel) => {
      const symbol = randomizador();
      reel.textContent = symbol.label;
    });

    spinCount += 1;

    if (spinCount >= totalSpins) {
      clearInterval(interval);

      const result = Array.from({ length: 3 }, randomizador);

      elements.reels.forEach((reel, index) => {
        reel.textContent = result[index].label;
      });

      resolveSpin(result);
    }
  }, 90);
}

function resetGame() {
  state.balance = obtenerSaldo ? obtenerSaldo() : state.balance;
  state.currentBet = 5;
  state.jackpot = 2500;

  elements.reels.forEach((reel) => {
    reel.textContent = "7";
  });

  elements.betButtons.forEach((button) => {
    const buttonValue = Number(button.textContent.replace(" CLP", ""));
    button.classList.toggle("active", buttonValue === state.currentBet);
  });

  actualizar();
}

function attachEvents() {
  elements.betButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.textContent.replace(" CLP", ""));
      setBet(value);
    });
  });

  elements.spinButton.addEventListener("click", Jugar);
  elements.playButton.addEventListener("click", Jugar);
  elements.resetButton.addEventListener("click", resetGame);
}

attachEvents();
actualizar();
