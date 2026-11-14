
( function () {
  const simbolos = [
    { valor: "🍒", nombre: "Cherry", multiplicador: 2, multiplicadorPar: 0.5 },
    { valor: "BAR", nombre: "BAR", multiplicador: 4, multiplicadorPar: 1.5 },
    { valor: "7", nombre: "Lucky 7", multiplicador: 8, multiplicadorPar: 2},
    { valor: "💎", nombre: "Diamante", multiplicador: 0, multiplicadorPar: 0 }
  ];
  const jackpotBase = 2500;
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
    !jackpotElemento) {
    throw new Error("No se pudo inicializar el juego de tragamonedas.");
  }

  let saldo = 0;
  let jackpot = jackpotBase;
  let apuestaSeleccionada = apuestaInicial;
  let girando = false;
  let saldoCargado = false;

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
      boton.disabled = girando || !saldoCargado;
    });

    botonesGirar.forEach(function (boton) {
      boton.disabled = girando || !saldoCargado;
    });
  }

  function simboloAleatorio() {
    return simbolos[Math.floor(Math.random() * simbolos.length)];
  }

  // Obtener el saldo y el jackpot desde MongoDB
  async function cargarSaldo() {
    const token = sessionStorage.getItem("casinoToken");

    if (!token) {
      window.location.href = "../Inicio_sesion.html";
      return;
    }

    try {
      const respuesta = await fetch("/api/tragamonedas/estado", {
        headers: { "Authorization": "Bearer " + token }
      });

      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          window.location.href = "../Inicio_sesion.html";
        } else {
          mensaje.textContent = "No se pudo cargar el saldo.";
        }
        return;
      }

      const datos = await respuesta.json();
      saldo = datos.saldo;
      jackpot = datos.jackpot;
      saldoCargado = true;
      actualizarInterfaz();

    } catch (error) {
      mensaje.textContent = "No se pudo conectar con el servidor.";
      console.error(error);
    }
  }

  function realizarGiro() {
    if (girando || !saldoCargado) return;

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

    window.setTimeout(async function () {
      window.clearInterval(animacion);

      try {
        const token = sessionStorage.getItem("casinoToken");
        if (!token) {
          window.location.href = "../Inicio_sesion.html";
          return;
        }

        const respuesta = await fetch("/api/tragamonedas/jugar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            monto: apuestaSeleccionada,
            solicitudId: crypto.randomUUID()
          })
        });

        const datos = await respuesta.json();
        if (!respuesta.ok) {
          mensaje.textContent = datos.error || "No se pudo realizar el giro.";
          await cargarSaldo();
          return;
        }

        datos.simbolos.forEach(function (simbolo, indice) {
          carretes[indice].textContent = simbolo;
        });

        saldo = datos.saldo;
        jackpot = datos.jackpot;

        if (datos.esJackpot) {
          mensaje.textContent =
            `¡Jackpot! Ganaste ${formatoDinero(datos.premio)} con tres diamantes.`;
        } else if (datos.gano) {
          mensaje.textContent =
            `¡Ganaste ${formatoDinero(datos.premio)}! Tres ${datos.nombrePremio} iguales.`;
        } else if (datos.ganoPar) {
          mensaje.textContent =
            `¡Ganaste ${formatoDinero(datos.premio)} con dos ${datos.nombrePremio} iguales!`;
        } else {
          mensaje.textContent =
            `No tuviste una línea ganadora. Perdiste ${formatoDinero(apuestaSeleccionada)}.`;
        }

      } catch (error) {
        mensaje.textContent = "No se pudo confirmar el giro. Revisa tu saldo.";
        console.error(error);
        await cargarSaldo();

      } finally {
        girando = false;
        actualizarInterfaz();
      }
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
  window.addEventListener("pageshow", cargarSaldo);
})();
