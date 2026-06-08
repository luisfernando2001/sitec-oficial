import { useState, useEffect, useRef } from "react";

import "../styles/variables.css";
import "../styles/MisSolicitudes.css";

import BarraSuperior from "../componentes/BarraSuperior";
import BarraLateral from "../componentes/BarraLateral";
import Footer from "../componentes/Footer";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function obtenerUsuarioActual() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch {
    return null;
  }
}

function fmtFecha(fechaStr) {
  if (!fechaStr) return "—";

  const d = new Date(fechaStr);

  if (Number.isNaN(d.getTime())) {
    return fechaStr;
  }

  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizarEstado(estado) {
  const valor = String(estado || "Pendiente").toUpperCase();

  if (valor === "APROBADO" || valor === "APROBADA") return "Aprobado";
  if (valor === "RECHAZADO" || valor === "RECHAZADA") return "Rechazado";

  return "Pendiente";
}

const STATUS_META = {
  Pendiente: { label: "Pendiente", cls: "ss-pend" },
  Aprobado: { label: "Aprobado", cls: "ss-ok" },
  Rechazado: { label: "Rechazado", cls: "ss-rech" },
};

const COVER_COLORS = ["bc-1", "bc-2", "bc-3", "bc-4", "bc-5"];
const COVER_EMOJIS = ["📘", "📗", "📙", "📕", "📒"];

function coverIdx(id) {
  return Number(id || 0) % 5;
}

export default function MisSolicitudes({
  onNuevaSolicitud = () => {
    window.location.href = "/sugerir-libro";
  },
}) {
  const [tabActivo, setTabActivo] = useState("solicitudes");
  const [rol, setRol] = useState("Estudiante");

  const usuario = obtenerUsuarioActual() || {
    nombre: "Usuario",
    carrera: "Sin carrera",
    correo: "sin-correo",
  };

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id ||
    usuario?.idUsuario ||
    1;

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState(null);

  const toastRef = useRef(null);

  useEffect(() => {
    fetchSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario]);

  async function fetchSolicitudes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/solicitudes?id_usuario=${idUsuario}`
      );

      if (!res.ok) {
        throw new Error("No se pudo obtener las solicitudes");
      }

      const data = await res.json();

      const lista = Array.isArray(data)
        ? data
        : data.solicitudes || [];

      const solicitudesNormalizadas = lista.map((solicitud) => ({
        ...solicitud,
        estado: normalizarEstado(solicitud.estado),
        motivo_rechazo:
          solicitud.motivo_rechazo ||
          solicitud.observacion_aprobacion ||
          solicitud.observacion_rechazo ||
          "",
        fecha_revision:
          solicitud.fecha_revision ||
          solicitud.fecha_aprobacion ||
          null,
      }));

      setSolicitudes(solicitudesNormalizadas);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);

      setError(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo."
      );
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });

    clearTimeout(toastRef.current);

    toastRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  async function cancelarSolicitud(sol) {
    try {
      const res = await fetch(
        `${API_BASE}/solicitudes/${sol.id_solicitud || sol.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      setSolicitudes((prev) =>
        prev.filter(
          (s) =>
            (s.id_solicitud || s.id) !==
            (sol.id_solicitud || sol.id)
        )
      );

      showToast("Solicitud cancelada correctamente", "info");
    } catch {
      showToast("Error al cancelar. Intenta de nuevo.", "error");
    }
  }

  const filtradas = solicitudes.filter((s) => {
    const estadoSolicitud = normalizarEstado(s.estado);

    const matchFiltro =
      filtro === "Todos" ||
      estadoSolicitud === filtro;

    const texto = `
      ${s.titulo || ""}
      ${s.autor || ""}
      ${s.motivo_rechazo || ""}
    `.toLowerCase();

    const matchBusqueda =
      busqueda === "" ||
      texto.includes(busqueda.toLowerCase());

    return matchFiltro && matchBusqueda;
  });

  const contadores = {
    Todos: solicitudes.length,
    Pendiente: solicitudes.filter(
      (s) => normalizarEstado(s.estado) === "Pendiente"
    ).length,
    Aprobado: solicitudes.filter(
      (s) => normalizarEstado(s.estado) === "Aprobado"
    ).length,
    Rechazado: solicitudes.filter(
      (s) => normalizarEstado(s.estado) === "Rechazado"
    ).length,
  };

  const toastIcons = {
    success: "✅",
    info: "📋",
    warn: "⚠️",
    error: "❌",
  };

  return (
    <div className="sitec-wrap">
      <BarraSuperior
        rol={rol}
        setRol={setRol}
        usuario={usuario}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onBuscar={(texto) => console.log("Buscar:", texto)}
      />

      <div className="sitec-body">
        <BarraLateral
          tabActivo={tabActivo}
          setTabActivo={setTabActivo}
        />

        <main className="sitec-content">
          <div className="ms-page">
            <div className="ms-header">
              <div>
                <div className="ms-eyebrow">
                  Mi cuenta · Panel de usuario
                </div>

                <h1 className="ms-title">
                  Mis Solicitudes
                </h1>

                <p className="ms-sub">
                  Estado de los libros que sugeriste al sistema.
                </p>
              </div>

              <button
                className="btn-nueva"
                onClick={onNuevaSolicitud}
              >
                <span>💡</span>
                Nueva Solicitud
              </button>
            </div>

            <div className="ms-stats">
              {[
                {
                  key: "Todos",
                  icon: "📋",
                  label: "Total",
                },
                {
                  key: "Pendiente",
                  icon: "⏳",
                  label: "Pendientes",
                },
                {
                  key: "Aprobado",
                  icon: "✅",
                  label: "Aprobadas",
                },
                {
                  key: "Rechazado",
                  icon: "❌",
                  label: "Rechazadas",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`stat-pill ${
                    filtro === item.key ? "active" : ""
                  }`}
                  onClick={() => setFiltro(item.key)}
                >
                  <span className="sp-icon">
                    {item.icon}
                  </span>

                  <div>
                    <div className="sp-val">
                      {contadores[item.key]}
                    </div>

                    <div className="sp-lbl">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ms-body">
              {loading && (
                <div className="ms-state">
                  <div className="spinner" />

                  <p>
                    Cargando tus solicitudes...
                  </p>
                </div>
              )}

              {!loading && error && (
                <div className="ms-state">
                  <div className="state-icon">
                    ⚠️
                  </div>

                  <p className="state-msg">
                    {error}
                  </p>

                  <button
                    className="btn-retry"
                    onClick={fetchSolicitudes}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!loading && !error && filtradas.length === 0 && (
                <div className="ms-state">
                  <div className="state-icon">
                    📭
                  </div>

                  <p className="state-msg">
                    No tienes solicitudes con el filtro seleccionado.
                  </p>
                </div>
              )}

              {!loading && !error && filtradas.length > 0 && (
                <div className="sol-list">
                  {filtradas.map((sol) => {
                    const idSolicitud =
                      sol.id_solicitud ||
                      sol.id ||
                      sol.id_recurso;

                    const ci = coverIdx(idSolicitud);
                    const estado = normalizarEstado(sol.estado);
                    const sm = STATUS_META[estado] || STATUS_META.Pendiente;

                    return (
                      <div
                        key={idSolicitud}
                        className="sol-card"
                      >
                        <div
                          className={`sol-cover ${COVER_COLORS[ci]}`}
                        >
                          {COVER_EMOJIS[ci]}
                        </div>

                        <div className="sol-info">
                          <div className="sol-titulo">
                            {sol.titulo || "Sin título"}
                          </div>

                          <div className="sol-fecha">
                            📅 {fmtFecha(sol.fecha)}
                          </div>

                          {estado === "Rechazado" &&
                            sol.motivo_rechazo && (
                              <div className="solicitud-motivo-rechazo">
                                <strong>
                                  Motivo del rechazo:
                                </strong>

                                <p>
                                  {sol.motivo_rechazo}
                                </p>

                                {sol.fecha_revision && (
                                  <small>
                                    Revisado el{" "}
                                    {fmtFecha(sol.fecha_revision)}
                                  </small>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="sol-right">
                          <span
                            className={`sol-status ${sm.cls}`}
                          >
                            {sm.label}
                          </span>

                          {estado === "Pendiente" && (
                            <button
                              className="btn-cancelar"
                              onClick={() =>
                                cancelarSolicitud(sol)
                              }
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {toast && (
              <div className="ms-toast show">
                <span>
                  {toastIcons[toast.type]}
                </span>

                <span>
                  {toast.msg}
                </span>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}