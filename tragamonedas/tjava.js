( function () {
  const simbolos = [
    { valor: "🍒", nombre: "Cherry", multiplicador: 2, multiplicadorPar: 0.5 },
    { valor: "BAR", nombre: "BAR", multiplicador: 4, multiplicadorPar: 1.5 },
    { valor: "7", nombre: "Lucky 7", multiplicador: 8, multiplicadorPar: 2},
    { valor: "💎", nombre: "Diamante", multiplicador: 0, multiplicadorPar: 0 }
  ];
  const jackpotBase = 2500;
  const claveJackpot = "tragamonedasJackpot";
  const apuestaInicial = 10;
  const carretes = Array.from(document.querySelectorAll(".reel span"));
  const botonesApuesta = Array.from(document.querySelectorAll(".bet-btn"));
  const botonesGirar = [
    document.querySelector(".spin-button"),
    document.querySelector(".action-btn:not(.secondary)")
  ].filter(Boolean);
  const saldoElemento = document.querySelector(".balance-box strong");
  const ultimaApuestaElemento = document.querySelector(".bet-summary strong");
  const jackpotElemento = document.getElementById("jackpot");
  const maquina = document.querySelector(".maquina");
  const mensaje = document.createElement("p");

  if (carretes.length !== 3 ||
    botonesApuesta.length === 0 ||
    botonesGirar.length === 0 ||
    !saldoElemento ||
    !ultimaApuestaElemento ||
    !jackpotElemento ||
    typeof obtenerSaldo !== "function" ||
    typeof guardarSaldo !== "function" ||
    typeof registrarPartida !== "function") {
    throw new Error("No se pudo inicializar el juego de tragamonedas.");
  }

  let saldo = obtenerSaldo();
  const jackpotGuardado = sessionStorage.getItem(claveJackpot);
  let jackpot = jackpotGuardado === null ? jackpotBase : Number(jackpotGuardado);
  let apuestaSeleccionada = apuestaInicial;
  let girando = false;

  if (!Number.isFinite(jackpot) || jackpot < jackpotBase) {
    throw new Error("El valor guardado del jackpot no es válido.");
  }

  mensaje.setAttribute("role", "status");
  mensaje.setAttribute("aria-live", "polite");
  mensaje.style.minHeight = "1.5em";
  maquina.appendChild(mensaje);

  function formatoDinero(cantidad) {
    return `${new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 0
    }).format(cantidad)} CLP`;
  }

  function actualizarInterfaz() {
    saldoElemento.textContent = formatoDinero(saldo);
    jackpotElemento.textContent = `Jackpot: ${formatoDinero(jackpot)}`;

    botonesApuesta.forEach(function (boton) {
      const monto = Number.parseInt(boton.textContent, 10);
      boton.classList.toggle("active", monto === apuestaSeleccionada);
      boton.disabled = girando;
    });

    botonesGirar.forEach(function (boton) {
      boton.disabled = girando;
    });
  }

  function simboloAleatorio() {
    return simbolos[Math.floor(Math.random() * simbolos.length)];
  }

  function realizarGiro() {
    if (girando) return;

    if (apuestaSeleccionada > saldo) {
      mensaje.textContent = "No tienes saldo suficiente para esa apuesta.";
      return;
    }

    ultimaApuestaElemento.textContent = formatoDinero(apuestaSeleccionada);
    girando = true;
    actualizarInterfaz();
    mensaje.textContent = "Girando...";

    const animacion = window.setInterval(function () {
      carretes.forEach(function (carrete) {
        carrete.textContent = simboloAleatorio().valor;
      });
    }, 90);

    window.setTimeout(function () {
      window.clearInterval(animacion);

      const resultado = carretes.map(function () {
        return simboloAleatorio();
      });
      resultado.forEach(function (simbolo, indice) {
        carretes[indice].textContent = simbolo.valor;
      });

      saldo -= apuestaSeleccionada;
      const gano = resultado.every(function (simbolo) {
        return simbolo.valor === resultado[0].valor;
      });
      const simboloPar = resultado.find(function (simbolo, indice) {
        return resultado.some(function (otro, otroIndice) {
          return indice !== otroIndice && simbolo.valor === otro.valor;
        });
      });
      const ganoPar = !gano &&
        Boolean(simboloPar) &&
        simboloPar.multiplicadorPar > 0;

      if (gano) {
        const esJackpot = resultado[0].valor === "💎";
        const premio = esJackpot
          ? jackpot
          : apuestaSeleccionada * resultado[0].multiplicador;
        saldo += premio;
        mensaje.textContent = esJackpot
          ? `¡Jackpot! Ganaste ${formatoDinero(premio)} con tres diamantes.`
          : `¡Ganaste ${formatoDinero(premio)}! Tres ${resultado[0].nombre} iguales.`;
        if (esJackpot) {
          jackpot = jackpotBase;
        }
      } else if (ganoPar) {
        const premio = apuestaSeleccionada * simboloPar.multiplicadorPar;
        saldo += premio;
        mensaje.textContent = `¡Ganaste ${formatoDinero(premio)} con dos ${simboloPar.nombre} iguales!`;
      } else {
        jackpot += apuestaSeleccionada;
        mensaje.textContent = `No tuviste una línea ganadora. Perdiste ${formatoDinero(apuestaSeleccionada)}.`;
      }

      guardarSaldo(saldo);
      sessionStorage.setItem(claveJackpot, String(jackpot));
      registrarPartida("Tragamonedas", gano || ganoPar ? "ganada" : "perdida");
      girando = false;
      actualizarInterfaz();
    }, 800);
  }
   
  botonesApuesta.forEach(function (boton) {
    boton.addEventListener("click", function () {
      const monto = Number.parseInt(boton.textContent, 10);

      if (!Number.isFinite(monto) || monto <= 0) {
        mensaje.textContent = "El monto de la apuesta no es válido.";
        return;
      }

      apuestaSeleccionada = monto;
      actualizarInterfaz();
      mensaje.textContent = monto > saldo
        ? "No tienes saldo suficiente para jugar con esta apuesta."
        : `Apuesta seleccionada: ${formatoDinero(apuestaSeleccionada)}.`;
    });
  });

  botonesGirar.forEach(function (boton) {
    boton.addEventListener("click", realizarGiro);
  });

  actualizarInterfaz();
  mensaje.textContent = "Elige una apuesta y pulsa Girar.";
})();