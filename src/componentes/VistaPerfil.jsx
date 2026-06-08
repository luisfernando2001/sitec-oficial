import { useEffect, useRef, useState } from "react";
import "../styles/vistas.css";

import sinPerfil from "../assets/sin_perfil.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
  if (!fecha) return "No registrado";

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

export default function VistaPerfil({
  estadisticas = {},
  setTabActivo = () => {},
}) {
  const inputFotoRef = useRef(null);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const usuarioSesion = obtenerUsuarioGuardado();

  const idUsuario =
    usuarioSesion?.id_usuario ||
    usuarioSesion?.id ||
    null;

  const fotoKey = idUsuario
    ? `sitec_foto_perfil_${idUsuario}`
    : "sitec_foto_perfil";

  const [fotoPerfil, setFotoPerfil] = useState(
    localStorage.getItem(fotoKey) || sinPerfil
  );

  const cargarPerfil = async () => {
    if (!idUsuario) {
      setErrorCarga("No se encontró el usuario en sesión.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorCarga("");

      const respuesta = await fetch(`${API_URL}/perfil/${idUsuario}`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje ||
          data.error ||
          "No se pudo cargar el perfil"
        );
      }

      setPerfil(data.perfil || data.usuario || data);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      setErrorCarga("No se pudo cargar el perfil desde la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const registrarActividadPerfil = () => {
    if (!idUsuario) return;

    fetch(`${API_URL}/actividad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_usuario: idUsuario,
        tipo: "PERFIL",
        titulo: "Actualización de perfil",
        detalle: "Cambiaste tu foto de perfil.",
      }),
    }).catch((error) => {
      console.error("Error al registrar actividad:", error);
    });
  };

  const cambiarFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imagenBase64 = reader.result;

      setFotoPerfil(imagenBase64);
      localStorage.setItem(fotoKey, imagenBase64);

      registrarActividadPerfil();
    };

    reader.readAsDataURL(archivo);
  };

  const quitarFoto = () => {
    setFotoPerfil(sinPerfil);
    localStorage.removeItem(fotoKey);

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }

    if (idUsuario) {
      fetch(`${API_URL}/actividad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: idUsuario,
          tipo: "PERFIL",
          titulo: "Actualización de perfil",
          detalle: "Quitaste tu foto de perfil.",
        }),
      }).catch((error) => {
        console.error("Error al registrar actividad:", error);
      });
    }
  };

  if (loading) {
    return (
      <div className="tab-view active">
        <div className="panel">
          <div className="panel-body perfil-loading">
            <h2 className="page-title">Mi perfil</h2>
            <p className="page-sub">
              Estamos obteniendo la información desde la base de datos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="tab-view active">
        <div className="panel">
          <div className="panel-body perfil-loading">
            <h2 className="page-title">Mi perfil</h2>
            <p className="page-sub">{errorCarga}</p>

            <button
              type="button"
              className="chip"
              onClick={cargarPerfil}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nombreCompleto = `${perfil?.nombre || ""} ${
    perfil?.apellido || ""
  }`.trim();

  return (
    <div className="tab-view active">
      <div className="perfil-title-block">
        <h2 className="page-title">Mi Perfil</h2>
        <p className="page-sub">
          Información personal registrada en SITEC
        </p>
      </div>

      <div className="perfil-card-modern">
        <div className="perfil-cover"></div>

        <div className="perfil-main">
          <div className="perfil-left">
            <div className="perfil-photo-wrap">
              <img
                src={fotoPerfil}
                alt="Foto de perfil"
                className="perfil-photo"
              />

              <button
                type="button"
                className="perfil-photo-edit"
                onClick={() => inputFotoRef.current?.click()}
                title="Cambiar foto"
              >
                ✎
              </button>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                onChange={cambiarFoto}
                style={{ display: "none" }}
              />
            </div>

            <div className="perfil-photo-actions">
              <button
                type="button"
                className="perfil-btn-primary"
                onClick={() => inputFotoRef.current?.click()}
              >
                Cambiar foto
              </button>

              <button
                type="button"
                className="perfil-btn-light"
                onClick={quitarFoto}
              >
                Quitar
              </button>
            </div>
          </div>

          <div className="perfil-right">
            <div className="perfil-user-head">
              <div>
                <h2>{nombreCompleto || "Usuario"}</h2>

                <p>
                  {perfil?.nombre_rol ||
                    usuarioSesion?.rol ||
                    "Rol no registrado"}
                </p>
              </div>

              <span className="perfil-status">
                {Number(perfil?.estado) === 1 ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="perfil-info-grid">
              <div className="perfil-info-item">
                <span>Correo institucional</span>
                <strong>{perfil?.correo || "No registrado"}</strong>
              </div>

              <div className="perfil-info-item">
                <span>Carrera</span>
                <strong>
                  {perfil?.nombre_carrera ||
                    perfil?.sigla_carrera ||
                    "Facultad de Tecnología"}
                </strong>
              </div>

              <div className="perfil-info-item">
                <span>Fecha de registro</span>
                <strong>{formatearFecha(perfil?.fecha_registro)}</strong>
              </div>

              <div className="perfil-info-item">
                <span>Último acceso</span>
                <strong>{formatearFecha(perfil?.ultimo_acceso)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row perfil-stats-row">
        <div className="stat-card">
          <div className="stat-icon si-vino">📚</div>
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
            <div className="stat-lbl">Favoritos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-rojo">📋</div>
          <div>
            <div className="stat-val">{estadisticas.solicitudes || 0}</div>
            <div className="stat-lbl">Solicitudes</div>
          </div>
        </div>
      </div>

      <div className="perfil-actions-bottom">
        <button
          type="button"
          className="perfil-btn-primary"
          onClick={() => setTabActivo("configuracion")}
        >
          Ir a configuración
        </button>
      </div>
    </div>
  );
}