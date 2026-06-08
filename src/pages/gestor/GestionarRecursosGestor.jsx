import { useEffect, useMemo, useRef, useState } from "react";
import "../admin/sections/GestionLibrosSection/GestionLibrosSection.css";
import { obtenerLibrosGestor, crearLibroGestor, actualizarLibroGestor } from "../../services/librosGestorService";


const BACKEND_URL = "http://localhost:4000";

const formularioInicial = {
  titulo: "",
  autor: "",
  categoria: "",
  editorial: "",
  anio: new Date().getFullYear(),
  id_materia: "",
  formato: "PDF",
  idioma: "Español",
  resumen: "",
};

const estadosFiltro = [
  "Todos los estados",
  "Publicado",
  "Pendiente",
  "Rechazado",
];

function obtenerUrlArchivo(ruta) {
  if (!ruta) return "";
  if (ruta.startsWith("http")) return ruta;
  return `${BACKEND_URL}/${ruta}`;
}

function obtenerInicialesTitulo(titulo) {
  if (!titulo) return "ST";
  return titulo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function normalizarEstado(estado) {
  const valor = String(estado || "").toUpperCase();
  if (valor === "APROBADO") return "Publicado";
  if (valor === "RECHAZADO") return "Rechazado";
  return "Pendiente";
}

function obtenerClaseEstadoCard(estado) {
  if (estado === "Publicado") return "publicado";
  if (estado === "Rechazado") return "rechazado";
  return "pendiente";
}

// ── Leer usuario UNA sola vez fuera del componente ──
function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function GestionLibrosSection() {
  // ── id de carrera del gestor — definido ANTES de cualquier uso ──
  const usuario = obtenerUsuario();

const idCarreraGestor = Number(
  usuario.id_carrera ||
    usuario.idCarrera ||
    usuario.carrera_id ||
    0
);

  const [libros, setLibros] = useState([]);
  const [metricas, setMetricas] = useState({
    totalLibros: 0,
    publicados: 0,
    pendientes: 0,
    rechazados: 0,
    descargasTotales: 0,
  });

  const [categorias, setCategorias] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("Todas las materias");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("Todos los estados");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [libroEditando, setLibroEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [archivo, setArchivo] = useState(null);
  const inputArchivoRef = useRef(null);

  // ── Cargar libros solo de la carrera del gestor ──
 const cargarLibros = async () => {
  try {
    setCargando(true);

    if (!idCarreraGestor) {
      throw new Error("El gestor no tiene una carrera asignada");
    }

    const data = await obtenerLibrosGestor(idCarreraGestor);

    const listaLibros = data.libros || [];

    setLibros(listaLibros);

    setMetricas({
      totalLibros: listaLibros.length,
      publicados: listaLibros.filter(
        (l) => l.estado_aprobacion === "APROBADO"
      ).length,
      pendientes: listaLibros.filter(
        (l) => l.estado_aprobacion === "PENDIENTE"
      ).length,
      rechazados: listaLibros.filter(
        (l) => l.estado_aprobacion === "RECHAZADO"
      ).length,
      descargasTotales: listaLibros.reduce(
        (acc, l) => acc + Number(l.descargas || 0),
        0
      ),
    });

    setCategorias(data.categorias || []);
    setMaterias(data.materias || []);
  } catch (error) {
    console.error("Error al cargar recursos gestor:", error);
    mostrarMensaje(error.message || "Error al cargar recursos");
  } finally {
    setCargando(false);
  }
};

  useEffect(() => {
    cargarLibros();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 2600);
  };

  // ── Filtros: solo materia y estado (sin carrera, el gestor solo ve la suya) ──
  const librosFiltrados = useMemo(() => {
    return libros.filter((libro) => {
      const textoBusqueda = busqueda.toLowerCase();
      const estadoLibro = normalizarEstado(libro.estado || libro.estado_aprobacion);

      const coincideBusqueda =
        libro.titulo?.toLowerCase().includes(textoBusqueda) ||
        libro.autor?.toLowerCase().includes(textoBusqueda) ||
        libro.categoria?.toLowerCase().includes(textoBusqueda) ||
        libro.materia?.toLowerCase().includes(textoBusqueda) ||
        libro.resumen?.toLowerCase().includes(textoBusqueda);

      const idsMateria = String(libro.ids_materia || libro.id_materia || "")
        .split(",")
        .map((i) => i.trim());

      const coincideMateria =
        materiaSeleccionada === "Todas las materias" ||
        idsMateria.includes(String(materiaSeleccionada));

      const coincideEstado =
        estadoSeleccionado === "Todos los estados" ||
        estadoLibro === estadoSeleccionado;

      return coincideBusqueda && coincideMateria && coincideEstado;
    });
  }, [libros, busqueda, materiaSeleccionada, estadoSeleccionado]);

  // ── Modal ──
  const abrirCrear = () => {
    setModoEdicion(false);
    setLibroEditando(null);
    setFormulario(formularioInicial);
    setArchivo(null);
    setModalAbierto(true);
  };

  const abrirEditar = (libro) => {
    setModoEdicion(true);
    setLibroEditando(libro);
    setFormulario({
      titulo: libro.titulo || "",
      autor: libro.autor || "",
      categoria: libro.categoria || "",
      editorial: libro.editorial || "",
      anio: libro.anio || new Date().getFullYear(),
      id_materia: libro.id_materia || "",
      formato: libro.formato || "PDF",
      idioma: libro.idioma || "Español",
      resumen: libro.resumen || "",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setLibroEditando(null);
    setFormulario(formularioInicial);
    setArchivo(null);
  };

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const abrirExploradorArchivo = () => {
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
      inputArchivoRef.current.click();
    }
  };

  const cambiarArchivo = (e) => {
    const archivoSeleccionado = e.target.files?.[0] || null;
    if (!archivoSeleccionado) return;

    const formatosPermitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!formatosPermitidos.includes(archivoSeleccionado.type)) {
      mostrarMensaje("Solo se permiten archivos PDF, DOC o DOCX");
      setArchivo(null);
      return;
    }

    if (archivoSeleccionado.size > 25 * 1024 * 1024) {
      mostrarMensaje("El archivo no debe superar 25 MB");
      setArchivo(null);
      return;
    }

    setArchivo(archivoSeleccionado);
  };

  const guardarLibro = async (e) => {
    e.preventDefault();

    if (!modoEdicion && !archivo) {
      mostrarMensaje("Debes seleccionar el archivo del recurso");
      return;
    }

    const datosEnviar = new FormData();
    datosEnviar.append("titulo", formulario.titulo);
    datosEnviar.append("autor", formulario.autor);
    datosEnviar.append("categoria", formulario.categoria);
    datosEnviar.append("editorial", formulario.editorial);
    datosEnviar.append("anio", formulario.anio);
    datosEnviar.append("id_materia", formulario.id_materia || "");
    datosEnviar.append("formato", formulario.formato);
    datosEnviar.append("idioma", formulario.idioma);
    datosEnviar.append("resumen", formulario.resumen);
    datosEnviar.append("id_carrera", idCarreraGestor);
    // El gestor siempre sube en estado PENDIENTE — el admin aprueba
    datosEnviar.append("estado_aprobacion", "PENDIENTE");

    if (archivo) datosEnviar.append("archivo", archivo);

    try {
  if (modoEdicion && libroEditando) {
    await actualizarLibroGestor(libroEditando.id, datosEnviar);
    mostrarMensaje("Recurso actualizado correctamente");
  } else {
    await crearLibroGestor(datosEnviar);
    mostrarMensaje("Recurso registrado correctamente");
  }
  cerrarModal();
  await cargarLibros();
} catch (error) {
  console.error(error);
  mostrarMensaje("No se pudo guardar el recurso");
}
  };

  return (
    <section className="gestion-libros">
      {/* ── HEADER ── */}
      <div className="gestion-libros__header">
        <div>
          <p className="gestion-libros__eyebrow">Recursos académicos</p>
          <h1 className="gestion-libros__title">Gestión de Recursos</h1>
          <p className="gestion-libros__subtitle">
            Administra y organiza los recursos digitales de tu carrera.
          </p>
        </div>
        <div className="gestion-libros__header-actions">
          <button type="button" className="btn-primary" onClick={abrirCrear}>
            Subir recurso
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS ── */}
      <div className="gestion-libros__metrics">
        <MetricCard tipo="primary"  icon="books"     valor={metricas.totalLibros}  titulo="Total de recursos"  detalle="Catálogo registrado" />
        <MetricCard tipo="success"  icon="published" valor={metricas.publicados}   titulo="Publicados"         detalle="Disponibles para consulta" />
        <MetricCard tipo="warning"  icon="pending"   valor={metricas.pendientes}   titulo="Pendientes"         detalle="Esperando aprobación" />
        <MetricCard tipo="danger"   icon="downloads" valor={Number(metricas.descargasTotales).toLocaleString("es-BO")} titulo="Descargas totales" detalle="Actividad histórica" />
      </div>

      {/* ── FILTROS: solo búsqueda + materia + estado ── */}
      <div className="gestion-libros__filters">
        <div className="search-box">
          <span className="search-box__icon"></span>
          <input
            type="text"
            placeholder="Buscar por título, autor o materia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={materiaSeleccionada}
          onChange={(e) => setMateriaSeleccionada(e.target.value)}
        >
          <option value="Todas las materias">Todas las materias</option>
          {materias.map((m) => (
            <option key={m.id_materia} value={m.id_materia}>
              {m.etiqueta || m.nombre_materia}
            </option>
          ))}
        </select>

        <select
          value={estadoSeleccionado}
          onChange={(e) => setEstadoSeleccionado(e.target.value)}
        >
          {estadosFiltro.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      {/* ── CATÁLOGO ── */}
      <div className="catalogo-card-panel">
        <div className="catalogo-card-panel__head">
          <div>
            <h2>Catálogo visual de recursos</h2>
            <p>{cargando ? "Cargando recursos..." : `${librosFiltrados.length} resultados encontrados`}</p>
          </div>
        </div>

        {librosFiltrados.length === 0 ? (
          <div className="catalogo-empty">
            {cargando ? "Cargando información..." : "No se encontraron recursos con los filtros seleccionados."}
          </div>
        ) : (
          <div className="recursos-grid">
            {librosFiltrados.map((libro) => {
              const estadoNormalizado = normalizarEstado(libro.estado || libro.estado_aprobacion);
              const archivoUrl = obtenerUrlArchivo(libro.archivo_digital);
              const portadaUrl = obtenerUrlArchivo(libro.portada);

              return (
                 <article
  className="recurso-card"
  key={`${libro.id_recurso || libro.id}-${libro.titulo}`}
>
                  <div className="recurso-cover">
                    {portadaUrl ? (
                      <img src={portadaUrl} alt={libro.titulo} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <div className="recurso-cover-fallback">
                        <span>SITEC</span>
                        <strong>{obtenerInicialesTitulo(libro.titulo)}</strong>
                        <small>{libro.formato || "PDF"}</small>
                      </div>
                    )}
                  </div>

                  <div className="recurso-card-body">
                    <div className="recurso-card-top">
                      <span className={`recurso-estado ${obtenerClaseEstadoCard(estadoNormalizado)}`}>
                        {estadoNormalizado}
                      </span>
                      <span className="recurso-year">{libro.anio || "S/A"}</span>
                    </div>

                    <h3>{libro.titulo}</h3>
                    <p>Autor: {libro.autor || "Autor no registrado"}</p>

                    <div className="recurso-meta">
                      <span>{libro.categoria || "Sin categoría"}</span>
                      <span>{libro.materia || "Sin materia"}</span>
                    </div>

                    {libro.resumen && (
                      <p className="recurso-resumen">{libro.resumen}</p>
                    )}

                    <div className="recurso-stats">
                      <span>{libro.descargas || 0} descargas</span>
                      <span>{libro.formato || "PDF"}</span>
                    </div>

                    {/* ── ACCIONES: Ver + Editar — SIN eliminar ── */}
                    <div className="recurso-actions">
                      {archivoUrl ? (
                        <button
                          type="button"
                          className="recurso-btn secondary"
                          onClick={() => window.open(`http://localhost:4000/pdf-proxy?archivo=${encodeURIComponent(libro.archivo_digital?.replace(/\\/g, "/").replace(/^\/+/, ""))}`, "_blank")}
                        >
                          Ver
                        </button>
                      ) : (
                        <button type="button" className="recurso-btn secondary" disabled>
                          Sin archivo
                        </button>
                      )}

                      <button
                        type="button"
                        className="recurso-btn primary"
                        onClick={() => abrirEditar(libro)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {modalAbierto && (
        <div className="book-modal-backdrop">
          <div className="book-modal">
            <div className="book-modal__head">
              <div>
                <p>{modoEdicion ? "Editar recurso" : "Nuevo recurso"}</p>
                <h2>{modoEdicion ? "Actualizar recurso" : "Registrar recurso"}</h2>
              </div>
              <button type="button" onClick={cerrarModal}>×</button>
            </div>

            <form className="book-form" onSubmit={guardarLibro}>
              <div className="book-form__grid">
                <label>
                  Título
                  <input name="titulo" value={formulario.titulo} onChange={cambiarFormulario} required />
                </label>

                <label>
                  Autor
                  <input name="autor" value={formulario.autor} onChange={cambiarFormulario} required />
                </label>

                <label>
                  Categoría
                  <select name="categoria" value={formulario.categoria} onChange={cambiarFormulario} required>
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Materia
                  <select name="id_materia" value={formulario.id_materia} onChange={cambiarFormulario}>
                    <option value="">Sin materia asignada</option>
                    {materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.etiqueta || m.nombre_materia}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Editorial
                  <input name="editorial" value={formulario.editorial} onChange={cambiarFormulario} />
                </label>

                <label>
                  Año
                  <input type="number" name="anio" value={formulario.anio} onChange={cambiarFormulario} min="1900" max="2100" />
                </label>

                <label>
                  Formato
                  <select name="formato" value={formulario.formato} onChange={cambiarFormulario}>
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="ENLACE">ENLACE</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </label>

                <label>
                  Idioma
                  <select name="idioma" value={formulario.idioma} onChange={cambiarFormulario}>
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>

                <label className="book-file-field">
                  Archivo digital
                  <input
                    ref={inputArchivoRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={cambiarArchivo}
                    className="book-file-input-hidden"
                  />
                  <div className="book-file-box">
                    <button type="button" className="book-file-btn" onClick={abrirExploradorArchivo}>
                      Seleccionar archivo
                    </button>
                    <span className="book-file-name">
                      {archivo ? archivo.name : "Ningún archivo seleccionado"}
                    </span>
                  </div>
                  {archivo && <small className="book-file-help">Archivo seleccionado correctamente.</small>}
                  {modoEdicion && !archivo && libroEditando?.archivo_digital && (
                    <small className="book-file-help">Se conservará el archivo actual si no seleccionas uno nuevo.</small>
                  )}
                  {!modoEdicion && !archivo && (
                    <small className="book-file-help">Formatos permitidos: PDF, DOC o DOCX. Máximo 25 MB.</small>
                  )}
                </label>
              </div>

              <label className="book-form__textarea">
                Resumen
                <textarea name="resumen" value={formulario.resumen} onChange={cambiarFormulario} rows="4"></textarea>
              </label>

              <div className="book-form__actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {modoEdicion ? "Guardar cambios" : "Registrar recurso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`book-toast ${mensaje ? "show" : ""}`}>{mensaje}</div>
    </section>
  );
}

function MetricCard({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`books-metric-card ${tipo}`}>
      <div className="books-metric-card__top">
        <div className={`books-metric-card__icon icon-${icon}`}></div>
      </div>
      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

export default GestionLibrosSection;