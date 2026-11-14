const saldoElemento = document.getElementById("saldo");
const montoInput = document.getElementById("monto");
const mensaje = document.getElementById("mensaje");
const btnHit = document.getElementById("hit");
const btnStay = document.getElementById("stay");
const btnApostar = document.getElementById("btn-apostar");
const btnReintentar = document.getElementById("reintentar");

let saldoDisponible = 0;
let apuestaActual = 0;
let partidaEnCurso = false;
let cargado = false;
let procesando = false;
let solicitudId = sessionStorage.getItem("blackjackPartidaId");
let pasoActual = 0;

function actualizarSaldo() {
    saldoElemento.textContent = saldoDisponible;
}

function mostrarCartas(id, cartas) {
    const contenedor = document.getElementById(id);
    contenedor.innerHTML = "";

    cartas.forEach(carta => {
        const imagen = document.createElement("img");
        imagen.src = `./cards/${carta}.png`;
        imagen.alt = carta === "BACK" ? "Carta oculta" : carta;
        contenedor.appendChild(imagen);
    });
}

function mostrarEstado(datos) {
    saldoDisponible = datos.saldo;
    pasoActual = datos.paso;
    actualizarSaldo();

    mostrarCartas("dealer-cards", datos.cartasDealer);
    mostrarCartas("player-cards", datos.cartasJugador);

    document.getElementById("dealer-sum").innerText = datos.puntosDealer ?? "";
    document.getElementById("player-sum").innerText = datos.puntosJugador;

    partidaEnCurso = !datos.finalizada;

    btnHit.disabled = !partidaEnCurso;
    btnStay.disabled = !partidaEnCurso;
    btnApostar.disabled = true;
    montoInput.disabled = true;
    btnReintentar.style.display = datos.finalizada ? "inline-block" : "none";

    if (datos.finalizada) {
        const textos = {
            ganada: "¡Ganaste viva España!",
            perdida: "¡Perdiste Malaya!",
            empate: "¡Empate!"
        };

        const texto = textos[datos.resultado] || "Partida terminada";

        document.getElementById("resultadoss").innerText = texto;
        mensaje.textContent = `Resultado: ${texto} Saldo disponible: ${saldoDisponible}.`;

        sessionStorage.removeItem("blackjackPartidaId");
        solicitudId = null;

    } else {
        document.getElementById("resultadoss").innerText = "";
        mensaje.textContent = "Apuesta aceptada. ¡Que comience el juego!";
    }
}

async function cargarSaldo() {
    const token = sessionStorage.getItem("casinoToken");

    if (!token) {
        window.location.href = "../Inicio_sesion.html";
        return false;
    }

    try {
        const respuesta = await fetch("/api/perfil", {
            headers: {
                Authorization: "Bearer " + token
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

        saldoDisponible = datos.usuario.saldo;
        cargado = true;

        actualizarSaldo();

        if (!partidaEnCurso && !solicitudId) {
            btnApostar.disabled = false;
        }

        return true;

    } catch (error) {
        mensaje.textContent = "No se pudo conectar con el servidor.";
        console.error(error);
        return false;
    }
}

// Identificador compatible con conexiones HTTP
function generarIdBlackjack() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;

    const hex = Array.from(bytes, b =>
        b.toString(16).padStart(2, "0")
    ).join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function jugar(accion) {
    if (procesando || !cargado) return;

    let monto;

    if (accion === "iniciar") {
        monto = Number(montoInput.value);

        if (montoInput.value.trim() === "" ||
            !Number.isSafeInteger(monto) ||
            monto < 1 ||
            monto > 1000 ||
            monto > saldoDisponible) {

            mensaje.textContent = "Ingresa una apuesta de 1 a 1000 que no supere el saldo.";
            return;
        }

        if (solicitudId) return;

        solicitudId = generarIdBlackjack();
        sessionStorage.setItem("blackjackPartidaId", solicitudId);
        apuestaActual = monto;
    }

    procesando = true;

    btnHit.disabled = true;
    btnStay.disabled = true;
    btnApostar.disabled = true;

    mensaje.textContent = "Procesando partida...";

    try {
        const token = sessionStorage.getItem("casinoToken");

        if (!token) {
            window.location.href = "../Inicio_sesion.html";
            return;
        }

        const respuesta = await fetch("/api/blackjack/jugar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                accion,
                solicitudId,
                monto: accion === "iniciar" ? monto : undefined,
                paso: accion === "pedir" || accion === "plantarse"
                    ? pasoActual + 1
                    : undefined
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = datos.error || "No se pudo jugar.";

            if (respuesta.status === 401) {
                window.location.href = "../Inicio_sesion.html";
            }

            if (respuesta.status === 404 && accion === "estado") {
                sessionStorage.removeItem("blackjackPartidaId");
                solicitudId = null;
            }

            return;
        }

        mostrarEstado(datos);

    } catch (error) {
        mensaje.textContent = "No se pudo confirmar la acción. Revisa la partida.";
        console.error(error);

    } finally {
        procesando = false;

        if (solicitudId) {
            await recuperarPartida();
        } else {
            await cargarSaldo();
        }
    }
}

async function recuperarPartida() {
    if (!solicitudId) return;

    try {
        const token = sessionStorage.getItem("casinoToken");

        const respuesta = await fetch("/api/blackjack/jugar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                accion: "estado",
                solicitudId
            })
        });

        if (respuesta.ok) {
            mostrarEstado(await respuesta.json());

        } else if (respuesta.status === 404) {
            sessionStorage.removeItem("blackjackPartidaId");
            solicitudId = null;
            partidaEnCurso = false;
            btnApostar.disabled = false;
            montoInput.disabled = false;

            await cargarSaldo();

        } else {
            const datos = await respuesta.json();
            mensaje.textContent = datos.error || "No se pudo recuperar la partida.";
        }

    } catch (error) {
        mensaje.textContent = "No se pudo conectar con el servidor.";
        console.error(error);
    }
}

window.onload = async function () {
    btnHit.disabled = true;
    btnStay.disabled = true;
    btnApostar.disabled = true;
    btnReintentar.style.display = "none";

    // Mostrar cartas iniciales boca abajo
    mostrarCartas("dealer-cards", ["BACK", "BACK"]);
    mostrarCartas("player-cards", ["BACK", "BACK"]);

    document.getElementById("dealer-sum").textContent = "—";
    document.getElementById("player-sum").textContent = "—";

    btnApostar.addEventListener("click", () => jugar("iniciar"));
    btnHit.addEventListener("click", () => jugar("pedir"));
    btnStay.addEventListener("click", () => jugar("plantarse"));

    btnReintentar.onclick = async function () {
        mostrarCartas("dealer-cards", ["BACK", "BACK"]);
        mostrarCartas("player-cards", ["BACK", "BACK"]);

        document.getElementById("dealer-sum").innerText = "—";
        document.getElementById("player-sum").innerText = "—";
        document.getElementById("resultadoss").innerText = "";

        apuestaActual = 0;
        partidaEnCurso = false;

        montoInput.disabled = false;
        btnHit.disabled = true;
        btnStay.disabled = true;
        btnReintentar.style.display = "none";

        mensaje.textContent = "";

        await cargarSaldo();
    };

    if (!(await cargarSaldo())) return;

    if (solicitudId) {
        await recuperarPartida();
    }
};