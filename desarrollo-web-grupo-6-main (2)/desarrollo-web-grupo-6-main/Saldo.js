//Esto es el saldo
const CLAVE_SALDO = "casinoSaldo";

function obtenerSaldo() {
  const guardado = sessionStorage.getItem(CLAVE_SALDO);
  if (guardado === null) {
    sessionStorage.setItem(CLAVE_SALDO, "10000");
    return 10000;
  }
  return Number(guardado);
}

function guardarSaldo(saldo) {
  sessionStorage.setItem(CLAVE_SALDO, String(saldo));
}


//Esto es para las estadisticas
const CLAVE_ESTADISTICAS = "casinoEstadisticas";

function obtenerEstadisticas() {
  const guardadas = sessionStorage.getItem(CLAVE_ESTADISTICAS);

  if (guardadas === null) {
    return {
      ultimaActividad: "Ninguna",
      partidasJugadas: 0,
      partidasGanadas: 0,
      partidasPerdidas: 0
    };
  }

  return JSON.parse(guardadas);
}

function registrarPartida(juego, resultado) {
  const estadisticas = obtenerEstadisticas();

  estadisticas.ultimaActividad = juego;
  estadisticas.partidasJugadas++;

  if (resultado === "ganada") {
    estadisticas.partidasGanadas++;
  } else if (resultado === "perdida") {
    estadisticas.partidasPerdidas++;
  }

  sessionStorage.setItem(CLAVE_ESTADISTICAS,JSON.stringify(estadisticas)
  );
}
