
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Usuario } from "./models/Usuario.mjs";

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
