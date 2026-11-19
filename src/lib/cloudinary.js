import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configurado = false;

const credencialesIniciales = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

if (
  credencialesIniciales.cloud_name &&
  credencialesIniciales.api_key &&
  credencialesIniciales.api_secret
) {
  cloudinary.config(credencialesIniciales);
  configurado = true;
}

/**
 * Configura y devuelve el cliente servidor de Cloudinary.
 * Los secretos nunca deben importarse desde un Client Component.
 */
export function obtenerCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan variables de Cloudinary. Completa .env.local y reinicia el servidor.",
    );
  }

  if (!configurado) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configurado = true;
  }

  return cloudinary;
}

export const CARPETA_CLOUDINARY = "cloud-media-vault";

export default cloudinary;
