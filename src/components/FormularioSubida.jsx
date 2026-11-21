"use client";

import { useId, useRef, useState } from "react";

// Debe coincidir con el contrato del README (sección 7.1) y con la
// validación del servidor. Esto complementa, no reemplaza, el backend.
const MAX_TAMANO_BYTES = 10 * 1024 * 1024;

const TIPOS_ADMITIDOS = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "application/pdf": ["pdf"],
};

const ACCEPT = Object.keys(TIPOS_ADMITIDOS).join(",");

export function formatearTamano(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("es-CO", { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 2 })} MB`;
}

function extensionDe(nombre) {
  const punto = nombre.lastIndexOf(".");
  return punto < 0 ? "" : nombre.slice(punto + 1).toLowerCase();
}

/** Devuelve un mensaje de error o null si el archivo es válido. */
function validarArchivo(archivo) {
  if (!archivo) return "Selecciona o arrastra un archivo.";
  const extensiones = TIPOS_ADMITIDOS[archivo.type];
  if (!extensiones) {
    return "Formato no permitido. Usa JPG, PNG, WEBP, MP4, WEBM o PDF.";
  }
  if (!extensiones.includes(extensionDe(archivo.name))) {
    return "La extensión del archivo no coincide con su tipo.";
  }
  if (archivo.size === 0) return "El archivo está vacío.";
  if (archivo.size > MAX_TAMANO_BYTES) {
    return `El archivo pesa ${formatearTamano(archivo.size)}; el máximo permitido es 10 MB.`;
  }
  return null;
}

export default function FormularioSubida({ onSubido }) {
  const idBase = useId();
  const inputArchivoRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [subidoPor, setSubidoPor] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  // { tipo: "exito" | "error", texto: string } | null
  const [mensaje, setMensaje] = useState(null);

  function seleccionar(nuevo) {
    if (!nuevo) return;
    const error = validarArchivo(nuevo);
    if (error) {
      setArchivo(null);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      setMensaje({ tipo: "error", texto: error });
      return;
    }
    setArchivo(nuevo);
    setMensaje(null);
  }

  function quitarArchivo() {
    setArchivo(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  }

  function alSoltar(evento) {
    evento.preventDefault();
    setArrastrando(false);
    if (cargando) return;
    const archivos = evento.dataTransfer?.files;
    if (!archivos || archivos.length === 0) return;
    if (archivos.length > 1) {
      setMensaje({ tipo: "error", texto: "Suelta un solo archivo a la vez." });
      return;
    }
    seleccionar(archivos[0]);
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    if (cargando) return;

    const tituloLimpio = titulo.trim();
    const autorLimpio = subidoPor.trim();

    const errorArchivo = validarArchivo(archivo);
    if (errorArchivo) {
      setMensaje({ tipo: "error", texto: errorArchivo });
      return;
    }
    if (!tituloLimpio) {
      setMensaje({ tipo: "error", texto: "Escribe un título para el archivo." });
      return;
    }
    if (!autorLimpio) {
      setMensaje({ tipo: "error", texto: "Escribe el nombre del autor." });
      return;
    }

    const datos = new FormData();
    datos.append("archivo", archivo);
    datos.append("titulo", tituloLimpio);
    datos.append("subidoPor", autorLimpio);

    setCargando(true);
    setMensaje(null);

    try {
      // No se fija Content-Type: el navegador agrega el boundary multipart.
      const respuesta = await fetch("/api/archivos", { method: "POST", body: datos });
      let resultado = null;
      try {
        resultado = await respuesta.json();
      } catch {
        resultado = null;
      }

      if (!respuesta.ok || !resultado?.ok) {
        const texto =
          resultado?.error ??
          (respuesta.status === 413
            ? "El archivo supera el tamaño permitido por el servidor."
            : `No fue posible subir el archivo (error ${respuesta.status}).`);
        setMensaje({ tipo: "error", texto });
        return;
      }

      setMensaje({
        tipo: "exito",
        texto: `«${resultado.archivo?.titulo ?? tituloLimpio}» se subió correctamente.`,
      });
      setTitulo("");
      quitarArchivo();
      // El autor se conserva para facilitar varias subidas seguidas.
      onSubido?.(resultado.archivo);
    } catch {
      setMensaje({
        tipo: "error",
        texto: "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.",
      });
    } finally {
      setCargando(false);
    }
  }

  const idTitulo = `${idBase}-titulo`;
  const idAutor = `${idBase}-autor`;
  const idArchivo = `${idBase}-archivo`;
  const idAyuda = `${idBase}-ayuda`;

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate aria-busy={cargando}>
      <label
        htmlFor={idArchivo}
        className={`zona-carga${arrastrando ? " zona-carga--activa" : ""}${
          archivo ? " zona-carga--con-archivo" : ""
        }${cargando ? " zona-carga--deshabilitada" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!cargando) setArrastrando(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = cargando ? "none" : "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setArrastrando(false);
        }}
        onDrop={alSoltar}
      >
        <input
          ref={inputArchivoRef}
          id={idArchivo}
          className="visualmente-oculto"
          type="file"
          name="archivo"
          accept={ACCEPT}
          disabled={cargando}
          aria-describedby={idAyuda}
          onChange={(e) => seleccionar(e.target.files?.[0])}
        />
        <span className="zona-carga__icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
        </span>
        {archivo ? (
          <span className="zona-carga__texto">
            <strong className="zona-carga__nombre">{archivo.name}</strong>
            <span>{formatearTamano(archivo.size)} · haz clic para cambiarlo</span>
          </span>
        ) : (
          <span className="zona-carga__texto">
            <strong>Arrastra y suelta un archivo aquí</strong>
            <span>o haz clic para buscarlo en tu equipo</span>
          </span>
        )}
        <span id={idAyuda} className="zona-carga__ayuda">
          Imagen (JPG, PNG, WEBP), video (MP4, WEBM) o PDF · máximo 10 MB
        </span>
      </label>

      {archivo && !cargando && (
        <button type="button" className="boton-enlace" onClick={quitarArchivo}>
          Quitar archivo seleccionado
        </button>
      )}

      <div className="formulario__campos">
        <div className="campo">
          <label htmlFor={idTitulo}>Título</label>
          <input
            id={idTitulo}
            type="text"
            name="titulo"
            value={titulo}
            maxLength={120}
            required
            disabled={cargando}
            placeholder="Ej.: Paisaje de montaña"
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor={idAutor}>Subido por</label>
          <input
            id={idAutor}
            type="text"
            name="subidoPor"
            value={subidoPor}
            maxLength={80}
            required
            disabled={cargando}
            placeholder="Tu nombre"
            autoComplete="name"
            onChange={(e) => setSubidoPor(e.target.value)}
          />
        </div>
      </div>

      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario" disabled={cargando}>
          {cargando ? (
            <>
              <span className="spinner" aria-hidden="true" /> Subiendo…
            </>
          ) : (
            "Subir archivo"
          )}
        </button>
        <div className="formulario__estado" role="status" aria-live="polite">
          {mensaje && (
            <p className={`aviso aviso--${mensaje.tipo}`}>{mensaje.texto}</p>
          )}
        </div>
      </div>
    </form>
  );
}
