import "server-only";
import mongoose from "mongoose";

const cacheGlobal = globalThis;

const cache = cacheGlobal.__mongooseCache ?? {
  connection: null,
  promise: null,
};

cacheGlobal.__mongooseCache = cache;

/**
 * Abre una unica conexion reutilizable con MongoDB Atlas.
 * La promesa se conserva durante el hot reload de Next.js para evitar
 * conexiones duplicadas en desarrollo.
 */
export default async function conectarMongoDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI no esta configurada. Agregala a .env.local y reinicia el servidor.",
    );
  }

  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch {
    cache.promise = null;
    throw new Error(
      "No fue posible conectar con MongoDB. Revisa Atlas, la IP autorizada y MONGODB_URI.",
    );
  }
}
