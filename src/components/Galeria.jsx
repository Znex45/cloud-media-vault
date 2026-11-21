"use client";

import { useEffect, useId, useState } from "react";
import TarjetaArchivo from "@/components/TarjetaArchivo";

const FILTROS = [
  { valor: "", etiqueta: "Todos" },
  { valor: "imagen", etiqueta: "Imágenes" },
  { valor: "video", etiqueta: "Videos" },
  { valor: "pdf", etiqueta: "PDF" },
];

const ESPERA_BUSQUEDA_MS = 350;

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function leerJSON(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

/**
 * Galería multimedia: consulta GET /api/archivos?tipo=&q= (contrato 7.3),
 * permite filtrar, buscar y eliminar sin recargar la página.
 * `recargas` cambia cuando el formulario sube un archivo nuevo.
 */
export default function Galeria({ recargas = 0 }) {
  const idBusqueda = useId();
  const [tipo, setTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [reintentos, setReintentos] = useState(0);
  // { clave, archivos } | { clave, error }
  const [resultado, setResultado] = useState(null);
  const [eliminando, setEliminando] = useState(() => new Set());
  const [aviso, setAviso] = useState(null);

  const consulta = busquedaAplicada.trim();
  const clave = `${tipo}|${consulta}|${recargas}|${reintentos}`;
  const cargando = resultado?.clave !== clave;

  // Espera a que el usuario deje de escribir antes de consultar la API.
  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaAplicada(busqueda), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  useEffect(() => {
    const controlador = new AbortController();
    const parametros = new URLSearchParams();
    if (tipo) parametros.set("tipo", tipo);
    if (consulta) parametros.set("q", consulta);
    const url = parametros.size ? `/api/archivos?${parametros}` : "/api/archivos";

    (async () => {
      try {
        const respuesta = await fetch(url, { signal: controlador.signal, cache: "no-store" });
        const datos = await leerJSON(respuesta);
        if (!respuesta.ok || !datos?.ok || !Array.isArray(datos.archivos)) {
          setResultado({
            clave,
            error: datos?.error ?? `El servidor respondió con el código ${respuesta.status}.`,
          });
          return;
        }
        setResultado({ clave, archivos: datos.archivos });
      } catch (error) {
        if (error?.name === "AbortError") return;
        setResultado({ clave, error: "No hay conexión con el servidor." });
      }
    })();

    return () => controlador.abort();
  }, [clave, tipo, consulta]);

  async function eliminar(archivo) {
    setAviso(null);
    setEliminando((previo) => new Set(previo).add(archivo.id));
    try {
      const respuesta = await fetch(`/api/archivos/${encodeURIComponent(archivo.id)}`, {
        method: "DELETE",
      });
      const datos = await leerJSON(respuesta);

      if (!respuesta.ok || !datos?.ok) {
        // No se finge el borrado: la tarjeta se mantiene.
        setAviso({
          tipo: "error",
          texto: `No se pudo eliminar «${archivo.titulo}»: ${
            datos?.error ?? `error ${respuesta.status}`
          }`,
        });
        return;
      }

      setResultado((previo) =>
        previo?.archivos
          ? { ...previo, archivos: previo.archivos.filter((a) => a.id !== archivo.id) }
          : previo,
      );
      setAviso({ tipo: "exito", texto: `«${archivo.titulo}» se eliminó correctamente.` });
    } catch {
      setAviso({
        tipo: "error",
        texto: `No se pudo eliminar «${archivo.titulo}»: sin conexión con el servidor.`,
      });
    } finally {
      setEliminando((previo) => {
        const siguiente = new Set(previo);
        siguiente.delete(archivo.id);
        return siguiente;
      });
    }
  }

  // Respaldo en el cliente: si la API ya filtró, esto no cambia nada;
  // garantiza que la vista coincida con los filtros elegidos.
  const archivos = (resultado?.archivos ?? [])
    .filter((a) => !tipo || a.tipoArchivo === tipo)
    .filter((a) => !consulta || normalizar(a.titulo).includes(normalizar(consulta)))
    .sort((a, b) => new Date(b.fechaSubida) - new Date(a.fechaSubida));

  const hayFiltros = Boolean(tipo || consulta);
  const primeraCarga = cargando && !resultado;
  const error = !cargando ? resultado?.error : null;
  const hayLista = Boolean(resultado?.archivos);

  return (
    <div className="galeria">
      <div className="filtros" role="search">
        <div className="filtros__tipos" role="group" aria-label="Filtrar por tipo">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.valor || "todos"}
              type="button"
              className={`chip${tipo === filtro.valor ? " chip--activo" : ""}`}
              aria-pressed={tipo === filtro.valor}
              onClick={() => setTipo(filtro.valor)}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>
        <div className="filtros__busqueda">
          <label htmlFor={idBusqueda} className="visualmente-oculto">
            Buscar por título
          </label>
          <svg className="filtros__lupa" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id={idBusqueda}
            type="search"
            placeholder="Buscar por título"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="galeria__estado" role="status" aria-live="polite">
        {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}
        {cargando && !primeraCarga && (
          <p className="galeria__actualizando">
            <span className="spinner spinner--pequeno" aria-hidden="true" /> Actualizando…
          </p>
        )}
        {!cargando && !error && (
          <p className="galeria__conteo">
            {archivos.length === 1 ? "1 archivo" : `${archivos.length} archivos`}
          </p>
        )}
      </div>

      {primeraCarga && (
        <div className="estado-vacio">
          <span className="spinner" aria-hidden="true" />
          <p>Cargando archivos…</p>
        </div>
      )}

      {error && (
        <div className="estado-vacio estado-vacio--error" role="alert">
          <p>
            <strong>No fue posible cargar la galería.</strong>
          </p>
          <p>{error}</p>
          <button type="button" className="boton" onClick={() => setReintentos((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {hayLista && !error && archivos.length === 0 && (
        <div className="estado-vacio">
          {hayFiltros ? (
            <p>No hay archivos que coincidan con la búsqueda o el filtro.</p>
          ) : (
            <p>Aún no hay archivos. Sube el primero con el formulario.</p>
          )}
        </div>
      )}

      {hayLista && !error && archivos.length > 0 && (
        <ul className={`galeria__rejilla${cargando ? " galeria__rejilla--atenuada" : ""}`}>
          {archivos.map((archivo) => (
            <li key={archivo.id}>
              <TarjetaArchivo
                archivo={archivo}
                eliminando={eliminando.has(archivo.id)}
                onEliminar={eliminar}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
