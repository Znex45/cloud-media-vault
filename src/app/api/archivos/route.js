import { NextResponse } from "next/server";
import { listarArchivos, ErrorConsultaArchivos } from "@/server/archivos/listarArchivos";
import { guardarMetadatos } from "@/server/archivos/guardarMetadatos";
import { eliminarDeCloudinary, subirACloudinary } from "@/server/archivos/subirACloudinary";
import { ErrorValidacionArchivo, validarArchivo } from "@/server/archivos/validarArchivo";


function respuestaError(error, status) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return respuestaError("La solicitud debe usar multipart/form-data válido.", 400);
  }

  const archivo = formData.get("archivo");
  const titulo = formData.get("titulo");
  const subidoPor = formData.get("subidoPor");

  let datos;
  try {
    datos = await validarArchivo({ archivo, titulo, subidoPor });
  } catch (error) {
    if (error instanceof ErrorValidacionArchivo) {
      return respuestaError(error.message, error.status);
    }
    console.error("No fue posible validar el archivo recibido.");
    return respuestaError("No fue posible procesar el archivo.", 500);
  }

  let cloudResult;
  try {
    cloudResult = await subirACloudinary(datos.bytes);
  } catch {
    console.error("Falló la subida a Cloudinary.");
    return respuestaError("No fue posible subir el archivo a la nube.", 502);
  }

  try {
    const guardado = await guardarMetadatos({
      titulo: datos.titulo,
      url: cloudResult.secure_url,
      publicId: cloudResult.public_id,
      tipoArchivo: datos.tipoArchivo,
      mimeType: datos.mimeType,
      tamanoBytes: cloudResult.bytes,
      subidoPor: datos.subidoPor,
      resourceType: cloudResult.resource_type,
    });

    return NextResponse.json({ ok: true, archivo: guardado }, { status: 201 });
  } catch {
    try {
      await eliminarDeCloudinary({
        publicId: cloudResult.public_id,
        resourceType: cloudResult.resource_type,
      });
    } catch {
      console.error("Falló la compensación del recurso en Cloudinary.");
    }

    console.error("No fue posible guardar los metadatos del archivo.");
    return respuestaError("El archivo se subió, pero no fue posible guardar sus metadatos.", 500);
  }
}

/** GET /api/archivos?tipo=imagen|video|pdf&q=texto */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const archivos = await listarArchivos({
      tipo: searchParams.get("tipo") ?? "",
      q: searchParams.get("q") ?? "",
    });
    return NextResponse.json({ ok: true, archivos }, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorConsultaArchivos) {
      return respuestaError(error.message, error.status);
    }
    console.error("No fue posible consultar los archivos en MongoDB.");
    return respuestaError("No fue posible consultar los archivos.", 500);
  }
}
