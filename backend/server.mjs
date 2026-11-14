
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Usuario } from "./models/Usuario.mjs";
import { randomInt } from "node:crypto";
import { Partida } from "./models/Partida.mjs";

const app = express();
app.use(express.json());

const carpetaActual = path.dirname(
  fileURLToPath(import.meta.url)
);

const frontend = path.resolve(carpetaActual, "..");

if (!process.env.MONGODB_URI ||
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32) {
  throw new Error("Falta configurar el archivo .env");
}

// Entregar solo los datos públicos del usuario
function datosUsuario(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    usuario: usuario.usuario,
    correo: usuario.correo,
    rol: usuario.rol,
    saldo: usuario.saldo
  };
}

// Registrar cuenta
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, apellido, correo, usuario, contrasena } = req.body;

    if (![nombre, apellido, correo, usuario, contrasena]
      .every(campo => typeof campo === "string" && campo.trim())) {
      return res.status(400).json({
        error: "Completa todos los campos"
      });
    }

    if (contrasena.length < 8 ||
        Buffer.byteLength(contrasena, "utf8") > 72) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes"
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const nombreUsuario = usuario.trim();

    const existe = await Usuario.findOne({
      $or: [
        { correo: correoNormalizado },
        { usuario: nombreUsuario }
      ]
    });

    if (existe) {
      return res.status(409).json({
        error: "El usuario o correo ya existe"
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 12);

    const nuevo = await Usuario.create({
      nombre,
      apellido,
      correo: correoNormalizado,
      usuario: nombreUsuario,
      passwordHash
    });

    res.status(201).json({
      mensaje: "Cuenta creada correctamente",
      usuario: datosUsuario(nuevo)
    });

  } catch (error) {
    console.error(error);
    res.status(error.code === 11000 ? 409 : 500).json({
      error: error.code === 11000
        ? "El usuario o correo ya existe"
        : "Error al registrar usuario"
    });
  }
});

// Iniciar sesión
app.post("/api/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (typeof usuario !== "string" ||
        typeof contrasena !== "string") {
      return res.status(400).json({
        error: "Ingresa usuario y contraseña"
      });
    }

    const encontrado = await Usuario.findOne({
      usuario: usuario.trim()
    }).select("+passwordHash");

    const valido = encontrado &&
      await bcrypt.compare(contrasena, encontrado.passwordHash);

    if (!valido) {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos"
      });
    }

    const token = jwt.sign(
      { sub: encontrado._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      usuario: datosUsuario(encontrado)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al iniciar sesión"
    });
  }
});

// Ver perfil autenticado
app.get("/api/perfil", async (req, res) => {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Debes iniciar sesión"
      });
    }

    const token = authorization.slice(7);
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(datos.sub);

    if (!usuario) {
      return res.status(401).json({
        error: "Cuenta no encontrada"
      });
    }

    res.json({ usuario: datosUsuario(usuario) });

  } catch {
    res.status(401).json({
      error: "Sesión inválida o vencida"
    });
  }
});


app.post("/api/dados/jugar", async (req, res) => {
  let datos;

  try {
    const token = req.headers.authorization?.split(" ")[1];
    datos = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Inicia sesión" });
  }

  const { tipo, valor, monto, solicitudId } = req.body || {};

  const apuestaValida =
    (tipo === "dobles" && /^[1-6]$/.test(String(valor))) ||
    (tipo === "suma" &&
      Number.isInteger(Number(valor)) &&
      Number(valor) >= 2 && Number(valor) <= 12) ||
    (tipo === "paridad" && ["par", "impar"].includes(valor));

  if (!apuestaValida ||
      !Number.isSafeInteger(monto) ||
      monto < 1 || monto > 1000 ||
      typeof solicitudId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(solicitudId)) {
    return res.status(400).json({ error: "Apuesta inválida" });
  }

  const anterior = await Partida.findOne({ solicitudId });

  if (anterior) {
    return res.status(409).json({
      error: "Esta partida ya fue registrada"
    });
  }

  const session = await mongoose.startSession();

  try {
    let resultado;

    await session.withTransaction(async () => {
      const usuario = await Usuario.findById(datos.sub)
        .session(session);

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      if (usuario.saldo < monto) {
        throw new Error("Saldo insuficiente");
      }

      const dado1 = randomInt(1, 7);
      const dado2 = randomInt(1, 7);
      const suma = dado1 + dado2;
      const paridad = suma % 2 === 0 ? "par" : "impar";

      let acerto = false;
      let multiplicador;

      if (tipo === "dobles") {
        acerto = dado1 === dado2 &&
          dado1 === Number(valor);
        multiplicador = 8;
      } else if (tipo === "suma") {
        acerto = suma === Number(valor);
        multiplicador = 4;
      } else {
        acerto = paridad === valor;
        multiplicador = 2;
      }

      const premio = acerto ? monto * multiplicador : 0;
      const saldoAnterior = usuario.saldo;
      const saldoPosterior = saldoAnterior - monto + premio;

      usuario.saldo = saldoPosterior;
      await usuario.save({ session });

      await Partida.create([{
        usuario: usuario._id,
        juego: "Dados",
        apuesta: monto,
        premio,
        resultado: acerto ? "ganada" : "perdida",
        detalle: {
          dado1, dado2, suma, paridad, tipo, valor
        },
        saldoAnterior,
        saldoPosterior,
        solicitudId
      }], { session });

      resultado = {
        dado1,
        dado2,
        suma,
        paridad,
        acerto,
        premio,
        multiplicador,
        saldo: saldoPosterior
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Esta partida ya fue registrada"
      });
    }

    const mensaje = error.message;

    res.status(
      mensaje === "Saldo insuficiente" ? 400 : 500
    ).json({
      error: mensaje === "Saldo insuficiente"
        ? mensaje
        : "No se pudo registrar la partida"
    });

  } finally {
    await session.endSession();
  }
});


app.post("/api/ruleta/jugar", async (req, res) => {
  let datos;

  try {
    const token = req.headers.authorization?.split(" ")[1];
    datos = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Inicia sesión" });
  }

  const { apuesta, monto, solicitudId } = req.body || {};

  const apuestasValidas = [
    "rojo", "negro", "par", "impar", "bajo", "alto"
  ];

  if (!apuestasValidas.includes(apuesta) ||
      !Number.isSafeInteger(monto) ||
      monto < 1 || monto > 1000 ||
      typeof solicitudId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(solicitudId)) {
    return res.status(400).json({ error: "Apuesta inválida" });
  }

  const session = await mongoose.startSession();

  try {
    let resultado;

    await session.withTransaction(async () => {
      const existente = await Partida.findOne({
        solicitudId
      }).session(session);

      if (existente) {
        throw new Error("Partida duplicada");
      }

      const usuario = await Usuario.findById(datos.sub)
        .session(session);

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      if (usuario.saldo < monto) {
        throw new Error("Saldo insuficiente");
      }

      const numero = randomInt(0, 37);

      const rojos = [
        1, 3, 5, 7, 9, 12, 14, 16, 18,
        19, 21, 23, 25, 27, 30, 32, 34, 36
      ];

      const color = numero === 0
        ? "verde"
        : rojos.includes(numero) ? "rojo" : "negro";

      let gano = false;

      switch (apuesta) {
        case "rojo":
          gano = color === "rojo";
          break;
        case "negro":
          gano = color === "negro";
          break;
        case "par":
          gano = numero !== 0 && numero % 2 === 0;
          break;
        case "impar":
          gano = numero % 2 !== 0;
          break;
        case "bajo":
          gano = numero >= 1 && numero <= 18;
          break;
        case "alto":
          gano = numero >= 19 && numero <= 36;
          break;
      }

      const premio = gano ? monto * 2 : 0;
      const saldoAnterior = usuario.saldo;
      const saldoPosterior = saldoAnterior - monto + premio;

      usuario.saldo = saldoPosterior;
      await usuario.save({ session });

      await Partida.create([{
        usuario: usuario._id,
        juego: "Ruleta",
        apuesta: monto,
        premio,
        resultado: gano ? "ganada" : "perdida",
        detalle: { numero, color, tipo: apuesta },
        saldoAnterior,
        saldoPosterior,
        solicitudId
      }], { session });

      resultado = {
        numero,
        color,
        gano,
        premio,
        saldo: saldoPosterior
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);

    if (error.code === 11000 ||
        error.message === "Partida duplicada") {
      return res.status(409).json({
        error: "Esta partida ya fue registrada"
      });
    }

    res.status(
      error.message === "Saldo insuficiente" ? 400 : 500
    ).json({
      error: error.message === "Saldo insuficiente"
        ? "Saldo insuficiente"
        : "No se pudo registrar la partida"
    });

  } finally {
    await session.endSession();
  }
});

// Proteger los archivos del backend
app.use("/backend", (req, res) => {
  res.status(404).json({ error: "No encontrado" });
});

// Servir la página original
app.use(express.static(frontend, {
  dotfiles: "ignore"
}));

// Conectar a la base de datos
await mongoose.connect(process.env.MONGODB_URI);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Casino Nova funcionando en http://localhost:${PORT}`);
});
