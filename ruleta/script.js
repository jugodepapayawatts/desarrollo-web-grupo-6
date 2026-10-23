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

botonGirar.addEventListener("click", function() {
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
  mensaje.textContent = "Girando la ruleta...";

  // Simula una ronda y genera un número europeo entre 0 y 36.
  const numero = Math.floor(Math.random() * 37);
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
  botonGirar.disabled = false;
});
