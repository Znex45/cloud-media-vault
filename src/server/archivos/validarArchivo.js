const MAX_TAMANO_BYTES = 10 * 1024 * 1024;

const TIPOS_ADMITIDOS = {
  "image/jpeg": { tipoArchivo: "imagen", extensiones: ["jpg", "jpeg"] },
  "image/png": { tipoArchivo: "imagen", extensiones: ["png"] },
  "image/webp": { tipoArchivo: "imagen", extensiones: ["webp"] },
  "video/mp4": { tipoArchivo: "video", extensiones: ["mp4"] },
  "video/webm": { tipoArchivo: "video", extensiones: ["webm"] },
  "application/pdf": { tipoArchivo: "pdf", extensiones: ["pdf"] },
};

export class ErrorValidacionArchivo extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = "ErrorValidacionArchivo";
    this.status = status;
  }
}

function extensionDe(nombre) {
  const ultimoPunto = nombre.lastIndexOf(".");
  return ultimoPunto < 0 ? "" : nombre.slice(ultimoPunto + 1).toLowerCase();
}

function firmaCoincide(bytes, mimeType) {
  const ascii = (inicio, fin) => bytes.toString("ascii", inicio, fin);

  switch (mimeType) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/webp":
      return bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "video/mp4":
      return bytes.length >= 12 && ascii(4, 8) === "ftyp";
    case "video/webm":
      return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    case "application/pdf":
      return bytes.length >= 5 && ascii(0, 5) === "%PDF-";
    default:
      return false;
  }
}

export async function validarArchivo({ archivo, titulo, subidoPor }) {
  if (typeof File === "undefined" || !(archivo instanceof File)) {
    throw new ErrorValidacionArchivo("El archivo es obligatorio.", 400);
  }

  if (typeof titulo !== "string" || !titulo.trim()) {
    throw new ErrorValidacionArchivo("El título es obligatorio.", 400);
  }
  if (titulo.trim().length > 120) {
    throw new ErrorValidacionArchivo("El título admite máximo 120 caracteres.", 400);
  }
  if (typeof subidoPor !== "string" || !subidoPor.trim()) {
    throw new ErrorValidacionArchivo("El autor es obligatorio.", 400);
  }
  if (subidoPor.trim().length > 80) {
    throw new ErrorValidacionArchivo("El autor admite máximo 80 caracteres.", 400);
  }
  if (archivo.size > MAX_TAMANO_BYTES) {
    throw new ErrorValidacionArchivo("El archivo supera el límite de 10 MiB.", 413);
  }
  if (archivo.size === 0) {
    throw new ErrorValidacionArchivo("El archivo no puede estar vacío.", 400);
  }

  const tipo = TIPOS_ADMITIDOS[archivo.type];
  if (!tipo || !tipo.extensiones.includes(extensionDe(archivo.name))) {
    throw new ErrorValidacionArchivo("El formato del archivo no está permitido.", 415);
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());
  if (bytes.length === 0 || !firmaCoincide(bytes, archivo.type)) {
    throw new ErrorValidacionArchivo("El contenido no coincide con el tipo y la extensión del archivo.", 415);
  }

  return {
    bytes,
    titulo: titulo.trim(),
    subidoPor: subidoPor.trim(),
    tipoArchivo: tipo.tipoArchivo,
    mimeType: archivo.type,
    tamanoBytes: bytes.length,
  };
}
