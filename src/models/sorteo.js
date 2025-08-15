import { model, Schema } from "mongoose";

const SorteoEsquema = new Schema({
  "nombre": {
    type: String,
    required: true,
  },
  "cedula": {
    type: String,
    required: true,
    unique: true,
  },
});

const Sorteo = model("sorteo", SorteoEsquema);

export default Sorteo;