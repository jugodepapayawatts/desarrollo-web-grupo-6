import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  usuario: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  rol: {
    type: String,
    enum: ["jugador", "moderador", "administrador"],
    default: "jugador"
  },
  saldo: {
    type: Number,
    default: 10000,
    min: 0
  }
}, { timestamps: true });

export const Usuario = mongoose.model(
  "Usuario",
  usuarioSchema
);