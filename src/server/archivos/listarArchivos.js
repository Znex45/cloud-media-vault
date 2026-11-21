import "server-only";
import conectarMongoDB from "@/lib/mongodb";
import Archivo from "@/models/Archivo";

const TIPOS_VALIDOS = new Set(["imagen", "video", "pdf"]);

export class ErrorConsultaArchivos extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.name = "ErrorConsultaArchivos";
    this.status = status;
  }
}

/** Evita que los símbolos ingresados en la búsqueda se interpreten como regex. */
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normaliza los documentos de MongoDB para que la galería reciba JSON simple. */
function serializarArchivo(documento) {
  return {
    id: String(documento._id),
    titulo: documento.titulo,
    url: documento.url,
    publicId: documento.publicId,
    tipoArchivo: documento.tipoArchivo,
    mimeType: documento.mimeType,
    tamanoBytes: documento.tamanoBytes,
    fechaSubida: new Date(documento.fechaSubida).toISOString(),
    subidoPor: documento.subidoPor,
    resourceType: documento.resourceType,
  };
}

/**
 * Consulta los metadatos, más nuevos primero.
 * @param {{tipo?: string, q?: string}} opciones
 * @returns {Promise<Array<object>>}
 */
export async function listarArchivos({ tipo = "", q = "" } = {}) {
  if (typeof tipo !== "string" || (tipo && !TIPOS_VALIDOS.has(tipo))) {
    throw new ErrorConsultaArchivos("Tipo inválido: usa imagen, video o pdf.");
  }
  if (typeof q !== "string" || q.length > 120) {
    throw new ErrorConsultaArchivos("La búsqueda admite hasta 120 caracteres.");
  }

  const criterios = {};
  if (tipo) criterios.tipoArchivo = tipo;

  const busqueda = q.trim();
  if (busqueda) criterios.titulo = { $regex: escaparRegex(busqueda), $options: "i" };

  await conectarMongoDB();
  const documentos = await Archivo.find(criterios)
    .sort({ fechaSubida: -1, _id: -1 })
    .lean();

  return documentos.map(serializarArchivo);
}
