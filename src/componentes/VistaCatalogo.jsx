import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../styles/vistas.css";
import DetalleRecurso from "./DetalleRecurso";

const API_URL     = import.meta.env.VITE_API_URL || "http://localhost/sitec/api";
const BACKEND_URL = "http://localhost/sitec";
const PROXY_URL   = "http://localhost:3000/pdf-proxy";

// ── helpers ──────────────────────────────────────────────────
const norm = (v) => String(v || "").toLowerCase().trim();

function obtenerUsuario() {
  try { return JSON.parse(localStorage.getItem("usuario")) || null; }
  catch { return null; }
}

function obtenerUrlArchivo(recurso) {
  if (!recurso?.archivo_digital) return null;
  if (recurso.archivo_digital.startsWith("http")) return recurso.archivo_digital;
  return `${BACKEND_URL}/${recurso.archivo_digital}`;
}

const FORMATOS = ["Todos", "PDF", "DOC", "VIDEO", "LINK"];

// ── paletas de portadas generadas ──
const PALETTES = [
  { bg: "linear-gradient(160deg,#1a1060 0%,#4a1060 100%)", spine: "#efb43c" },
  { bg: "linear-gradient(160deg,#5b0b34 0%,#950d1f 100%)", spine: "#f5d78e" },
  { bg: "linear-gradient(160deg,#0a3d62 0%,#0f6e56 100%)", spine: "#9fe1cb" },
  { bg: "linear-gradient(160deg,#2d1b00 0%,#854f0b 100%)", spine: "#fac775" },
  { bg: "linear-gradient(160deg,#0d2137 0%,#185fa5 100%)", spine: "#85b7eb" },
  { bg: "linear-gradient(160deg,#1a3a1a 0%,#3b6d11 100%)", spine: "#c0dd97" },
  { bg: "linear-gradient(160deg,#3a0a2a 0%,#993556 100%)", spine: "#f4c0d1" },
  { bg: "linear-gradient(160deg,#1a1a2e 0%,#534ab7 100%)", spine: "#afa9ec" },
];

// ── extrae miniatura del PDF vía proxy Node ──
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
    const vp     = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    canvas.width  = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

// ── tarjeta individual de libro ──
function LibroCard({ libro, idx, onVer, onDescargar, onDetalle }) {
  const [thumb,        setThumb]        = useState(null);
  const [loadingThumb, setLoadingThumb] = useState(true);

  const p           = PALETTES[idx % PALETTES.length];
  const url         = obtenerUrlArchivo(libro);
  const hasPDF      = Boolean(url);
  const hasLink     = Boolean(libro.url_acceso);
  const autorNombre = `${libro.nombre_autor || ""} ${libro.apellido_autor || ""}`.trim()
    || libro.autor || "Autor no registrado";

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

  const fmtStyle =
    norm(libro.formato) === "pdf"
      ? { background: "rgba(91,11,52,.12)",  color: "#711428" }
      : norm(libro.formato) === "link"
      ? { background: "rgba(17,11,81,.10)",  color: "#0c447c" }
      : norm(libro.formato) === "video"
      ? { background: "rgba(149,13,31,.09)", color: "#7a0a10" }
      : { background: "rgba(10,110,60,.09)", color: "#0a6e3c" };

  return (
    <div className="bib-card">
      {/* ── PORTADA ── */}
      <div
        className="bib-cover"
        style={!thumb ? { background: p.bg } : {}}
        onClick={() => onDetalle(libro)}
        title={libro.titulo}
      >
        {loadingThumb && (
          <div className="bib-cover-loader">
            <div className="bib-spinner" />
          </div>
        )}
        {!loadingThumb && thumb && (
          <img src={thumb} alt={`Portada: ${libro.titulo}`} className="bib-cover-img" />
        )}
        {!loadingThumb && !thumb && (
          <div className="bib-cover-gen">
            <div className="bib-spine" style={{ background: p.spine }} />
            <div className="bib-cover-cat">
              {libro.nombre_categoria || libro.categoria || ""}
            </div>
            <div className="bib-cover-title">{libro.titulo || "Sin título"}</div>
            <div className="bib-cover-author">{autorNombre}</div>
          </div>
        )}
        <span className="bib-fmt-badge" style={fmtStyle}>
          {libro.formato || "PDF"}
        </span>
        {(hasPDF || hasLink) && (
          <div className="bib-cover-overlay">
            <span className="bib-cover-overlay-icon">👁</span>
          </div>
        )}
      </div>

      {/* ── INFO ── */}
      <div className="bib-meta">
        <div className="bib-meta-title" title={libro.titulo}>
          {libro.titulo || "Recurso sin título"}
        </div>
        <div className="bib-meta-author">{autorNombre}</div>
        {(libro.nombre_categoria || libro.categoria) && (
          <div className="bib-meta-cat">
            {libro.nombre_categoria || libro.categoria}
          </div>
        )}
        <div className="bib-actions">
          {(hasPDF || hasLink) && (
            <button
              className="bib-btn bib-btn-ver"
              onClick={() => onDetalle(libro)}
            >
              Ver
            </button>
          )}
          {hasPDF && (
            <button
              className="bib-btn bib-btn-dl"
              onClick={() => onDescargar(libro)}
              title="Descargar"
            >
              ↓
            </button>
          )}
          {!hasPDF && !hasLink && (
            <span className="bib-sin-archivo">Sin archivo</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── componente principal ─────────────────────────────────────
export default function VistaCatalogo() {
  const location = useLocation();

  const [recursos,   setRecursos]   = useState([]);
  const [carreras,   setCarreras]   = useState([]);
  const [materias,   setMaterias]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [busqueda,    setBusqueda]    = useState(location.state?.busqueda || "");
  const [formato,     setFormato]     = useState("Todos");
  const [carreraId,   setCarreraId]   = useState("");
  const [materiaId,   setMateriaId]   = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const [panelAbierto,   setPanelAbierto]   = useState(false);
  const [toast,          setToast]          = useState(null);
  const [libroDetalle,   setLibroDetalle]   = useState(null); // modal detalle
  const toastRef = useRef(null);

  // ── carga de datos ──
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/recurso`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/carreras`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/materias`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/categorias`).then(r => r.json()).catch(() => []),
    ]).then(([rec, car, mat, cat]) => {
      setRecursos(Array.isArray(rec) ? rec : rec.recursos || []);
      setCarreras(Array.isArray(car) ? car : car.carreras || []);
      setMaterias(Array.isArray(mat) ? mat : mat.materias || []);
      setCategorias(Array.isArray(cat) ? cat : cat.categorias || []);
      setLoading(false);
    }).catch(() => {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (location.state?.busqueda !== undefined)
      setBusqueda(location.state.busqueda);
  }, [location.state]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function registrarActividad(recurso, tipo, titulo, detalle) {
    const u  = obtenerUsuario();
    const id = u?.id_usuario || u?.id || null;
    if (!id) return;
    try {
      await fetch(`${API_URL}/actividad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: id, id_recurso: recurso.id_recurso, tipo, titulo, detalle }),
      });
    } catch { /* silencioso */ }
  }

  async function verRecurso(recurso) {
    const url = obtenerUrlArchivo(recurso);
    if (url) {
      await registrarActividad(recurso, "VISUALIZACION_RECURSO", "Recurso visualizado", `Abriste: ${recurso.titulo}`);
      window.open(url, "_blank");
    } else if (recurso.url_acceso) {
      await registrarActividad(recurso, "ENLACE_RECURSO", "Enlace abierto", `Abriste enlace: ${recurso.titulo}`);
      window.open(recurso.url_acceso, "_blank");
    } else {
      showToast("Este recurso no tiene archivo ni enlace.", "warn");
    }
  }

  async function descargarRecurso(recurso) {
    const url = obtenerUrlArchivo(recurso);
    if (!url) { showToast("Este recurso solo tiene enlace.", "warn"); return; }
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
      a.download = recurso.archivo_digital?.split("/").pop() || `${recurso.titulo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(bUrl);
      await registrarActividad(recurso, "DESCARGA_RECURSO", "Recurso descargado", `Descargaste: ${recurso.titulo}`);
      showToast("Descarga iniciada", "success");
    } catch {
      showToast("No se pudo descargar el archivo.", "error");
    }
  }

  // ── filtrado ──
  const materiasDisponibles = carreraId
    ? materias.filter(m => String(m.id_carrera) === carreraId)
    : materias;

  const filtrosActivos = [carreraId, materiaId, categoriaId]
    .filter(Boolean).length + (formato !== "Todos" ? 1 : 0);

  const recursosFiltrados = recursos.filter((r) => {
    const txt           = norm(busqueda);
    const autorCompleto = `${r.nombre_autor || ""} ${r.apellido_autor || ""}`;

    const coincideTexto = txt === "" ||
      norm(r.titulo).includes(txt) ||
      norm(r.titulo_libro).includes(txt) ||
      norm(autorCompleto).includes(txt) ||
      norm(r.autor).includes(txt) ||
      norm(r.nombre_categoria).includes(txt) ||
      norm(r.categoria).includes(txt) ||
      norm(r.resumen).includes(txt) ||
      norm(r.nombre_editorial).includes(txt) ||
      norm(r.formato).includes(txt);

    const coincideFormato = formato === "Todos" ||
      norm(r.formato) === norm(formato) ||
      norm(r.tipo).includes(norm(formato));

    const coincideCarrera = !carreraId ||
      (r.materias || []).some(m => String(m.id_carrera) === carreraId) ||
      String(r.id_carrera) === carreraId;

    const coincideMateria = !materiaId ||
      (r.materias || []).some(m => String(m.id_materia) === materiaId) ||
      String(r.id_materia) === materiaId;

    const coincideCategoria = !categoriaId ||
      String(r.id_categoria) === categoriaId;

    return coincideTexto && coincideFormato && coincideCarrera && coincideMateria && coincideCategoria;
  });

  function limpiarFiltros() {
    setBusqueda("");
    setFormato("Todos");
    setCarreraId("");
    setMateriaId("");
    setCategoriaId("");
  }

  if (loading) {
    return (
      <div className="cat-state">
        <div className="cat-spinner" />
        <p>Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cat-state">
        <div className="cat-state-icon">⚠️</div>
        <p className="cat-state-msg">{error}</p>
      </div>
    );
  }

  return (
    <div className="cat-wrap">

      {/* ── HEADER ── */}
      <div className="cat-header">
        <div>
          <div className="cat-eyebrow">Biblioteca Digital · SITEC</div>
          <h1 className="cat-title">Catálogo de Recursos</h1>
          <p className="cat-sub">Explora material académico por carrera, materia o categoría</p>
        </div>
        <div className="cat-header-count">
          <span className="cat-count-num">{recursosFiltrados.length}</span>
          <span className="cat-count-lbl">recursos encontrados</span>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA ── */}
      <div className="cat-search-bar">
        <div className="cat-search-input-wrap">
          <span className="cat-search-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            className="cat-search-input"
            placeholder="Buscar por título, autor, editorial, descripción..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="cat-search-clear" onClick={() => setBusqueda("")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <button
          className={`cat-filtros-btn ${panelAbierto ? "open" : ""}`}
          onClick={() => setPanelAbierto(p => !p)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtros
          {filtrosActivos > 0 && (
            <span className="cat-filtros-badge">{filtrosActivos}</span>
          )}
        </button>

        {filtrosActivos > 0 && (
          <button className="cat-clear-btn" onClick={limpiarFiltros}>
            Limpiar todo
          </button>
        )}
      </div>

      {/* ── PANEL DE FILTROS AVANZADOS ── */}
      <div className={`cat-filtros-panel ${panelAbierto ? "open" : ""}`}>
        <div className="cat-filtros-grid">

          <div className="cat-filtro-group">
            <div className="cat-filtro-label">Formato</div>
            <div className="cat-chips">
              {FORMATOS.map(f => (
                <button key={f} className={`cat-chip ${formato === f ? "on" : ""}`} onClick={() => setFormato(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="cat-filtro-group">
            <div className="cat-filtro-label">Carrera</div>
            <div className="cat-select-wrap">
              <select className="cat-select" value={carreraId} onChange={e => { setCarreraId(e.target.value); setMateriaId(""); }}>
                <option value="">Todas las carreras</option>
                {carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>
                    {c.sigla ? `${c.sigla} · ` : ""}{c.nombre_carrera}
                  </option>
                ))}
              </select>
              <span className="cat-select-arrow">▾</span>
            </div>
          </div>

          <div className="cat-filtro-group">
            <div className="cat-filtro-label">
              Materia
              {!carreraId && <span className="cat-filtro-hint"> (selecciona una carrera primero)</span>}
            </div>
            <div className="cat-select-wrap">
              <select className="cat-select" value={materiaId} onChange={e => setMateriaId(e.target.value)} disabled={!carreraId}>
                <option value="">Todas las materias</option>
                {materiasDisponibles.map(m => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.sigla_materia ? `${m.sigla_materia} · ` : ""}{m.nombre_materia}
                  </option>
                ))}
              </select>
              <span className="cat-select-arrow">▾</span>
            </div>
          </div>

          <div className="cat-filtro-group">
            <div className="cat-filtro-label">Categoría</div>
            <div className="cat-select-wrap">
              <select className="cat-select" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.filter(c => c.estado !== 0).map(c => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.codigo ? `${c.codigo} · ` : ""}{c.nombre_categoria}
                  </option>
                ))}
              </select>
              <span className="cat-select-arrow">▾</span>
            </div>
          </div>

        </div>

        {filtrosActivos > 0 && (
          <div className="cat-filtros-resumen">
            {formato !== "Todos" && (
              <span className="cat-filtro-tag">Formato: {formato}<button onClick={() => setFormato("Todos")}>×</button></span>
            )}
            {carreraId && (
              <span className="cat-filtro-tag">
                Carrera: {carreras.find(c => String(c.id_carrera) === carreraId)?.sigla || carreraId}
                <button onClick={() => { setCarreraId(""); setMateriaId(""); }}>×</button>
              </span>
            )}
            {materiaId && (
              <span className="cat-filtro-tag">
                Materia: {materiasDisponibles.find(m => String(m.id_materia) === materiaId)?.sigla_materia || materiaId}
                <button onClick={() => setMateriaId("")}>×</button>
              </span>
            )}
            {categoriaId && (
              <span className="cat-filtro-tag">
                Cat: {categorias.find(c => String(c.id_categoria) === categoriaId)?.nombre_categoria || categoriaId}
                <button onClick={() => setCategoriaId("")}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── GRID DE LIBROS ── */}
      {recursosFiltrados.length === 0 ? (
        <div className="cat-state">
          <div className="cat-state-icon">🔍</div>
          <p className="cat-state-msg">No se encontraron recursos con los filtros aplicados.</p>
          <button className="cat-retry-btn" onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      ) : (
        <div className="cat-bib-wrap">
          <div className="cat-list-head">
            {recursosFiltrados.length} resultado{recursosFiltrados.length !== 1 ? "s" : ""}
          </div>
          <div className="cat-bib-grid">
            {recursosFiltrados.map((libro, idx) => (
              <LibroCard
                key={libro.id_recurso || libro.id}
                libro={libro}
                idx={idx}
                onVer={verRecurso}
                onDescargar={descargarRecurso}
                onDetalle={setLibroDetalle}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE ── */}
      {libroDetalle && (
        <DetalleRecurso
          libro={libroDetalle}
          onCerrar={() => setLibroDetalle(null)}
          onDescargar={descargarRecurso}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`cat-toast show cat-toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : toast.type === "warn" ? "⚠️" : "❌"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

    </div>
  );
}