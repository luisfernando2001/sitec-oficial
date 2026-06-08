import { useEffect, useMemo, useState } from "react";
import "./NotificacionesSection.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearTipo(tipo) {
  const valor = String(tipo || "SISTEMA").toUpperCase();

  if (valor === "SOLICITUD") return "Solicitud";
  if (valor === "APROBACION") return "Aprobación";
  if (valor === "RECHAZO") return "Rechazo";
  if (valor === "USUARIO") return "Usuario";
  if (valor === "CATALOGO") return "Catálogo";

  return "Sistema";
}

function obtenerPrioridad(notificacion) {
  const tipo = String(notificacion?.tipo || "").toUpperCase();

  if (tipo === "SOLICITUD" || tipo === "RECHAZO") return "Alta";
  if (tipo === "APROBACION" || tipo === "USUARIO") return "Media";

  return "Baja";
}

function obtenerOrigen(notificacion) {
  const tipo = String(notificacion?.tipo || "").toUpperCase();

  if (tipo === "SOLICITUD") return "Solicitudes";
  if (tipo === "APROBACION") return "Solicitudes";
  if (tipo === "RECHAZO") return "Solicitudes";
  if (tipo === "USUARIO") return "Usuarios";
  if (tipo === "CATALOGO") return "Catálogo";

  return "Sistema";
}

function obtenerId(notificacion) {
  return notificacion?.id_notificacion || notificacion?.id || null;
}

function NotificacionesSection({ onNavigate = null }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2800);
  };

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);

      const respuesta = await fetch(`${API_URL}/admin/notificaciones`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje ||
            data.error ||
            "No se pudieron cargar las notificaciones"
        );
      }

      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      mostrarMensaje(`Error al cargar notificaciones: ${error.message}`);
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const tiposDisponibles = useMemo(() => {
    const tipos = notificaciones
      .map((notificacion) => formatearTipo(notificacion.tipo))
      .filter(Boolean);

    return [...new Set(tipos)].sort();
  }, [notificaciones]);

  const notificacionesFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda);

    return notificaciones.filter((notificacion) => {
      const tipoTexto = formatearTipo(notificacion.tipo);
      const prioridad = obtenerPrioridad(notificacion);
      const origen = obtenerOrigen(notificacion);
      const estado = Number(notificacion.leida) === 1 ? "Leídas" : "No leídas";

      const textoNotificacion = normalizarTexto(`
        ${notificacion.titulo || ""}
        ${notificacion.mensaje || ""}
        ${notificacion.usuario_origen || ""}
        ${notificacion.recurso_titulo || ""}
        ${tipoTexto}
        ${prioridad}
        ${origen}
        ${notificacion.fecha || ""}
      `);

      const coincideBusqueda =
        !busquedaNormalizada ||
        textoNotificacion.includes(busquedaNormalizada);

      const coincideTipo =
        filtroTipo === "Todas" || tipoTexto === filtroTipo;

      const coincideEstado =
        filtroEstado === "Todas" || filtroEstado === estado;

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }, [notificaciones, busqueda, filtroTipo, filtroEstado]);

  const totalNotificaciones = notificaciones.length;
  const noLeidas = notificaciones.filter((n) => Number(n.leida) === 0).length;
  const prioridadAlta = notificaciones.filter(
    (n) => obtenerPrioridad(n) === "Alta"
  ).length;
  const solicitudes = notificaciones.filter(
    (n) => String(n.tipo || "").toUpperCase() === "SOLICITUD"
  ).length;

  const marcarComoLeida = async (notificacionId) => {
    if (!notificacionId) return;

    try {
      const respuesta = await fetch(
        `${API_URL}/admin/notificaciones/${notificacionId}/leida`,
        {
          method: "PUT",
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo marcar como leída");
      }

      setNotificaciones((actuales) =>
        actuales.map((notificacion) =>
          obtenerId(notificacion) === notificacionId
            ? { ...notificacion, leida: 1 }
            : notificacion
        )
      );

      if (obtenerId(notificacionSeleccionada) === notificacionId) {
        setNotificacionSeleccionada((actual) => ({
          ...actual,
          leida: 1,
        }));
      }

      mostrarMensaje("Notificación marcada como leída");
    } catch (error) {
      console.error("Error al marcar notificación:", error);
      mostrarMensaje(`No se pudo actualizar: ${error.message}`);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      const respuesta = await fetch(
        `${API_URL}/admin/notificaciones/marcar-todas`,
        {
          method: "PUT",
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudieron marcar todas");
      }

      setNotificaciones((actuales) =>
        actuales.map((notificacion) => ({
          ...notificacion,
          leida: 1,
        }))
      );

      if (notificacionSeleccionada) {
        setNotificacionSeleccionada((actual) => ({
          ...actual,
          leida: 1,
        }));
      }

      mostrarMensaje("Todas las notificaciones fueron marcadas como leídas");
    } catch (error) {
      console.error("Error al marcar todas:", error);
      mostrarMensaje(`No se pudo actualizar: ${error.message}`);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todas");
    setFiltroEstado("Todas");
  };

  const irASolicitudes = () => {
    if (onNavigate) {
      onNavigate("Solicitudes");
      return;
    }

    mostrarMensaje("Abre el módulo Solicitudes desde el menú lateral");
  };

  const hayFiltrosActivos =
    busqueda || filtroTipo !== "Todas" || filtroEstado !== "Todas";

  return (
    <section className="notificaciones-section">
      <div className="notificaciones-header">
        <div>
          <p className="notificaciones-eyebrow">Centro de avisos</p>

          <h1>Notificaciones</h1>

          <p>
            Revisa avisos administrativos generados por solicitudes nuevas,
            recursos pendientes y actividad importante del sistema SITEC.
          </p>
        </div>

        <div className="notificaciones-header__actions">
          <button
            type="button"
            className="notificaciones-btn secondary"
            onClick={cargarNotificaciones}
          >
            Actualizar
          </button>

          <button
            type="button"
            className="notificaciones-btn primary"
            onClick={marcarTodasLeidas}
            disabled={noLeidas === 0}
          >
            Marcar todo como leído
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      <div className="notificaciones-metrics">
        <NotificationMetric
          tipo="primary"
          icon="bell"
          valor={totalNotificaciones}
          titulo="Total de avisos"
          detalle="Notificaciones registradas"
        />

        <NotificationMetric
          tipo="warning"
          icon="unread"
          valor={noLeidas}
          titulo="No leídas"
          detalle="Requieren revisión"
        />

        <NotificationMetric
          tipo="danger"
          icon="priority"
          valor={prioridadAlta}
          titulo="Prioridad alta"
          detalle="Atención administrativa"
        />

        <NotificationMetric
          tipo="success"
          icon="system"
          valor={solicitudes}
          titulo="Solicitudes"
          detalle="Avisos de recursos nuevos"
        />
      </div>

      <div className="notificaciones-tools">
        <div className="notificaciones-search">
          <span></span>

          <input
            type="text"
            placeholder="Buscar por título, mensaje, usuario, recurso o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Todas">Todos los tipos</option>

          {tiposDisponibles.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todas">Todos los estados</option>
          <option value="No leídas">No leídas</option>
          <option value="Leídas">Leídas</option>
        </select>

        {hayFiltrosActivos && (
          <button
            type="button"
            className="notificaciones-btn secondary"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="notificaciones-layout">
        <div className="notificaciones-list-card">
          <div className="notificaciones-card-head">
            <div>
              <h2>Lista de notificaciones</h2>

              <p>
                {cargando
                  ? "Cargando notificaciones..."
                  : `${notificacionesFiltradas.length} resultados encontrados`}
              </p>
            </div>

            <span className="notificaciones-note">Datos reales desde BD</span>
          </div>

          <div className="notificaciones-list">
            {notificacionesFiltradas.length === 0 ? (
              <div className="notificaciones-empty">
                {cargando
                  ? "Cargando información..."
                  : "No existen notificaciones con los filtros seleccionados."}
              </div>
            ) : (
              notificacionesFiltradas.map((notificacion) => {
                const idNotificacion = obtenerId(notificacion);
                const tipoTexto = formatearTipo(notificacion.tipo);
                const prioridad = obtenerPrioridad(notificacion);
                const origen = obtenerOrigen(notificacion);
                const leida = Number(notificacion.leida) === 1;

                return (
                  <button
                    type="button"
                    key={idNotificacion}
                    className={`notificacion-item ${
                      leida ? "read" : "unread"
                    } ${
                      obtenerId(notificacionSeleccionada) === idNotificacion
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setNotificacionSeleccionada(notificacion)}
                  >
                    <div
                      className={`notificacion-item__icon ${getTipoClass(
                        tipoTexto
                      )}`}
                    >
                      <NotificationIcon name={getIconByTipo(tipoTexto)} />
                    </div>

                    <div className="notificacion-item__content">
                      <div className="notificacion-item__top">
                        <strong>{notificacion.titulo}</strong>

                        {!leida && (
                          <span className="notificacion-dot"></span>
                        )}
                      </div>

                      <p>{notificacion.mensaje}</p>

                      <div className="notificacion-item__meta">
                        <span>{notificacion.fecha || "Sin fecha"}</span>
                        <span>{origen}</span>
                      </div>
                    </div>

                    <span
                      className={`notificacion-priority ${getPrioridadClass(
                        prioridad
                      )}`}
                    >
                      {prioridad}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <aside className="notificacion-detail">
          <div className="notificacion-detail__head">
            <h2>Detalle de aviso</h2>
            <p>Información administrativa de la notificación.</p>
          </div>

          {notificacionSeleccionada ? (
            <div className="notificacion-detail__body">
              <div
                className={`notificacion-detail__icon ${getTipoClass(
                  formatearTipo(notificacionSeleccionada.tipo)
                )}`}
              >
                <NotificationIcon
                  name={getIconByTipo(formatearTipo(notificacionSeleccionada.tipo))}
                />
              </div>

              <span
                className={`notificacion-type ${getTipoClass(
                  formatearTipo(notificacionSeleccionada.tipo)
                )}`}
              >
                {formatearTipo(notificacionSeleccionada.tipo)}
              </span>

              <h3>{notificacionSeleccionada.titulo}</h3>

              <p className="notificacion-detail__desc">
                {notificacionSeleccionada.mensaje}
              </p>

              <div className="notificacion-detail__list">
                <div>
                  <span>Origen</span>
                  <strong>{obtenerOrigen(notificacionSeleccionada)}</strong>
                </div>

                <div>
                  <span>Usuario origen</span>
                  <strong>
                    {notificacionSeleccionada.usuario_origen ||
                      "No especificado"}
                  </strong>
                </div>

                <div>
                  <span>Recurso</span>
                  <strong>
                    {notificacionSeleccionada.recurso_titulo ||
                      "No vinculado"}
                  </strong>
                </div>

                <div>
                  <span>Prioridad</span>
                  <strong>{obtenerPrioridad(notificacionSeleccionada)}</strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {notificacionSeleccionada.fecha || "Sin fecha"}
                  </strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>
                    {Number(notificacionSeleccionada.leida) === 1
                      ? "Leída"
                      : "No leída"}
                  </strong>
                </div>
              </div>

              <div className="detail-actions">
                {String(notificacionSeleccionada.tipo).toUpperCase() ===
                  "SOLICITUD" && (
                  <button
                    type="button"
                    className="notificacion-detail__button"
                    onClick={irASolicitudes}
                  >
                    Ver solicitud
                  </button>
                )}

                {Number(notificacionSeleccionada.leida) === 0 && (
                  <button
                    type="button"
                    className="notificacion-detail__button"
                    onClick={() =>
                      marcarComoLeida(obtenerId(notificacionSeleccionada))
                    }
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="notificacion-detail__empty">
              <NotificationIcon name="bell" />

              <h3>Selecciona una notificación</h3>

              <p>
                Revisa el detalle del aviso, su origen, prioridad y estado de
                lectura.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function NotificationMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`notificacion-metric ${tipo}`}>
      <div className="notificacion-metric__icon">
        <NotificationIcon name={icon} />
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function NotificationIcon({ name }) {
  const icons = {
    bell: (
      <>
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3Z" />
        <path d="M10 21h4" />
      </>
    ),
    unread: (
      <>
        <path d="M4 6h16v12H4V6Z" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    priority: (
      <>
        <path d="M12 4 3 20h18L12 4Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    system: (
      <>
        <rect x="4" y="5" width="16" height="12" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    report: (
      <>
        <path d="M5 4h14v16H5V4Z" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-7" />
      </>
    ),
    catalog: (
      <>
        <path d="M3 6h7l2 3h9v10H3V6Z" />
        <path d="M3 9h18" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className="notification-icon" aria-hidden="true">
      {icons[name] || icons.bell}
    </svg>
  );
}

function getTipoClass(tipo) {
  if (tipo === "Usuario") return "usuario";
  if (tipo === "Aprobación") return "sistema";
  if (tipo === "Rechazo") return "sistema";
  if (tipo === "Sistema") return "sistema";
  if (tipo === "Catálogo") return "catalogo";
  return "solicitud";
}

function getIconByTipo(tipo) {
  if (tipo === "Usuario") return "user";
  if (tipo === "Aprobación") return "system";
  if (tipo === "Rechazo") return "priority";
  if (tipo === "Sistema") return "system";
  if (tipo === "Catálogo") return "catalog";
  return "bell";
}

function getPrioridadClass(prioridad) {
  if (prioridad === "Alta") return "alta";
  if (prioridad === "Media") return "media";
  return "baja";
}

export default NotificacionesSection;