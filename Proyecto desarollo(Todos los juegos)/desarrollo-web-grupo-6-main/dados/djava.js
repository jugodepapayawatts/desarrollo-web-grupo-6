
const imagenDado1 = document.getElementById("dado-1");
const imagenDado2 = document.getElementById("dado-2");
const saldoElemento = document.getElementById("saldo");
const resultadoDados = document.getElementById("resultado-dados");
const mensaje = document.getElementById("mensaje");
const montoApuesta = document.getElementById("monto-apuesta");
const botonLanzar = document.getElementById("btn-lanzar");
const botonesApuesta = document.querySelectorAll(".boton-apuesta");

const MULTIPLICADOR_DOBLES = 8;
const MULTIPLICADOR_EXACTA = 4;
const MULTIPLICADOR_PARIDAD = 2;
let saldoDisponible = obtenerSaldo();

const dado1 = {
  valor: Number(imagenDado1.dataset.valor),
  imagen: imagenDado1
};

const dado2 = {
  valor: Number(imagenDado2.dataset.valor),
  imagen: imagenDado2
};

let apuestaSeleccionada = null;

function actualizarSaldo() {
  saldoElemento.textContent = saldoDisponible.toLocaleString("es-CL");
}

//  guarda la opcion elegida y la marca visualmente.
botonesApuesta.forEach(function(boton) {
  boton.setAttribute("aria-pressed", "false");

  boton.addEventListener("click", function() {
    botonesApuesta.forEach(function(opcion) {
      opcion.classList.remove("seleccionada");
      opcion.setAttribute("aria-pressed", "false");
    });

    boton.classList.add("seleccionada");
    boton.setAttribute("aria-pressed", "true");
    apuestaSeleccionada = {
      tipo: boton.dataset.tipoApuesta,
      valor: boton.dataset.valor
    };
    mensaje.textContent = `Seleccionaste: ${boton.textContent.trim()}.`;
  });
});

//  valida que haya una opcion seleccionada y un monto positivo.
function validarApuesta() {
  const monto = Number(montoApuesta.value);

  if (apuestaSeleccionada === null) {
    mensaje.textContent = "Selecciona primero una opcion de apuesta.";
    return false;
  }

  if (montoApuesta.value.trim() === "" || !Number.isInteger(monto) || monto <= 0) {
    mensaje.textContent = "Ingresa un monto valido.";
    montoApuesta.focus();
    return false;
  }

  if (monto > saldoDisponible) {
    mensaje.textContent = "La apuesta no puede superar tu saldo disponible.";
    montoApuesta.focus();
    return false;
  }

  return true;
}

// genera un valor entre 1 y 6 para cada dado y cambia sus imagenes.
function tirarDados() {
  [dado1, dado2].forEach(function(dado) {
    dado.valor = Math.floor(Math.random() * 6) + 1;
    dado.imagen.dataset.valor = String(dado.valor);
    dado.imagen.src = `caras/dado${dado.valor}.png`;
    dado.imagen.alt = `Dado: ${dado.valor}`;
  });

  return dado1.valor + dado2.valor;
}

//  comprobaciones de dobles, suma exacta y paridad.
function sonDobles() {
  return dado1.valor === dado2.valor;
}

function verificarApuestaDobles() {
  return sonDobles() && dado1.valor === Number(apuestaSeleccionada.valor);
}

function obtenerSumaDados() {
  return dado1.valor + dado2.valor;
}

function verificarApuestaSuma() {
  return obtenerSumaDados() === Number(apuestaSeleccionada.valor);
}

function obtenerParidad() {
  return obtenerSumaDados() % 2 === 0 ? "par" : "impar";
}

function verificarApuestaParidad() {
  return obtenerParidad() === apuestaSeleccionada.valor;
}

function obtenerMultiplicador() {
  if (apuestaSeleccionada.tipo === "dobles") {
    return MULTIPLICADOR_DOBLES;
  }

  if (apuestaSeleccionada.tipo === "suma") {
    return MULTIPLICADOR_EXACTA;
  }

  return MULTIPLICADOR_PARIDAD;
}

//  comprueba la apuesta, tira los dados y muestra el resultado.
function realizarApuesta() {
  if (!validarApuesta()) {
    return;
  }

  const suma = tirarDados();
  const monto = Number(montoApuesta.value);
  saldoDisponible -= monto;
  let acerto = false;

  if (apuestaSeleccionada.tipo === "dobles") {
    acerto = verificarApuestaDobles();
  } else if (apuestaSeleccionada.tipo === "suma") {
    acerto = verificarApuestaSuma();
  } else if (apuestaSeleccionada.tipo === "paridad") {
    acerto = verificarApuestaParidad();
  }

  resultadoDados.textContent =
    `Salio ${dado1.valor} + ${dado2.valor} = ${suma} (${obtenerParidad()}).`;

  if (acerto) {
    const multiplicador = obtenerMultiplicador();
    const premio = monto * multiplicador;
    saldoDisponible += premio;
    mensaje.textContent =
      `¡Acertaste! Ganaste: $${premio.toLocaleString("es-CL")} (${monto.toLocaleString("es-CL")} × ${multiplicador}).`;
  } else {
    mensaje.textContent = "Esta vez no acertaste.";
  }

  guardarSaldo(saldoDisponible);
  actualizarSaldo();
  registrarPartida("Dados", acerto ? "ganada" : "perdida");
}

actualizarSaldo();

botonLanzar.addEventListener("click", realizarApuesta);