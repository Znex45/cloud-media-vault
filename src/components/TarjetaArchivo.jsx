"use client";

import { useState } from "react";
import { formatearTamano } from "@/components/FormularioSubida";

const ETIQUETAS_TIPO = {
  imagen: "Imagen",
  video: "Video",
  pdf: "PDF",
};

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "Fecha desconocida" : formatoFecha.format(fecha);
}

/**
 * Miniatura de la primera página de un PDF usando una transformación de
 * entrega de Cloudinary (solo cambia la URL pública; no usa secretos).
 * Si no aplica, devuelve null y se muestra un icono.
 */
function miniaturaPdf(url, resourceType) {
  if (resourceType !== "image" || typeof url !== "string") return null;
  if (!url.includes("/image/upload/") || !/\.pdf$/i.test(url)) return null;
  return url
    .replace("/image/upload/", "/image/upload/pg_1,w_600,c_limit,f_auto,q_auto/")
    .replace(/\.pdf$/i, ".jpg");
}

function IconoPdf() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h1.5a1.5 1.5 0 0 1 0 3H8v-5" />
      <path d="M13 11v5h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function VistaPrevia({ archivo }) {
  const [fallo, setFallo] = useState(false);
  const { tipoArchivo, url, titulo, mimeType, resourceType } = archivo;

  if (tipoArchivo === "imagen") {
    return fallo ? (
      <div className="tarjeta__sin-vista">No se pudo cargar la imagen</div>
    ) : (
      // next/image exigiría configurar remotePatterns (archivo de Andrés);
      // un <img> simple es suficiente para la galería.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={titulo ? `Vista previa de ${titulo}` : "Vista previa de la imagen"}
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
      />
    );
  }

  if (tipoArchivo === "video") {
    return (
      <video controls preload="metadata" playsInline aria-label={`Video: ${titulo}`}>
        <source src={url} type={mimeType} />
        Tu navegador no puede reproducir este video.{" "}
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir video
        </a>
      </video>
    );
  }

  if (tipoArchivo === "pdf") {
    const miniatura = miniaturaPdf(url, resourceType);
    return (
      <a
        className="tarjeta__pdf"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir PDF ${titulo} en una pestaña nueva`}
      >
        {miniatura && !fallo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={miniatura}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFallo(true)}
          />
        ) : (
          <span className="tarjeta__pdf-icono">
            <IconoPdf />
            <span>Documento PDF</span>
          </span>
        )}
      </a>
    );
  }

  return <div className="tarjeta__sin-vista">Vista previa no disponible</div>;
}

export default function TarjetaArchivo({ archivo, eliminando = false, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false);
  const tipo = ETIQUETAS_TIPO[archivo.tipoArchivo] ?? archivo.tipoArchivo;

  return (
    <article className={`tarjeta${eliminando ? " tarjeta--eliminando" : ""}`} aria-busy={eliminando}>
      <div className={`tarjeta__vista tarjeta__vista--${archivo.tipoArchivo}`}>
        <VistaPrevia archivo={archivo} />
        <span className={`insignia insignia--${archivo.tipoArchivo}`}>{tipo}</span>
      </div>

      <div className="tarjeta__cuerpo">
        <h3 className="tarjeta__titulo" title={archivo.titulo}>
          {archivo.titulo}
        </h3>
        <dl className="tarjeta__datos">
          <div>
            <dt>Tipo</dt>
            <dd>{tipo}</dd>
          </div>
          <div>
            <dt>Tamaño</dt>
            <dd>{formatearTamano(archivo.tamanoBytes)}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>
              <time dateTime={archivo.fechaSubida}>{formatearFecha(archivo.fechaSubida)}</time>
            </dd>
          </div>
          <div>
            <dt>Autor</dt>
            <dd>{archivo.subidoPor}</dd>
          </div>
        </dl>

        <div className="tarjeta__acciones">
          <a className="boton boton--secundario" href={archivo.url} target="_blank" rel="noopener noreferrer">
            {archivo.tipoArchivo === "pdf" ? "Abrir PDF" : "Abrir"}
          </a>

          {eliminando ? (
            <button type="button" className="boton boton--peligro" disabled>
              <span className="spinner spinner--pequeno" aria-hidden="true" /> Eliminando…
            </button>
          ) : confirmando ? (
            <div className="confirmacion" role="group" aria-label={`Confirmar eliminación de ${archivo.titulo}`}>
              <span>¿Eliminar?</span>
              <button
                type="button"
                className="boton boton--peligro"
                onClick={() => {
                  setConfirmando(false);
                  onEliminar?.(archivo);
                }}
              >
                Sí, eliminar
              </button>
              <button type="button" className="boton" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" className="boton boton--peligro-suave" onClick={() => setConfirmando(true)}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
