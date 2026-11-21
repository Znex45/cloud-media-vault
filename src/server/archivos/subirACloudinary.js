import "server-only";
import { Readable } from "node:stream";
import { CARPETA_CLOUDINARY, obtenerCloudinary } from "@/lib/cloudinary";

export async function subirACloudinary(bytes) {
  const cloudinary = obtenerCloudinary();

  return new Promise((resolve, reject) => {
    const destino = cloudinary.uploader.upload_stream(
      {
        folder: CARPETA_CLOUDINARY,
        resource_type: "auto",
        unique_filename: true,
        use_filename: false,
      },
      (error, resultado) => {
        if (error || !resultado) {
          reject(new Error("Cloudinary no pudo recibir el archivo."));
          return;
        }

        resolve({
          secure_url: resultado.secure_url,
          public_id: resultado.public_id,
          resource_type: resultado.resource_type,
          bytes: resultado.bytes,
        });
      },
    );

    Readable.from([bytes]).pipe(destino);
    destino.on("error", () => reject(new Error("Cloudinary no pudo recibir el archivo.")));
  });
}

export async function eliminarDeCloudinary({ publicId, resourceType }) {
  const cloudinary = obtenerCloudinary();
  const resultado = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

  if (resultado.result !== "ok" && resultado.result !== "not found") {
    throw new Error("Cloudinary no confirmó la eliminación del recurso.");
  }

  return resultado;
}
