import { useEffect, useState } from "react";
import "./PerfilAdminSection.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || API_URL.replace("/api", "");

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch {
    return null;
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "No registrado";

  try {
    return new Date(fecha).toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "No registrado";
  }
}

function obtenerUrlFoto(foto) {
  if (!foto) return "";

  if (foto.startsWith("http")) {
    return foto;
  }

  return `${BACKEND_URL}/${foto}`;
}

export default function PerfilAdminSection() {
  const usuarioSesion = obtenerUsuarioGuardado();

  const idUsuario =
    usuarioSesion?.id_usuario ||
    usuarioSesion?.id ||
    null;

  const [perfil, setPerfil] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
  });

  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2800);
  };

  const actualizarStorageUsuario = (perfilActualizado) => {
    const usuarioGuardado = obtenerUsuarioGuardado() || {};

    const usuarioActualizado = {
      ...usuarioGuardado,
      id_usuario: perfilActualizado.id_usuario || idUsuario,
      id: perfilActualizado.id_usuario || idUsuario,
      nombre: perfilActualizado.nombre || "",
      apellido: perfilActualizado.apellido || "",
      correo: perfilActualizado.correo || "",
      foto_perfil: perfilActualizado.foto_perfil || null,
      nombre_rol:
        perfilActualizado.nombre_rol ||
        usuarioGuardado.nombre_rol ||
        usuarioGuardado.rol ||
        "Administrador",
      rol:
        perfilActualizado.nombre_rol ||
        usuarioGuardado.rol ||
        usuarioGuardado.nombre_rol ||
        "Administrador",
      nombre_carrera:
        perfilActualizado.nombre_carrera ||
        usuarioGuardado.nombre_carrera ||
        "Facultad de Tecnología",
    };

    localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

    window.dispatchEvent(
      new CustomEvent("usuarioActualizado", {
        detail: usuarioActualizado,
      })
    );
  };

  const cargarPerfil = async () => {
    try {
      setLoading(true);

      if (!idUsuario) {
        setPerfil(null);
        mostrarMensaje("No se encontró una sesión activa de administrador");
        return;
      }

      const respuesta = await fetch(`${API_URL}/admin/perfil/${idUsuario}`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo cargar el perfil");
      }

      const perfilData = data.perfil;

      setPerfil(perfilData);

      setForm({
        nombre: perfilData.nombre || "",
        apellido: perfilData.apellido || "",
        correo: perfilData.correo || "",
      });

      setPreviewFoto(obtenerUrlFoto(perfilData.foto_perfil));
      setArchivoFoto(null);

      actualizarStorageUsuario(perfilData);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      mostrarMensaje("No se pudo cargar el perfil del administrador");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const seleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarMensaje("Solo se permiten imágenes JPG, PNG o WEBP");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      mostrarMensaje("La imagen no debe superar los 5 MB");
      return;
    }

    setArchivoFoto(archivo);
    setPreviewFoto(URL.createObjectURL(archivo));
  };

  const guardarPerfil = async () => {
    if (!idUsuario) {
      mostrarMensaje("No se encontró el usuario administrador");
      return;
    }

    if (!form.nombre.trim()) {
      mostrarMensaje("El nombre es obligatorio");
      return;
    }

    if (!form.apellido.trim()) {
      mostrarMensaje("El apellido es obligatorio");
      return;
    }

    if (!form.correo.trim()) {
      mostrarMensaje("El correo es obligatorio");
      return;
    }

    if (!form.correo.trim().toLowerCase().endsWith("@fatec.edu.bo")) {
      mostrarMensaje("El correo debe ser institucional @fatec.edu.bo");
      return;
    }

    try {
      setGuardando(true);

      const formData = new FormData();

      formData.append("nombre", form.nombre.trim());
      formData.append("apellido", form.apellido.trim());
      formData.append("correo", form.correo.trim().toLowerCase());

      if (archivoFoto) {
        formData.append("foto_perfil", archivoFoto);
      }

      const respuesta = await fetch(`${API_URL}/admin/perfil/${idUsuario}`, {
        method: "PUT",
        body: formData,
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo actualizar el perfil");
      }

      const respuestaPerfil = await fetch(`${API_URL}/admin/perfil/${idUsuario}`);
      const dataPerfil = await respuestaPerfil.json();

      if (!respuestaPerfil.ok) {
        throw new Error(
          dataPerfil.mensaje || "El perfil se guardó, pero no se pudo recargar"
        );
      }

      const perfilActualizado = dataPerfil.perfil;

      setPerfil(perfilActualizado);

      setForm({
        nombre: perfilActualizado.nombre || "",
        apellido: perfilActualizado.apellido || "",
        correo: perfilActualizado.correo || "",
      });

      const urlFoto = obtenerUrlFoto(perfilActualizado.foto_perfil);

      setPreviewFoto(
        urlFoto ? `${urlFoto}?v=${Date.now()}` : ""
      );

      setArchivoFoto(null);

      actualizarStorageUsuario(perfilActualizado);

      mostrarMensaje("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      mostrarMensaje(error.message || "No se pudo actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  };

  const nombreCompleto = perfil
    ? `${perfil.nombre || ""} ${perfil.apellido || ""}`.trim()
    : "Administrador SITEC";

  const inicial = nombreCompleto.charAt(0).toUpperCase() || "A";

  return (
    <section className="perfil-admin-section">
      <div className="perfil-admin-header">
        <div>
          <p className="perfil-admin-eyebrow">
            Cuenta administrativa
          </p>

          <h1>
            Perfil del Administrador
          </h1>

          <p>
            Consulta y actualiza los datos principales del usuario administrador
            que accede al panel SITEC.
          </p>
        </div>

        <button
          type="button"
          className="perfil-admin-btn primary"
          onClick={guardarPerfil}
          disabled={loading || guardando}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Cargando perfil del administrador...
        </div>
      ) : (
        <div className="perfil-admin-layout">
          <aside className="perfil-admin-card">
            <div className="perfil-admin-avatar-wrap">
              {previewFoto ? (
                <img
                  src={previewFoto}
                  alt="Foto de perfil"
                  className="perfil-admin-avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="perfil-admin-avatar">
                  {inicial}
                </div>
              )}
            </div>

            <h2>
              {nombreCompleto}
            </h2>

            <p>
              {perfil?.correo}
            </p>

            <span className="perfil-admin-role">
              {perfil?.nombre_rol || "Administrador"}
            </span>

            <div className="perfil-admin-status">
              <div>
                <span>Estado</span>

                <strong>
                  {Number(perfil?.estado) === 1 ? "Activo" : "Inactivo"}
                </strong>
              </div>

              <div>
                <span>Carrera</span>

                <strong>
                  {perfil?.nombre_carrera || "Facultad de Tecnología"}
                </strong>
              </div>
            </div>
          </aside>

          <div className="perfil-admin-panel">
            <div className="perfil-admin-panel-head">
              <h2>
                Datos personales
              </h2>

              <p>
                Estos datos se obtienen y actualizan desde la tabla usuario.
              </p>
            </div>

            <div className="perfil-admin-form">
              <label>
                <span>Nombre</span>

                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    actualizarCampo("nombre", e.target.value)
                  }
                />
              </label>

              <label>
                <span>Apellido</span>

                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) =>
                    actualizarCampo("apellido", e.target.value)
                  }
                />
              </label>

              <label className="full">
                <span>Correo institucional</span>

                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) =>
                    actualizarCampo("correo", e.target.value)
                  }
                />
              </label>

              <div className="perfil-admin-upload full">
                <span>Foto de perfil</span>

                <div className="perfil-admin-upload-box">
                  <div className="perfil-admin-upload-preview">
                    {previewFoto ? (
                      <img
                        src={previewFoto}
                        alt="Vista previa"
                      />
                    ) : (
                      <span>{inicial}</span>
                    )}
                  </div>

                  <div>
                    <label className="perfil-admin-upload-btn">
                      Seleccionar imagen

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={seleccionarFoto}
                        hidden
                      />
                    </label>

                    <p>
                      Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="perfil-admin-info-grid">
              <div>
                <span>Fecha de registro</span>

                <strong>
                  {formatearFecha(perfil?.fecha_registro)}
                </strong>
              </div>

              <div>
                <span>Último acceso</span>

                <strong>
                  {formatearFecha(perfil?.ultimo_acceso)}
                </strong>
              </div>

              <div>
                <span>Rol</span>

                <strong>
                  {perfil?.nombre_rol || "Administrador"}
                </strong>
              </div>

              <div>
                <span>ID usuario</span>

                <strong>
                  #{perfil?.id_usuario}
                </strong>
              </div>
            </div>

            <div className="perfil-admin-actions">
              <button
                type="button"
                className="perfil-admin-btn secondary"
                onClick={cargarPerfil}
                disabled={guardando}
              >
                Cancelar cambios
              </button>

              <button
                type="button"
                className="perfil-admin-btn primary"
                onClick={guardarPerfil}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Actualizar perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}