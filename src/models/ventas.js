import { model, Schema } from "mongoose";

const VentasEsquema = new Schema({
  "nombre_completo": {
    type: String,
    required: true,
  },
  "cedula": {
    type: String,
    required: true,
    unique: true,
  },
  "telefonos": {
    type: String,
    required: true,
  },
  "correo": {
    type: String,
    required: true,
  },
  "direccion": {
    type: String,
    required: true,
  },
  "plan": {
    type: String,
    required: true,
  },
  "compra-router": {
    type: Boolean,
    required: true,
  },
  "vendedor": {
    type: String,
    required: true,
  },
});

const Ventas = model("ventas", VentasEsquema);

export default Ventas;