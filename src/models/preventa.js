import { model, Schema } from "mongoose";

const preventaSchema = new Schema({
  nombre_cliente: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  nombre_asesor: {
    type: String,
    required: true
  },
  created_At: {
    type: Date,
    required: true,
    default: Date.now()
  },
})

const Preventa = model("preventa", preventaSchema);

export default Preventa;