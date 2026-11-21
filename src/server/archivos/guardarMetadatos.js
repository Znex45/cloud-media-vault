import "server-only";
import conectarMongoDB from "@/lib/mongodb";
import Archivo from "@/models/Archivo";

export async function guardarMetadatos(metadatos) {
  await conectarMongoDB();
  const documento = await Archivo.create(metadatos);
  const guardado = documento.toJSON();

  return {
    ...guardado,
    id: String(guardado.id),
    fechaSubida: new Date(guardado.fechaSubida).toISOString(),
  };
}
