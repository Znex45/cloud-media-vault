import "server-only";
import mongoose from "mongoose";

const archivoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "El titulo es obligatorio"],
      trim: true,
      maxlength: [120, "El titulo admite maximo 120 caracteres"],
    },
    url: {
      type: String,
      required: [true, "La URL es obligatoria"],
      trim: true,
      validate: {
        validator: (valor) => /^https:\/\//i.test(valor),
        message: "La URL debe usar HTTPS",
      },
    },
    publicId: {
      type: String,
      required: [true, "El publicId es obligatorio"],
      trim: true,
    },
    tipoArchivo: {
      type: String,
      enum: ["imagen", "video", "pdf"],
      required: [true, "El tipo de archivo es obligatorio"],
    },
    mimeType: {
      type: String,
      required: [true, "El tipo MIME es obligatorio"],
      trim: true,
    },
    tamanoBytes: {
      type: Number,
      required: [true, "El tamano es obligatorio"],
      min: [1, "El archivo no puede estar vacio"],
    },
    fechaSubida: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    subidoPor: {
      type: String,
      required: [true, "El autor es obligatorio"],
      trim: true,
      maxlength: [80, "El nombre admite maximo 80 caracteres"],
    },
    resourceType: {
      type: String,
      required: [true, "El resourceType es obligatorio"],
      trim: true,
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_documento, resultado) {
        resultado.id = resultado._id.toString();
        delete resultado._id;
        return resultado;
      },
    },
  },
);

archivoSchema.index({ fechaSubida: -1 });
archivoSchema.index({ tipoArchivo: 1, fechaSubida: -1 });

const Archivo =
  mongoose.models.Archivo || mongoose.model("Archivo", archivoSchema);

export default Archivo;
