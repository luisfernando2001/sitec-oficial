import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/vistas.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch (error) {
    console.error("Error al leer usuario:", error);
    return null;
  }
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

function obtenerClaseEstado(estado) {
  const estadoNormalizado = String(estado || "").toUpperCase();

  if (estadoNormalizado.includes("APROBADO")) {
    return "ss-ok";
  }

  if (estadoNormalizado.includes("RECHAZADO")) {
    return "ss-rech";
  }

  return "ss-pend";
}

function obtenerTextoEstado(estado) {
  const estadoNormalizado = String(estado || "").toUpperCase();

  if (estadoNormalizado.includes("APROBADO")) {
    return "✓ Aprobado";
  }

  if (estadoNormalizado.includes("RECHAZADO")) {
    return "✗ Rechazado";
  }

  return "⏳ Pendiente";
}

export default function VistaSolicitudes() {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const usuario = obtenerUsuarioGuardado();

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id ||
    null;

  const cargarSolicitudes = async () => {
    if (!idUsuario) {
      setErrorCarga("No se encontró el usuario en sesión.");
      setSolicitudes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorCarga("");

      const respuesta = await fetch(
        `${API_URL}/solicitudes/usuario/${idUsuario}`
      );

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
      setErrorCarga("No se pudieron cargar las solicitudes.");
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const irANuevaSolicitud = () => {
    navigate("/sugerir-libro");
  };

  return (
    <div className="tab-view active" id="tab-solicitudes">
      <div style={{ marginBottom: 20 }}>
        <h2 className="page-title">
          Mis Solicitudes
        </h2>

        <p className="page-sub">
          Estado de los recursos que sugeriste al sistema
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>
            {solicitudes.length} solicitudes enviadas
          </h3>

          <button
            type="button"
            className="ph-right"
            onClick={irANuevaSolicitud}
          >
            + Nueva Solicitud
          </button>
        </div>

        <div className="panel-body">
          {loading ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <h3>Cargando solicitudes...</h3>
            </div>
          ) : errorCarga ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <h3>{errorCarga}</h3>

              <button
                type="button"
                className="chip"
                onClick={cargarSolicitudes}
              >
                Reintentar
              </button>
            </div>
          ) : solicitudes.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <h3>No tienes solicitudes registradas</h3>

              <p style={{ color: "var(--muted)" }}>
                Puedes sugerir un recurso para que sea revisado por el administrador.
              </p>
            </div>
          ) : (
            solicitudes.map((s) => {
              const autor =
                `${s.nombre_autor || ""} ${s.apellido_autor || ""}`.trim() ||
                "Autor no registrado";

              const estado =
                s.estado ||
                s.estado_aprobacion ||
                "PENDIENTE";

              return (
                <div
                  className="sol-item"
                  key={s.id_solicitud}
                  style={{ padding: "14px 0" }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 3,
                      }}
                    >
                      {s.titulo || "Recurso sin título"}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                      }}
                    >
                      {autor} · Enviado: {formatearFecha(s.fecha)}

                      {s.nombre_categoria && (
                        <>
                          {" "}
                          · Categoría: {s.nombre_categoria}
                        </>
                      )}

                      {s.observacion && (
                        <>
                          {" "}
                          · Motivo: {s.observacion}
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`sol-status ${obtenerClaseEstado(estado)}`}>
                    {obtenerTextoEstado(estado)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}