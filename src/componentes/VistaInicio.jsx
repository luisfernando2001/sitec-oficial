import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/vistas.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function formatearFechaHora(fecha) {
  if (!fecha) return "Sin fecha";

  try {
    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return fecha;
    }

    return fechaObj.toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fecha;
  }
}

function obtenerClaseEstado(estado) {
  const estadoNormalizado = String(estado || "").toUpperCase();

  if (estadoNormalizado.includes("APROBADO")) return "ss-ok";
  if (estadoNormalizado.includes("RECHAZADO")) return "ss-rech";

  return "ss-pend";
}

function obtenerTextoEstado(estado) {
  const estadoNormalizado = String(estado || "").toUpperCase();

  if (estadoNormalizado.includes("APROBADO")) return "Aprobado";
  if (estadoNormalizado.includes("RECHAZADO")) return "Rechazado";

  return "Pendiente";
}

export default function VistaInicio({
  usuario,
  setTabActivo,
  estadisticas = {},
}) {
  const navigate = useNavigate();

  const [recursosRecientes, setRecursosRecientes] = useState([]);
  const [solicitudesRecientes, setSolicitudesRecientes] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);

  const [loadingRecursos, setLoadingRecursos] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [loadingActividad, setLoadingActividad] = useState(true);

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id ||
    null;

  const nombreUsuario = usuario?.nombre
    ? usuario.nombre.split(" ")[0]
    : "Usuario";

  useEffect(() => {
    fetch(`${API_URL}/recurso/recientes`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data)
          ? data
          : data.recursos || data.libros || [];

        setRecursosRecientes(lista);
      })
      .catch((error) => {
        console.error("Error al cargar recursos recientes:", error);
        setRecursosRecientes([]);
      })
      .finally(() => {
        setLoadingRecursos(false);
      });
  }, []);

  useEffect(() => {
    if (!idUsuario) {
      setSolicitudesRecientes([]);
      setLoadingSolicitudes(false);
      return;
    }

    fetch(`${API_URL}/solicitudes/usuario/${idUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data)
          ? data
          : data.solicitudes || [];

        setSolicitudesRecientes(lista.slice(0, 3));
      })
      .catch((error) => {
        console.error("Error al cargar solicitudes recientes:", error);
        setSolicitudesRecientes([]);
      })
      .finally(() => {
        setLoadingSolicitudes(false);
      });
  }, [idUsuario]);

  useEffect(() => {
    if (!idUsuario) {
      setActividadReciente([]);
      setLoadingActividad(false);
      return;
    }

    fetch(`${API_URL}/actividad/usuario/${idUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data)
          ? data
          : data.actividades || [];

        setActividadReciente(lista);
      })
      .catch((error) => {
        console.error("Error al cargar actividad reciente:", error);
        setActividadReciente([]);
      })
      .finally(() => {
        setLoadingActividad(false);
      });
  }, [idUsuario]);

  const irACatalogo = () => {
    setTabActivo("catalogo");
  };

  const irASolicitudes = () => {
    setTabActivo("solicitudes");
  };

  const irASugerirRecurso = () => {
    navigate("/sugerir-libro");
  };

  return (
    <div className="tab-view active" id="tab-inicio">
      <div className="welcome-banner">
        <div className="wb-blob b1" />
        <div className="wb-blob b2" />

        <div className="wb-inner">
          <div className="wb-left">
            <div className="wb-eyebrow">
              ¡Bienvenido de vuelta!
            </div>

            <div className="wb-title">
              Hola, {nombreUsuario}
            </div>

            <p className="wb-sub">
              Explora el catálogo de recursos de la Facultad de Tecnología.
            </p>
          </div>

          <div className="wb-actions">
            <button
              type="button"
              className="wb-btn wb-btn-primary"
              onClick={irACatalogo}
            >
              Explorar Catálogo
            </button>

            <button
              type="button"
              className="wb-btn wb-btn-secondary"
              onClick={irASugerirRecurso}
            >
              Sugerir Recurso
            </button>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-vino">📖</div>
          <div>
            <div className="stat-val">{estadisticas.recursos || 0}</div>
            <div className="stat-lbl">Recursos disponibles</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-azul">⬇</div>
          <div>
            <div className="stat-val">{estadisticas.descargas || 0}</div>
            <div className="stat-lbl">Mis descargas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-dora">★</div>
          <div>
            <div className="stat-val">{estadisticas.favoritos || 0}</div>
            <div className="stat-lbl">Favoritos guardados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-rojo">📋</div>
          <div>
            <div className="stat-val">{estadisticas.solicitudes || 0}</div>
            <div className="stat-lbl">Solicitudes pendientes</div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-head">
            <h3>Recursos Recientes</h3>

            <button
              type="button"
              className="ph-right"
              onClick={irACatalogo}
            >
              Ver todos →
            </button>
          </div>

          <div className="panel-body">
            {loadingRecursos ? (
              <h4>Cargando recursos...</h4>
            ) : recursosRecientes.length === 0 ? (
              <h4>No hay recursos disponibles</h4>
            ) : (
              recursosRecientes.map((recurso) => (
                <div
                  className="book-item"
                  key={recurso.id_recurso}
                >
                  <div className="book-cover">📘</div>

                  <div className="book-info">
                    <div className="book-title">
                      {recurso.titulo || "Recurso sin título"}
                    </div>

                    <div className="book-meta">
                      {recurso.autor ||
                        `${recurso.nombre_autor || ""} ${recurso.apellido_autor || ""}`.trim() ||
                        "Autor no registrado"}

                      {" · "}

                      {recurso.nombre_categoria ||
                        recurso.categoria ||
                        "Sin categoría"}

                      {" · "}

                      {recurso.anio_publicacion || "Sin año"}
                    </div>
                  </div>

                  <span className="book-tag">
                    {recurso.formato || "PDF"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div className="panel">
            <div className="panel-head">
              <h3>Actividad Reciente</h3>
            </div>

            <div className="panel-body">
              {loadingActividad ? (
                <div className="act-item">Cargando actividad...</div>
              ) : actividadReciente.length === 0 ? (
                <div className="act-item">
                  Todavía no tienes actividad reciente registrada.
                </div>
              ) : (
                actividadReciente.map((actividad) => (
                  <div
                    className="act-item"
                    key={actividad.id_actividad}
                    style={{
                      borderBottom: "1px solid rgba(35,16,109,0.12)",
                      padding: "10px 0",
                    }}
                  >
                    <strong>{actividad.titulo}</strong>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 4,
                      }}
                    >
                      {actividad.detalle || actividad.tipo}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 4,
                      }}
                    >
                      {formatearFechaHora(actividad.fecha)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Mis Solicitudes</h3>

              <button
                type="button"
                className="ph-right"
                onClick={irASolicitudes}
              >
                Ver todas →
              </button>
            </div>

            <div className="panel-body">
              {loadingSolicitudes ? (
                <div className="act-item">Cargando solicitudes...</div>
              ) : solicitudesRecientes.length === 0 ? (
                <div className="act-item">
                  No tienes solicitudes recientes.
                </div>
              ) : (
                solicitudesRecientes.map((solicitud) => {
                  const estado =
                    solicitud.estado ||
                    solicitud.estado_aprobacion ||
                    "PENDIENTE";

                  return (
                    <div
                      className="sol-item"
                      key={solicitud.id_solicitud}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid rgba(35,16,109,0.12)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {solicitud.titulo || "Recurso sin título"}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            marginTop: 4,
                          }}
                        >
                          {formatearFechaHora(solicitud.fecha)}
                        </div>
                      </div>

                      <span
                        className={`sol-status ${obtenerClaseEstado(estado)}`}
                      >
                        {obtenerTextoEstado(estado)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}