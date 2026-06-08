import { useEffect, useMemo, useState } from "react";
import "./SolicitudesSection.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BACKEND_URL = "http://localhost:4000";

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  try {
    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return fecha;
    }

    return fechaObj.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

function obtenerUrlArchivo(solicitud) {
  if (!solicitud?.archivo_digital) return null;

  if (solicitud.archivo_digital.startsWith("http")) {
    return solicitud.archivo_digital;
  }

  return `${BACKEND_URL}/${solicitud.archivo_digital}`;
}

function obtenerEstadoSolicitud(solicitud) {
  return String(
    solicitud?.estado ||
      solicitud?.estado_aprobacion ||
      "PENDIENTE"
  ).toUpperCase();
}

function obtenerTipoSolicitud(solicitud) {
  if (solicitud?.tipo) {
    return solicitud.tipo;
  }

  if (solicitud?.archivo_digital) {
    return "Subida";
  }

  if (solicitud?.url_acceso) {
    return "Sugerencia";
  }

  return "Sugerencia";
}

function obtenerIdSolicitud(solicitud) {
  return (
    solicitud?.id_solicitud ||
    solicitud?.id ||
    solicitud?.idRecurso ||
    solicitud?.id_recurso ||
    null
  );
}

function SolicitudMetric({ tipo, valor, titulo, detalle }) {
  return (
    <article className={`solicitud-metric metric-${tipo}`}>
      <div>
        <span>{titulo}</span>
        <strong>{valor}</strong>
        <p>{detalle}</p>
      </div>
    </article>
  );
}
function SolicitudesSection({
  onRefresh = null,
  modo = "admin",
  idCarrera = null,
}) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("Todas");

  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [solicitudRechazo, setSolicitudRechazo] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  };

const cargarSolicitudes = async () => {
  try {
    setCargando(true);

    const urlSolicitudes =
      modo === "gestor" && idCarrera
        ? `${API_URL}/gestor/solicitudes/${idCarrera}`
        : `${API_URL}/admin/solicitudes`;

    const respuesta = await fetch(urlSolicitudes);
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        data.mensaje ||
          data.error ||
          "No se pudieron cargar las solicitudes"
      );
    }

    const lista = Array.isArray(data)
      ? data
      : data.solicitudes || [];

    setSolicitudes(lista);
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    mostrarMensaje(`Error al cargar solicitudes: ${error.message}`);
    setSolicitudes([]);
  } finally {
    setCargando(false);
  }
};

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const metricas = useMemo(() => {
    const pendientes = solicitudes.filter(
      (s) => obtenerEstadoSolicitud(s) === "PENDIENTE"
    ).length;

    const aprobadas = solicitudes.filter(
      (s) => obtenerEstadoSolicitud(s) === "APROBADO"
    ).length;

    const rechazadas = solicitudes.filter(
      (s) => obtenerEstadoSolicitud(s) === "RECHAZADO"
    ).length;

    return {
      total: solicitudes.length,
      pendientes,
      aprobadas,
      rechazadas,
    };
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda);

    return solicitudes.filter((solicitud) => {
      const estadoSolicitud = obtenerEstadoSolicitud(solicitud);
      const tipoSolicitud = obtenerTipoSolicitud(solicitud);

      const textoSolicitud = normalizarTexto(`
        ${solicitud.id_solicitud || ""}
        ${solicitud.id_recurso || ""}
        ${solicitud.titulo || ""}
        ${solicitud.solicitante || ""}
        ${solicitud.correo_solicitante || ""}
        ${solicitud.area || ""}
        ${solicitud.nombre_categoria || ""}
        ${tipoSolicitud || ""}
        ${solicitud.autor || ""}
        ${solicitud.formato || ""}
        ${solicitud.observacion || ""}
        ${solicitud.resumen || ""}
        ${solicitud.fecha_formateada || ""}
        ${solicitud.fecha || ""}
        ${solicitud.fecha_registro || ""}
        ${estadoSolicitud || ""}
        ${solicitud.motivo_rechazo || ""}
        ${solicitud.observacion_aprobacion || ""}
      `);

      const coincideBusqueda =
        !busquedaNormalizada ||
        textoSolicitud.includes(busquedaNormalizada);

      const coincideEstado =
        filtroEstado === "Todas" ||
        estadoSolicitud === filtroEstado;

      const coincideTipo =
        filtroTipo === "Todas" ||
        normalizarTexto(tipoSolicitud) === normalizarTexto(filtroTipo);

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [busqueda, filtroEstado, filtroTipo, solicitudes]);

  const aprobar = async (solicitud) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas aprobar "${solicitud.titulo}"?`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      const idSolicitud = obtenerIdSolicitud(solicitud);

      if (!idSolicitud) {
        throw new Error("No se encontró el ID de la solicitud o recurso");
      }

      const baseSolicitudes =
  modo === "gestor"
    ? `${API_URL}/gestor/solicitudes`
    : `${API_URL}/admin/solicitudes`;

const usuarioPanel = JSON.parse(localStorage.getItem("usuario") || "{}");

const respuesta = await fetch(
  `${baseSolicitudes}/${idSolicitud}/aprobar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  observacion:
    modo === "gestor"
      ? "Aprobado desde el panel gestor"
      : "Aprobado desde el panel administrativo",
  id_admin_aprobacion:
    usuarioPanel.id_usuario || usuarioPanel.id || null,
  id_carrera: idCarrera,
}),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo aprobar la solicitud");
      }

      mostrarMensaje(`Solicitud aprobada: ${solicitud.titulo}`);
      setSolicitudSeleccionada(null);

      await cargarSolicitudes();

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      mostrarMensaje(`No se pudo aprobar la solicitud: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

const rechazar = (solicitud) => {
  setSolicitudRechazo(solicitud);
  setMotivoRechazo("");
  setModalRechazoAbierto(true);
};

const cerrarModalRechazo = () => {
  setModalRechazoAbierto(false);
  setSolicitudRechazo(null);
  setMotivoRechazo("");
};

const confirmarRechazo = async () => {
  if (!solicitudRechazo) return;

  if (!motivoRechazo.trim()) {
    mostrarMensaje("Debes escribir el motivo del rechazo");
    return;
  }

  try {
    setProcesando(true);

    const idSolicitud =
      solicitudRechazo.id_recurso ||
      solicitudRechazo.id_solicitud ||
      solicitudRechazo.id;

    if (!idSolicitud) {
      throw new Error("No se encontró el ID de la solicitud");
    }

    const baseSolicitudes =
  modo === "gestor"
    ? `${API_URL}/gestor/solicitudes`
    : `${API_URL}/admin/solicitudes`;

const usuarioPanel = JSON.parse(localStorage.getItem("usuario") || "{}");

const respuesta = await fetch(
  `${baseSolicitudes}/${idSolicitud}/rechazar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  observacion: motivoRechazo.trim(),
  id_admin_aprobacion:
    usuarioPanel.id_usuario || usuarioPanel.id || null,
  id_carrera: idCarrera,
}),
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "No se pudo rechazar la solicitud");
    }

    mostrarMensaje("Solicitud rechazada correctamente");

    cerrarModalRechazo();
    setSolicitudSeleccionada(null);

    await cargarSolicitudes();
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    mostrarMensaje(error.message || "No se pudo rechazar la solicitud");
  } finally {
    setProcesando(false);
  }
};


  const abrirPDF = (solicitud) => {
    const url = obtenerUrlArchivo(solicitud);

    if (!url) {
      alert("Esta solicitud no tiene archivo adjunto.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const abrirLink = (solicitud) => {
    if (!solicitud.url_acceso) {
      alert("Esta solicitud no tiene enlace registrado.");
      return;
    }

    window.open(solicitud.url_acceso, "_blank", "noopener,noreferrer");
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("Todas");
    setFiltroTipo("Todas");
  };

  return (
    <section className="solicitudes-section">
      <div className="solicitudes-header">
        <div>
          <p className="solicitudes-eyebrow">Revisión administrativa</p>

          <h1>Solicitudes de Recursos</h1>

          <p>
            Administra las sugerencias y subidas de recursos antes de publicarlas
            en la biblioteca digital.
          </p>
        </div>

        <div className="solicitudes-header__status">
          <span></span>
          Datos reales desde BD
        </div>
      </div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      <div className="solicitudes-metrics">
        <SolicitudMetric
          tipo="primary"
          valor={metricas.total}
          titulo="Total"
          detalle="Solicitudes registradas"
        />

        <SolicitudMetric
          tipo="warning"
          valor={metricas.pendientes}
          titulo="Pendientes"
          detalle="Recursos por revisar"
        />

        <SolicitudMetric
          tipo="success"
          valor={metricas.aprobadas}
          titulo="Aprobadas"
          detalle="Publicadas en catálogo"
        />

        <SolicitudMetric
          tipo="danger"
          valor={metricas.rechazadas}
          titulo="Rechazadas"
          detalle="No publicadas"
        />
      </div>

      <div className="solicitudes-tools">
        <div className="solicitudes-search">
          <span></span>

          <input
            type="text"
            placeholder="Buscar por título, solicitante, autor, categoría, estado o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todas">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADO">Aprobadas</option>
          <option value="RECHAZADO">Rechazadas</option>
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Todas">Todos los tipos</option>
          <option value="Sugerencia">Sugerencia</option>
          <option value="Subida">Subida</option>
        </select>

        <button
          type="button"
          className="btn-view"
          onClick={cargarSolicitudes}
        >
          Actualizar
        </button>

        {(busqueda || filtroEstado !== "Todas" || filtroTipo !== "Todas") && (
          <button
            type="button"
            className="btn-view"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="solicitudes-layout">
        <div className="solicitudes-table-card">
          <div className="solicitudes-card-head">
            <div>
              <h2>Lista de solicitudes</h2>

              <p>
                {cargando
                  ? "Cargando solicitudes..."
                  : `${solicitudesFiltradas.length} solicitudes encontradas`}
              </p>
            </div>
          </div>

          <div className="solicitudes-table-wrap">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>Recurso / Solicitante</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Archivo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="solicitudes-empty">
                      {cargando
                        ? "Cargando información..."
                        : "No existen solicitudes con los filtros seleccionados."}
                    </td>
                  </tr>
                ) : (
                  solicitudesFiltradas.map((solicitud, index) => {
                    const estado = obtenerEstadoSolicitud(solicitud);
                    const tienePDF = Boolean(solicitud.archivo_digital);
                    const tieneLink = Boolean(solicitud.url_acceso);
const idFila = obtenerIdSolicitud(solicitud) || `solicitud-${index}`;

return (
  <tr key={`${idFila}-${index}`}>
                        <td>
                          <div className="solicitud-main">
                            <strong>{solicitud.titulo || "Sin título"}</strong>
                            <span>
                              Solicitante:{" "}
                              {solicitud.solicitante || "Usuario no definido"}
                            </span>
                          </div>
                        </td>

                        <td>
                          {solicitud.area ||
                            solicitud.nombre_categoria ||
                            "Sin categoría"}
                        </td>

                        <td>
                          <span
                            className={`solicitud-badge ${
                              estado === "APROBADO"
                                ? "badge-subida"
                                : estado === "RECHAZADO"
                                  ? "badge-rechazo"
                                  : "badge-sugerencia"
                            }`}
                          >
                            {estado || "PENDIENTE"}
                          </span>
                        </td>

                        <td>
                          {tienePDF ? (
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() => abrirPDF(solicitud)}
                            >
                              Ver archivo
                            </button>
                          ) : tieneLink ? (
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() => abrirLink(solicitud)}
                            >
                              Abrir enlace
                            </button>
                          ) : (
                            <span>Sin archivo</span>
                          )}
                        </td>

                        <td>
                          {solicitud.fecha_formateada ||
                            solicitud.fecha ||
                            formatearFecha(solicitud.fecha_registro)}
                        </td>

                        <td>
                          <div className="solicitudes-actions">
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() =>
                                setSolicitudSeleccionada(solicitud)
                              }
                            >
                              Ver
                            </button>

                            {estado === "PENDIENTE" && (
                              <>
                                <button
                                  type="button"
                                  className="btn-approve"
                                  disabled={procesando}
                                  onClick={() => aprobar(solicitud)}
                                >
                                  Aprobar
                                </button>

                                <button
                                  type="button"
                                  className="btn-reject"
                                  disabled={procesando}
                                  onClick={() => rechazar(solicitud)}
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="solicitud-detail">
          <div className="solicitud-detail__head">
            <h2>Detalle de revisión</h2>
            <p>Información resumida para validar el recurso.</p>
          </div>

          {solicitudSeleccionada ? (
            <div className="solicitud-detail__body">
              <span className="detail-type">
                {obtenerEstadoSolicitud(solicitudSeleccionada)}
              </span>

              <h3>{solicitudSeleccionada.titulo || "Sin título"}</h3>

              <div className="detail-list">
                <div>
                  <span>Solicitante</span>
                  <strong>
                    {solicitudSeleccionada.solicitante ||
                      "Usuario no definido"}
                  </strong>
                </div>

                <div>
                  <span>Correo</span>
                  <strong>
                    {solicitudSeleccionada.correo_solicitante ||
                      "No registrado"}
                  </strong>
                </div>

                <div>
                  <span>Área / categoría</span>
                  <strong>
                    {solicitudSeleccionada.area ||
                      solicitudSeleccionada.nombre_categoria ||
                      "Sin categoría"}
                  </strong>
                </div>

                <div>
                  <span>Autor</span>
                  <strong>
                    {solicitudSeleccionada.autor || "Autor no registrado"}
                  </strong>
                </div>

                <div>
                  <span>Tipo</span>
                  <strong>
                    {obtenerTipoSolicitud(solicitudSeleccionada)}
                  </strong>
                </div>

                <div>
                  <span>Formato</span>
                  <strong>
                    {solicitudSeleccionada.formato || "No definido"}
                  </strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {solicitudSeleccionada.fecha_formateada ||
                      solicitudSeleccionada.fecha ||
                      formatearFecha(solicitudSeleccionada.fecha_registro)}
                  </strong>
                </div>
              </div>
              
                      <p>
  {solicitudSeleccionada.observacion ||
    solicitudSeleccionada.resumen ||
    "Sin observación registrada."}
</p>

{obtenerEstadoSolicitud(solicitudSeleccionada) === "RECHAZADO" &&
  (
    solicitudSeleccionada.motivo_rechazo ||
    solicitudSeleccionada.observacion_aprobacion
  ) && (
    <div className="solicitudes-motivo-rechazo">
      <span>Motivo del rechazo</span>

      <p>
        {solicitudSeleccionada.motivo_rechazo ||
          solicitudSeleccionada.observacion_aprobacion}
      </p>

      {(solicitudSeleccionada.fecha_revision ||
        solicitudSeleccionada.fecha_aprobacion) && (
        <small>
          Revisado el{" "}
          {solicitudSeleccionada.fecha_revision ||
            formatearFecha(solicitudSeleccionada.fecha_aprobacion)}
        </small>
      )}
    </div>
  )}

              
              <div className="detail-actions">
                {solicitudSeleccionada.archivo_digital && (
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => abrirPDF(solicitudSeleccionada)}
                  >
                    Ver archivo
                  </button>
                )}

                {!solicitudSeleccionada.archivo_digital &&
                  solicitudSeleccionada.url_acceso && (
                    <button
                      type="button"
                      className="btn-view"
                      onClick={() => abrirLink(solicitudSeleccionada)}
                    >
                      Abrir enlace
                    </button>
                  )}

                {obtenerEstadoSolicitud(solicitudSeleccionada) ===
                  "PENDIENTE" && (
                  <>
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={procesando}
                      onClick={() => aprobar(solicitudSeleccionada)}
                    >
                      Aprobar recurso
                    </button>

                    <button
                      type="button"
                      className="btn-reject"
                      disabled={procesando}
                      onClick={() => rechazar(solicitudSeleccionada)}
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="solicitud-detail__empty">
              <span></span>
              <p>
                Selecciona una solicitud para revisar el detalle del recurso.
              </p>
            </div>
          )}
        </aside>
      </div>
      {modalRechazoAbierto && solicitudRechazo && (
  <div className="solicitudes-modal-backdrop">
    <div className="solicitudes-rechazo-modal">
      <div className="solicitudes-rechazo-modal__head">
        <div>
          <p>Revisión administrativa</p>
          <h2>Rechazar solicitud</h2>
        </div>

        <button
          type="button"
          className="solicitudes-rechazo-modal__close"
          onClick={cerrarModalRechazo}
        >
          ×
        </button>
      </div>

      <div className="solicitudes-rechazo-modal__body">
        <div className="solicitudes-rechazo-alert">
          <strong>{solicitudRechazo.titulo}</strong>
          <span>
            Esta solicitud será marcada como rechazada y el motivo será visible
            para el usuario que envió el recurso.
          </span>
        </div>

        <label className="solicitudes-rechazo-field">
          Motivo del rechazo
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Ejemplo: El recurso no corresponde a la materia seleccionada o no cumple con los criterios académicos establecidos."
            rows="5"
            autoFocus
          />
        </label>

        <p className="solicitudes-rechazo-help">
          Escribe una explicación clara para que el docente o estudiante pueda
          corregir su solicitud.
        </p>
      </div>

      <div className="solicitudes-rechazo-modal__actions">
        <button
          type="button"
          className="solicitudes-btn secondary"
          onClick={cerrarModalRechazo}
          disabled={procesando}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="solicitudes-btn danger"
          onClick={confirmarRechazo}
          disabled={procesando}
        >
          {procesando ? "Rechazando..." : "Confirmar rechazo"}
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}

export default SolicitudesSection;