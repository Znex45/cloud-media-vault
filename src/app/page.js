"use client";

import { useState } from "react";
import FormularioSubida from "@/components/FormularioSubida";
import Galeria from "@/components/Galeria";

/**
 * Página principal de Cloud Media Vault (Rol 4 + 5 — Alejandro).
 * Coordina el formulario de subida y la galería: cuando una subida termina
 * con éxito se incrementa `recargas` y la galería vuelve a pedir GET sin
 * refrescar la página.
 */
export default function Home() {
  const [recargas, setRecargas] = useState(0);

  return (
    <div className="pagina">
      <header className="encabezado">
        <div className="contenedor encabezado__contenido">
          <a className="marca" href="#inicio" aria-label="Cloud Media Vault, inicio">
            <span className="marca__icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19a4.5 4.5 0 0 0 0-9h-1.26A7 7 0 1 0 4 16.25" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </span>
            Cloud Media Vault
          </a>
          <nav className="navegacion" aria-label="Secciones">
            <a href="#subir">Subir</a>
            <a href="#galeria">Galería</a>
          </nav>
        </div>
      </header>

      <main id="inicio" className="contenedor principal">
        <section className="presentacion">
          <h1>Cloud Media Vault</h1>
          <p>
            Sube, organiza y consulta imágenes, videos y documentos PDF. Los
            archivos se guardan en Cloudinary y sus datos (título, autor, tipo,
            tamaño y fecha) en MongoDB Atlas.
          </p>
          <ul className="presentacion__formatos" aria-label="Formatos admitidos">
            <li>JPG · PNG · WEBP</li>
            <li>MP4 · WEBM</li>
            <li>PDF</li>
            <li>Máx. 10 MB</li>
          </ul>
        </section>

        <section id="subir" className="panel" aria-labelledby="titulo-subir">
          <h2 id="titulo-subir">Subir un archivo</h2>
          <FormularioSubida onSubido={() => setRecargas((n) => n + 1)} />
        </section>

        <section id="galeria" className="panel" aria-labelledby="titulo-galeria">
          <h2 id="titulo-galeria">Galería multimedia</h2>
          <Galeria recargas={recargas} />
        </section>
      </main>

      <footer className="pie">
        <div className="contenedor">
          Taller práctico — Desarrollo de Experiencias Multimedia para la Web
        </div>
      </footer>
    </div>
  );
}
