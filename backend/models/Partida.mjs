
import mongoose from "mongoose";

const partidaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  juego: {
    type: String,
    required: true
  },
  apuesta: {
    type: Number,
    required: true
  },
  premio: {
    type: Number,
    required: true
  },
  resultado: {
    type: String,
    required: true
  },
  detalle: {
    type: Object
  },
  saldoAnterior: {
    type: Number,
    required: true
  },
  saldoPosterior: {
    type: Number,
    required: true
  },
  solicitudId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export const Partida = mongoose.model("Partida", partidaSchema);
