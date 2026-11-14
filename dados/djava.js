
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

let saldoDisponible = 0;
let apuestaSeleccionada = null;

const dado1 = {
  valor: Number(imagenDado1.dataset.valor),
  imagen: imagenDado1
};

const dado2 = {
  valor: Number(imagenDado2.dataset.valor),
  imagen: imagenDado2
};

function actualizarSaldo() {
  saldoElemento.textContent = saldoDisponible.toLocaleString("es-CL");
}

// Obtener el saldo real desde MongoDB
async function cargarSaldo() {
  const token = sessionStorage.getItem("casinoToken");

  if (!token) {
    window.location.href = "../Inicio_sesion.html";
    return;
  }

  try {
    const respuesta = await fetch("/api/perfil", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!respuesta.ok) {
      window.location.href = "../Inicio_sesion.html";
      return;
    }

    const datos = await respuesta.json();
    saldoDisponible = datos.usuario.saldo;
    actualizarSaldo();

  } catch (error) {
    mensaje.textContent = "No se pudo consultar el saldo.";
    console.error(error);
  }
}

// Guarda la opcion elegida y la marca visualmente
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

// Valida que haya una opcion seleccionada y un monto positivo
function validarApuesta() {
  const monto = Number(montoApuesta.value);

  if (apuestaSeleccionada === null) {
    mensaje.textContent = "Selecciona primero una opcion de apuesta.";
    return false;
  }

  if (
    montoApuesta.value.trim() === "" ||
    !Number.isSafeInteger(monto) ||
    monto <= 0 ||
    monto > 1000
  ) {
    mensaje.textContent = "Ingresa una apuesta entre 1 y 1000 créditos.";
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

// Actualizar imagenes con el resultado enviado por el servidor
function mostrarDados(valor1, valor2) {
  dado1.valor = valor1;
  dado2.valor = valor2;

  dado1.imagen.dataset.valor = String(valor1);
  dado1.imagen.src = `caras/dado${valor1}.png`;
  dado1.imagen.alt = `Dado: ${valor1}`;

  dado2.imagen.dataset.valor = String(valor2);
  dado2.imagen.src = `caras/dado${valor2}.png`;
  dado2.imagen.alt = `Dado: ${valor2}`;
}

function sonDobles() {
  return dado1.valor === dado2.valor;
}

function obtenerSumaDados() {
  return dado1.valor + dado2.valor;
}

function obtenerParidad() {
  return obtenerSumaDados() % 2 === 0 ? "par" : "impar";
}

// Comprueba la apuesta y solicita el resultado al servidor
async function realizarApuesta() {
  if (!validarApuesta()) {
    return;
  }

  const token = sessionStorage.getItem("casinoToken");

  if (!token) {
    window.location.href = "../Inicio_sesion.html";
    return;
  }

  botonLanzar.disabled = true;
  mensaje.textContent = "Lanzando dados...";

  try {
    const respuesta = await fetch("/api/dados/jugar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        tipo: apuestaSeleccionada.tipo,
        valor: apuestaSeleccionada.valor,
        monto: Number(montoApuesta.value),
        solicitudId: crypto.randomUUID()
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = datos.error || "Error al realizar la apuesta.";
      await cargarSaldo();
      return;
    }

    mostrarDados(datos.dado1, datos.dado2);

    resultadoDados.textContent =
      `Salio ${dado1.valor} + ${dado2.valor} = ${obtenerSumaDados()} (${obtenerParidad()}).`;

    saldoDisponible = datos.saldo;
    actualizarSaldo();

    if (datos.acerto) {
      mensaje.textContent =
        `¡Acertaste! Ganaste ${datos.premio.toLocaleString("es-CL")} créditos (${Number(montoApuesta.value).toLocaleString("es-CL")} × ${datos.multiplicador}).`;
    } else {
      mensaje.textContent = "Esta vez no acertaste.";
    }

  } catch (error) {
    mensaje.textContent = "No se pudo conectar con el servidor.";
    console.error(error);
    await cargarSaldo();

  } finally {
    botonLanzar.disabled = false;
  }
}

actualizarSaldo();

window.addEventListener("pageshow", cargarSaldo);

botonLanzar.addEventListener("click", realizarApuesta);
