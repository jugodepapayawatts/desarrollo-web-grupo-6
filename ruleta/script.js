
const saldoElemento = document.getElementById("saldo");
const juego = document.getElementById("juego");
const tipoApuesta = document.getElementById("tipo-apuesta");
const montoInput = document.getElementById("monto");
const botonGirar = document.getElementById("btn-girar");
const mensaje = document.getElementById("mensaje");
const numeroGanador = document.getElementById("numero-ganador");
const detalleResultado = document.getElementById("detalle-resultado");
const historial = document.getElementById("historial");

let saldo = 0;
let rondas = [];

const rojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function formatoDinero(cantidad) {
  return cantidad.toLocaleString("es-CL") + " créditos";
}

function obtenerColor(numero) {
  if (numero === 0) return "verde";
  return rojos.includes(numero) ? "rojo" : "negro";
}

function ganoApuesta(numero, apuesta) {
  const color = obtenerColor(numero);

  switch (apuesta) {
    case "rojo":
      return color === "rojo";
    case "negro":
      return color === "negro";
    case "par":
      return numero !== 0 && numero % 2 === 0;
    case "impar":
      return numero % 2 !== 0;
    case "bajo":
      return numero >= 1 && numero <= 18;
    case "alto":
      return numero >= 19 && numero <= 36;
    default:
      return false;
  }
}

function actualizarSaldo() {
  saldoElemento.textContent = formatoDinero(saldo);
}

// Obtener saldo desde MongoDB
async function cargarSaldo() {
  const token = sessionStorage.getItem("casinoToken");

  if (!token) {
    window.location.href = "../Inicio_sesion.html";
    return false;
  }

  try {
    const respuesta = await fetch("/api/perfil", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        window.location.href = "../Inicio_sesion.html";
      } else {
        mensaje.textContent = "No se pudo cargar el saldo.";
      }
      return false;
    }

    const datos = await respuesta.json();
    saldo = datos.usuario.saldo;
    actualizarSaldo();
    return true;

  } catch (error) {
    mensaje.textContent = "No se pudo conectar con el servidor.";
    console.error(error);
    return false;
  }
}

function mostrarHistorial() {
  historial.innerHTML = "";

  if (rondas.length === 0) {
    historial.innerHTML = "<li>No hay rondas jugadas.</li>";
    return;
  }

  rondas.forEach(function(ronda) {
    const elemento = document.createElement("li");
    elemento.textContent =
      `Número ${ronda.numero} (${ronda.color}): ${ronda.resultado}`;
    historial.appendChild(elemento);
  });
}

// Realizar apuesta mediante el servidor
async function realizarApuesta() {
  const monto = Number(montoInput.value);
  const apuesta = tipoApuesta.value;

  if (montoInput.value.trim() === "" ||
      !Number.isSafeInteger(monto) ||
      monto <= 0 || monto > 1000) {
    mensaje.textContent = "Ingresa una apuesta entre 1 y 1000 créditos.";
    montoInput.focus();
    return;
  }

  botonGirar.disabled = true;
  mensaje.textContent = "Cargando resultados...";

  try {
    const token = sessionStorage.getItem("casinoToken");

    if (!token) {
      window.location.href = "../Inicio_sesion.html";
      return;
    }

    const respuesta = await fetch("/api/ruleta/jugar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        apuesta: apuesta,
        monto: monto,
        solicitudId: crypto.randomUUID()
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = datos.error || "Error al jugar.";
      await cargarSaldo();
      return;
    }

    const numero = datos.numero;
    const color = datos.color;
    const gano = datos.gano;

    saldo = datos.saldo;

    if (gano) {
      detalleResultado.textContent =
        `¡Ganaste! Recibes ${formatoDinero(datos.premio)}.`;
    } else {
      detalleResultado.textContent =
        `Perdiste ${formatoDinero(monto)}.`;
    }

    numeroGanador.textContent = `Número ${numero} - ${color}`;
    mensaje.textContent = gano ? "Apuesta ganadora." : "Apuesta perdida.";

    rondas.unshift({
      numero: numero,
      color: color,
      resultado: gano ? "Ganada" : "Perdida"
    });

    actualizarSaldo();
    mostrarHistorial();
    montoInput.value = "";

  } catch (error) {
    mensaje.textContent =
      "No se pudo confirmar el resultado. Revisa tu saldo e historial antes de volver a jugar.";
    console.error(error);
    await cargarSaldo();

  } finally {
    botonGirar.disabled = false;
  }
}

actualizarSaldo();
mostrarHistorial();

window.addEventListener("pageshow", cargarSaldo);
botonGirar.addEventListener("click", realizarApuesta);
