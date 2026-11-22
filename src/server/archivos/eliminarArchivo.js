import "server-only";
import conectarMongoDB from "@/lib/mongodb";
import Archivo from "@/models/Archivo";
import { eliminarDeCloudinary } from "@/server/archivos/subirACloudinary";

export class ErrorEliminarArchivo extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = "ErrorEliminarArchivo";
    this.status = status;
  }
}

/**
 * Elimina primero en Cloudinary y después en MongoDB.
 * No se intenta una transacción distribuida: si falla MongoDB después del
 * borrado cloud, se responde con error para facilitar la reconciliación.
 */
export async function eliminarArchivo(id) {
  // Una cadena hexadecimal de 24 caracteres es un ID de MongoDB bien formado.
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw new ErrorEliminarArchivo("El ID del archivo no es válido.", 400);
  }

  let documento;
  try {
    await conectarMongoDB();
    documento = await Archivo.findById(id).lean();
  } catch {
    console.error("No fue posible consultar el archivo en MongoDB.");
    throw new ErrorEliminarArchivo("Error al consultar la base de datos.", 500);
  }

  if (!documento) {
    throw new ErrorEliminarArchivo("El archivo no existe.", 404);
  }

  if (!documento.publicId || !documento.resourceType) {
    throw new ErrorEliminarArchivo("El archivo no tiene los datos necesarios para eliminarlo.", 500);
  }

  try {
    // Reutiliza el helper de Sergio, que admite únicamente las respuestas
    // "ok" (borrado) o "not found" (el recurso ya estaba ausente).
    const resultado = await eliminarDeCloudinary({
      publicId: documento.publicId,
      resourceType: documento.resourceType,
    });
    if (resultado.result !== "ok" && resultado.result !== "not found") {
      throw new Error("Cloudinary no confirmó el borrado.");
    }
  } catch {
    console.error("Cloudinary no confirmó la eliminación; se conserva el registro de MongoDB.");
    throw new ErrorEliminarArchivo("No fue posible eliminar el recurso en la nube.", 502);
  }

  try {
    const resultado = await Archivo.deleteOne({ _id: documento._id });
    if (resultado.deletedCount !== 1) {
      throw new Error("El documento no se eliminó de MongoDB.");
    }
  } catch {
    // El recurso cloud puede haberse eliminado: no responder falsamente éxito.
    console.error("ALERTA DE SINCRONIZACIÓN: Cloudinary confirmó el borrado, pero MongoDB falló. ID:", id);
    throw new ErrorEliminarArchivo("Archivo borrado de la nube, pero hubo un error en la base de datos.", 500);
  }

  return { ok: true, id, mensaje: "Archivo eliminado" };
}
