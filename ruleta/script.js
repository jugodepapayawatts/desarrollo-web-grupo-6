const saldoElemento = document.getElementById("saldo");
const juego = document.getElementById("juego");
const tipoApuesta = document.getElementById("tipo-apuesta");
const montoInput = document.getElementById("monto");
const botonGirar = document.getElementById("btn-girar");
const mensaje = document.getElementById("mensaje");
const numeroGanador = document.getElementById("numero-ganador");
const detalleResultado = document.getElementById("detalle-resultado");
const historial = document.getElementById("historial");

let saldo = 10000;
let rondas = [];

const rojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function formatoDinero(cantidad) {
  return "$" + cantidad.toLocaleString("es-CL");
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

function mostrarHistorial() {
  historial.innerHTML = "";

  if (rondas.length === 0) {
    historial.innerHTML = "<li>No hay rondas jugadas.</li>";
    return;
  }

  rondas.forEach(function(ronda) {
    const elemento = document.createElement("li");
    elemento.textContent = `Número ${ronda.numero} (${ronda.color}): ${ronda.resultado}`;
    historial.appendChild(elemento);
  });
}

async function realizarApuesta() {
  const monto = Number(montoInput.value);
  const apuesta = tipoApuesta.value;

  if (juego.value !== "ruleta") {
    mensaje.textContent = "Selecciona un juego válido.";
    return;
  }

  if (montoInput.value.trim() === "" || !Number.isFinite(monto) || monto <= 0) {
    mensaje.textContent = "Ingresa un monto numérico mayor que cero.";
    montoInput.focus();
    return;
  }

  if (monto > saldo) {
    mensaje.textContent = "La apuesta no puede superar tu saldo disponible.";
    montoInput.focus();
    return;
  }

  botonGirar.disabled = true;
  mensaje.textContent = "Cargando resultados...";

  try {
    // Se solicitan los números disponibles
    const respuesta = await fetch("resultados.json", { cache: "no-store" });

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el archivo de resultados.");
    }

    const numeros = await respuesta.json();

    // Estado de respuesta vacía por si no hay números
    if (!Array.isArray(numeros) || numeros.length === 0) {
      mensaje.textContent = "No hay resultados disponibles. Intenta más tarde.";
      numeroGanador.textContent = "Sin resultados";
      detalleResultado.textContent = "";
      return;
    }

    const numero = numeros[Math.floor(Math.random() * numeros.length)];

    if (!Number.isInteger(numero) || numero < 0 || numero > 36) {
      throw new Error("Los datos recibidos no son válidos.");
    }

    const color = obtenerColor(numero);
    const gano = ganoApuesta(numero, apuesta);

    saldo -= monto;

    if (gano) {
      saldo += monto * 2;
      detalleResultado.textContent = `¡Ganaste! Recibes ${formatoDinero(monto * 2)}.`;
    } else {
      detalleResultado.textContent = `Perdiste ${formatoDinero(monto)}.`;
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
    // Estado de error por si no hay conexión o falla la solicitud
    mensaje.textContent = "Error al cargar los resultados. Revisa tu conexión e intenta nuevamente.";
    numeroGanador.textContent = "No se pudo obtener el resultado";
    detalleResultado.textContent = "";
  } finally {
    botonGirar.disabled = false;
  }
}

botonGirar.addEventListener("click", realizarApuesta);
