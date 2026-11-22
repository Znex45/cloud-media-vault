import { NextResponse } from "next/server";
import { eliminarArchivo, ErrorEliminarArchivo } from "@/server/archivos/eliminarArchivo";

/** DELETE /api/archivos/:id */
export async function DELETE(_request, { params }) {
  // Next.js 16 entrega params como promesa.
  const { id } = await params;

  try {
    const resultado = await eliminarArchivo(id);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorEliminarArchivo) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }
    console.error("Error inesperado en DELETE /api/archivos/:id.");
    return NextResponse.json(
      { ok: false, error: "No fue posible eliminar el archivo." },
      { status: 500 },
    );
  }
}
