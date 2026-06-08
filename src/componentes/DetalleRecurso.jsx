import "../styles/DetalleRecurso.css";
import { useState, useEffect, useRef } from "react";
import {
  agregarFavorito,
  obtenerFavoritos,
  obtenerUsuarioActual,
} from "../services/api";

const BACKEND_URL = "http://localhost/sitec";
const PROXY_URL   = "http://localhost:4000/pdf-proxy";

function obtenerUrlArchivo(recurso) {
  if (!recurso?.archivo_digital) return null;
  if (recurso.archivo_digital.startsWith("http")) return recurso.archivo_digital;
  return `${BACKEND_URL}/${recurso.archivo_digital}`;
}

async function getPDFThumb(archivoDigital) {
  if (!archivoDigital) return null;
  let proxyUrl;
  if (archivoDigital.includes("localhost/sitec/")) {
    const relativa = archivoDigital.split("localhost/sitec/")[1];
    proxyUrl = `${PROXY_URL}?archivo=${encodeURIComponent(relativa)}`;
  } else if (archivoDigital.startsWith("http")) {
    return getPDFThumbJS(archivoDigital);
  } else {
    proxyUrl = `${PROXY_URL}?archivo=${encodeURIComponent(archivoDigital)}`;
  }
  return getPDFThumbJS(proxyUrl);
}

async function getPDFThumbJS(url) {
  try {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) return null;
    const pdf    = await pdfjsLib.getDocument({ url }).promise;
    const page   = await pdf.getPage(1);
    const vp     = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width  = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    return canvas.toDataURL("image/jpeg", 0.90);
  } catch {
    return null;
  }
}

// ── Generadores de citas ──────────────────────────────────
function generarCitaAPA(libro) {
  const anio      = libro.anio_publicacion || libro.anio || "s.f.";
  const autor     = formatearAutorAPA(libro);
  const titulo    = libro.titulo || "Sin título";
  const editorial = libro.nombre_editorial || "";
  const isbn      = libro.isbn || "";
  const url       = libro.url_acceso || obtenerUrlArchivo(libro) || "";

  let cita = `${autor} (${anio}). ${titulo}.`;
  if (editorial) cita += ` ${editorial}.`;
  if (isbn)      cita += ` ISBN: ${isbn}.`;
  if (url)       cita += ` Recuperado de ${url}`;
  return cita;
}

function generarCitaIEEE(libro) {
  const anio      = libro.anio_publicacion || libro.anio || "s.f.";
  const autor     = formatearAutorIEEE(libro);
  const titulo    = libro.titulo || "Sin título";
  const editorial = libro.nombre_editorial || "";
  const isbn      = libro.isbn || "";
  const url       = libro.url_acceso || obtenerUrlArchivo(libro) || "";

  let cita = `${autor}, "${titulo},"`;
  if (editorial) cita += ` ${editorial},`;
  cita += ` ${anio}.`;
  if (isbn) cita += ` ISBN: ${isbn}.`;
  if (url)  cita += ` [Online]. Disponible: ${url}`;
  return cita;
}

function formatearAutorAPA(libro) {
  const nombre   = libro.nombre_autor   || "";
  const apellido = libro.apellido_autor || "";
  const autorRaw = libro.autor || "";

  if (apellido && nombre) {
    const iniciales = nombre.split(" ").map(n => n[0] + ".").join(" ");
    return `${apellido}, ${iniciales}`;
  }
  if (autorRaw) {
    const partes = autorRaw.trim().split(" ");
    if (partes.length >= 2) {
      const ap  = partes[partes.length - 1];
      const ini = partes.slice(0, -1).map(n => n[0] + ".").join(" ");
      return `${ap}, ${ini}`;
    }
    return autorRaw;
  }
  return "Autor desconocido";
}

function formatearAutorIEEE(libro) {
  const nombre   = libro.nombre_autor   || "";
  const apellido = libro.apellido_autor || "";
  const autorRaw = libro.autor || "";

  if (nombre && apellido) {
    const iniciales = nombre.split(" ").map(n => n[0] + ".").join(". ");
    return `${iniciales}. ${apellido}`;
  }
  if (autorRaw) {
    const partes = autorRaw.trim().split(" ");
    if (partes.length >= 2) {
      const ap  = partes[partes.length - 1];
      const ini = partes.slice(0, -1).map(n => n[0] + ".").join(". ");
      return `${ini}. ${ap}`;
    }
    return autorRaw;
  }
  return "Autor desconocido";
}

// ── Componente principal ──────────────────────────────────
export default function DetalleRecurso({ libro, onCerrar, onDescargar }) {
  const [thumb,        setThumb]        = useState(null);
  const [loadingThumb, setLoadingThumb] = useState(true);
  const [tabCita,      setTabCita]      = useState("apa");
  const [copiado,      setCopiado]      = useState(false);
  const [descargando,  setDescargando]  = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Favoritos ──
  const [esFavorito, setEsFavorito] = useState(false);
  const [addingFav,  setAddingFav]  = useState(false);

  const timerRef  = useRef(null);
  const overlayRef = useRef(null);

  const usuario   = obtenerUsuarioActual();
  const idUsuario = usuario?.id_usuario || usuario?.id || usuario?.idUsuario || null;

  const url       = obtenerUrlArchivo(libro);
  const hasPDF    = Boolean(url);
  const hasLink   = Boolean(libro.url_acceso);
  const anio      = libro.anio_publicacion || libro.anio || "—";
  const editorial = libro.nombre_editorial || "—";
  const isbn      = libro.isbn || "—";
  const idioma    = libro.idioma || "Español";
  const formato   = libro.formato || "PDF";
  const categoria = libro.nombre_categoria || libro.categoria || "—";
  const autorNombre = `${libro.nombre_autor || ""} ${libro.apellido_autor || ""}`.trim()
    || libro.autor || "Autor no registrado";

  const citaAPA     = generarCitaAPA(libro);
  const citaIEEE    = generarCitaIEEE(libro);
  const citaActual  = tabCita === "apa" ? citaAPA : citaIEEE;

  // Cargar miniatura
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (url) {
        const t = await getPDFThumb(url);
        if (!cancelled) { setThumb(t); setLoadingThumb(false); }
      } else {
        if (!cancelled) setLoadingThumb(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [url]);

  // Verificar si ya está en favoritos
  useEffect(() => {
    if (!idUsuario || !libro?.id_recurso) return;
    obtenerFavoritos(idUsuario)
      .then((lista) => {
        const yaEsta = lista.some((f) => f.id_recurso === libro.id_recurso);
        setEsFavorito(yaEsta);
      })
      .catch(() => {});
  }, [idUsuario, libro?.id_recurso]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCerrar]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }

  function copiarCita() {
    navigator.clipboard.writeText(citaActual).then(() => {
      setCopiado(true);
      showToast("Cita copiada al portapapeles", "success");
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  async function handleDescargar() {
    if (!url) { showToast("Este recurso solo tiene enlace.", "warn"); return; }
    setDescargando(true);
    try {
      let fetchUrl = url;
      if (url.includes("localhost/sitec/")) {
        const relativa = url.split("localhost/sitec/")[1];
        fetchUrl = `${PROXY_URL}?archivo=${encodeURIComponent(relativa)}`;
      }
      const res  = await fetch(fetchUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const bUrl = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = bUrl;
      a.download = libro.archivo_digital?.split("/").pop() || `${libro.titulo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(bUrl);
      showToast("Descarga iniciada correctamente", "success");
      if (onDescargar) onDescargar(libro);
    } catch {
      showToast("No se pudo descargar el archivo.", "error");
    } finally {
      setDescargando(false);
    }
  }

  function handleVerRecurso() {
    let urlFinal = null;
    if (url) {
      if (url.includes("localhost/sitec/")) {
        const relativa = url.split("localhost/sitec/")[1];
        urlFinal = `${PROXY_URL}?archivo=${encodeURIComponent(relativa)}`;
      } else {
        urlFinal = url;
      }
    } else if (libro.url_acceso) {
      urlFinal = libro.url_acceso;
    }
    if (urlFinal) window.open(urlFinal, "_blank");
  }

  async function handleAgregarFavorito() {
    if (!idUsuario) { showToast("Debes iniciar sesión.", "warn"); return; }
    if (esFavorito) return;
    setAddingFav(true);
    try {
      await agregarFavorito(idUsuario, libro.id_recurso);
      setEsFavorito(true);
      showToast("Añadido a favoritos ✨", "success");
    } catch {
      showToast("No se pudo añadir a favoritos.", "error");
    } finally {
      setAddingFav(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onCerrar();
  }

  return (
    <div className="dr-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="dr-modal">

        {/* ── BOTÓN CERRAR ── */}
        <button className="dr-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="dr-body">

          {/* ── COLUMNA IZQUIERDA: portada + acciones ── */}
          <div className="dr-left">
            <div className="dr-cover-wrap">
              {loadingThumb ? (
                <div className="dr-cover-loading">
                  <div className="dr-spinner" />
                </div>
              ) : thumb ? (
                <img src={thumb} alt={`Portada: ${libro.titulo}`} className="dr-cover-img" />
              ) : (
                <div className="dr-cover-gen">
                  <div className="dr-cover-gen-cat">{categoria}</div>
                  <div className="dr-cover-gen-title">{libro.titulo}</div>
                  <div className="dr-cover-gen-author">{autorNombre}</div>
                </div>
              )}
              <span className="dr-fmt-badge">{formato}</span>
            </div>

            {/* Acciones */}
            <div className="dr-acciones">
              {(hasPDF || hasLink) && (
                <button className="dr-btn dr-btn-ver" onClick={handleVerRecurso}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Leer recurso
                </button>
              )}

              {hasPDF && (
                <button
                  className="dr-btn dr-btn-dl"
                  onClick={handleDescargar}
                  disabled={descargando}
                >
                  {descargando ? (
                    <>
                      <div className="dr-btn-spinner" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </button>
              )}

              {!hasPDF && hasLink && (
                <button className="dr-btn dr-btn-ver" onClick={handleVerRecurso}>
                  🔗 Abrir enlace
                </button>
              )}

              {/* ── BOTÓN FAVORITO ── */}
              <button
                className={`dr-btn dr-btn-fav ${esFavorito ? "activo" : ""}`}
                onClick={handleAgregarFavorito}
                disabled={addingFav || esFavorito}
                title={esFavorito ? "Ya está en tus favoritos" : "Añadir a favoritos"}
              >
                <svg
                  width="15" height="15" viewBox="0 0 24 24"
                  fill={esFavorito ? "currentColor" : "none"}
                  stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {addingFav ? "Guardando..." : esFavorito ? "En favoritos" : "Añadir a favoritos"}
              </button>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: info + citas ── */}
          <div className="dr-right">

            {/* Título y autor */}
            <div className="dr-header">
              <div className="dr-categoria-badge">{categoria}</div>
              <h2 className="dr-titulo">{libro.titulo || "Sin título"}</h2>
              <div className="dr-autor">✍️ {autorNombre}</div>
            </div>

            {/* Metadata */}
            <div className="dr-meta-grid">
              <div className="dr-meta-item">
                <span className="dr-meta-lbl">Año</span>
                <span className="dr-meta-val">{anio}</span>
              </div>
              <div className="dr-meta-item">
                <span className="dr-meta-lbl">Editorial</span>
                <span className="dr-meta-val">{editorial}</span>
              </div>
              <div className="dr-meta-item">
                <span className="dr-meta-lbl">ISBN</span>
                <span className="dr-meta-val">{isbn}</span>
              </div>
              <div className="dr-meta-item">
                <span className="dr-meta-lbl">Idioma</span>
                <span className="dr-meta-val">{idioma}</span>
              </div>
              <div className="dr-meta-item">
                <span className="dr-meta-lbl">Formato</span>
                <span className="dr-meta-val">{formato}</span>
              </div>
              {libro.materias?.length > 0 && (
                <div className="dr-meta-item dr-meta-full">
                  <span className="dr-meta-lbl">Materias</span>
                  <div className="dr-materias">
                    {libro.materias.map(m => (
                      <span key={m.id_materia} className="dr-materia-chip">
                        {m.sigla_materia || m.nombre_materia}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen */}
            {libro.resumen && (
              <div className="dr-resumen-wrap">
                <div className="dr-section-title">Descripción</div>
                <p className="dr-resumen">{libro.resumen}</p>
              </div>
            )}

            {/* ── CITAS ── */}
            <div className="dr-citas-wrap">
              <div className="dr-section-title">Generar cita bibliográfica</div>

              <div className="dr-cita-tabs">
                <button
                  className={`dr-cita-tab ${tabCita === "apa" ? "on" : ""}`}
                  onClick={() => setTabCita("apa")}
                >
                  APA 7ª ed.
                </button>
                <button
                  className={`dr-cita-tab ${tabCita === "ieee" ? "on" : ""}`}
                  onClick={() => setTabCita("ieee")}
                >
                  IEEE
                </button>
              </div>

              <div className="dr-cita-box">
                <p className="dr-cita-texto">{citaActual}</p>
                <button
                  className={`dr-cita-copiar ${copiado ? "copiado" : ""}`}
                  onClick={copiarCita}
                  title="Copiar cita"
                >
                  {copiado ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className="dr-cita-hint">
                {tabCita === "apa"
                  ? "Formato APA — Publication Manual of the American Psychological Association, 7ª edición."
                  : "Formato IEEE — Institute of Electrical and Electronics Engineers."}
              </div>
            </div>

          </div>
        </div>

        {/* Toast interno */}
        {toast && (
          <div className={`dr-toast show dr-toast-${toast.type}`}>
            <span>{toast.type === "success" ? "✅" : toast.type === "warn" ? "⚠️" : "❌"}</span>
            <span>{toast.msg}</span>
          </div>
        )}

      </div>
    </div>
  );
}