import { useEffect, useState } from "react";
import "../styles/Configuracion.css";
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarPasswordUsuario,
} from "../services/api";

const configBase = {
  tema: "SISTEMA",
  idioma: "Español",
  vista_inicio: "Inicio",
  noti_correo: 1,
  noti_solicitudes: 1,
  noti_recursos: 1,
  noti_novedades: 0,
  perfil_visible: 1,
  guardar_sesion: 1,
  confirmar_descarga: 1,
};

function normalizarConfig(data) {
  return {
    tema: data?.tema || "SISTEMA",
    idioma: data?.idioma || "Español",
    vista_inicio: data?.vista_inicio || "Inicio",
    noti_correo: Number(data?.noti_correo ?? 1),
    noti_solicitudes: Number(data?.noti_solicitudes ?? 1),
    noti_recursos: Number(data?.noti_recursos ?? 1),
    noti_novedades: Number(data?.noti_novedades ?? 0),
    perfil_visible: Number(data?.perfil_visible ?? 1),
    guardar_sesion: Number(data?.guardar_sesion ?? 1),
    confirmar_descarga: Number(data?.confirmar_descarga ?? 1),
  };
}

export default function VistaConfiguracion({ usuario }) {
  const [config, setConfig] = useState(configBase);
  const [panelActivo, setPanelActivo] = useState("preferencias");
  const [modalPassword, setModalPassword] = useState(false);
  const [guardadoVisible, setGuardadoVisible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const idUsuario =
    usuario?.id_usuario ||
    usuario?.id ||
    usuario?.idUsuario ||
    null;

  const nombreUsuario = usuario?.nombre || "Usuario";
  const correoUsuario = usuario?.correo || "usuario@fatec.edu.bo";
  const rolUsuario = usuario?.rol || "Usuario";

  useEffect(() => {
    async function cargarConfiguracion() {
      if (!idUsuario) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);

        const data = await obtenerConfiguracion(idUsuario);
        const configNormalizada = normalizarConfig(data);

        setConfig(configNormalizada);
        localStorage.setItem(
          "sitec_configuracion",
          JSON.stringify(configNormalizada)
        );
      } catch (error) {
        console.error("Error al cargar configuración:", error);

        const guardado = localStorage.getItem("sitec_configuracion");
        if (guardado) {
          setConfig(normalizarConfig(JSON.parse(guardado)));
        }
      } finally {
        setCargando(false);
      }
    }

    cargarConfiguracion();
  }, [idUsuario]);

  const mostrarGuardado = () => {
    setGuardadoVisible(true);

    setTimeout(() => {
      setGuardadoVisible(false);
    }, 1800);
  };

  const guardarConfiguracion = async (nuevaConfig) => {
    if (!idUsuario) {
      alert("No se encontró el usuario activo.");
      return;
    }

    try {
      setGuardando(true);
      setConfig(nuevaConfig);

      await actualizarConfiguracion(idUsuario, nuevaConfig);

      localStorage.setItem(
        "sitec_configuracion",
        JSON.stringify(nuevaConfig)
      );

      mostrarGuardado();
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      alert("No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarCampo = (campo, valor) => {
    const nuevaConfig = {
      ...config,
      [campo]: valor,
    };

    guardarConfiguracion(nuevaConfig);
  };

  const cambiarToggle = (campo) => {
    const valorActual = Number(config[campo]) === 1 ? 0 : 1;
    cambiarCampo(campo, valorActual);
  };

  const cambiarPassword = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarPassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.actual || !passwordForm.nueva || !passwordForm.confirmar) {
      alert("Completa todos los campos.");
      return;
    }

    if (passwordForm.nueva.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (passwordForm.nueva !== passwordForm.confirmar) {
      alert("La nueva contraseña no coincide.");
      return;
    }

    try {
      await cambiarPasswordUsuario(idUsuario, {
        actual: passwordForm.actual,
        nueva: passwordForm.nueva,
      });

      alert("Contraseña actualizada correctamente.");

      setPasswordForm({
        actual: "",
        nueva: "",
        confirmar: "",
      });

      setModalPassword(false);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert(error.message || "No se pudo cambiar la contraseña.");
    }
  };

  const restablecerConfig = () => {
    const confirmar = window.confirm(
      "¿Deseas restablecer la configuración a los valores iniciales?"
    );

    if (!confirmar) return;

    guardarConfiguracion(configBase);
  };

  const Toggle = ({ activo, onClick }) => (
    <button
      type="button"
      className={`config-toggle ${Number(activo) === 1 ? "on" : ""}`}
      onClick={onClick}
      aria-label="Cambiar opción"
      disabled={guardando}
    >
      <span></span>
    </button>
  );

  if (cargando) {
    return (
      <section className="config-page">
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Cargando</span>
              <h2>Configuración</h2>
              <p>Estamos obteniendo tus preferencias desde la base de datos.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="config-page">
      <div className="config-hero">
        <div className="config-hero-info">
          <span className="config-eyebrow">Preferencias del sistema</span>

          <h1>Configuración</h1>

          <p>
            Administra las preferencias de tu cuenta, notificaciones, seguridad
            y opciones de uso dentro de la biblioteca digital SITEC.
          </p>

          <div className="config-hero-tags">
            <span>{rolUsuario}</span>
            <span>Cuenta institucional</span>
            <span>{guardando ? "Guardando cambios" : "Preferencias guardadas"}</span>
          </div>
        </div>

        <div className="config-user-card">
          <div className="config-user-avatar">
            {nombreUsuario.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{nombreUsuario}</strong>
            <p>{correoUsuario}</p>
          </div>
        </div>
      </div>

      <div className="config-status-row">
        <div className="config-status-card status-active">
          <div className="status-icon status-cuenta"></div>
          <div>
            <span>Estado de cuenta</span>
            <strong>Activa</strong>
            <p>Tu cuenta institucional se encuentra habilitada.</p>
          </div>
        </div>

        <div className="config-status-card status-secure">
          <div className="status-icon status-seguridad"></div>
          <div>
            <span>Seguridad</span>
            <strong>Protegida</strong>
            <p>Acceso vinculado al correo Facultativo @fatec.edu.bo.</p>
          </div>
        </div>

        <div className="config-status-card status-sync">
          <div className="status-icon status-sync-icon"></div>
          <div>
            <span>Preferencias</span>
            <strong>{guardando ? "Guardando" : "Guardadas"}</strong>
            <p>Los cambios se almacenan en la base de datos.</p>
          </div>
        </div>
      </div>

      <div className="config-tabs">
        <button
          type="button"
          className={panelActivo === "preferencias" ? "activo" : ""}
          onClick={() => setPanelActivo("preferencias")}
        >
          <span className="tab-icon icon-preferencias"></span>
          Preferencias
        </button>

        <button
          type="button"
          className={panelActivo === "notificaciones" ? "activo" : ""}
          onClick={() => setPanelActivo("notificaciones")}
        >
          <span className="tab-icon icon-notificaciones"></span>
          Notificaciones
        </button>

        <button
          type="button"
          className={panelActivo === "seguridad" ? "activo" : ""}
          onClick={() => setPanelActivo("seguridad")}
        >
          <span className="tab-icon icon-seguridad"></span>
          Seguridad
        </button>

        <button
          type="button"
          className={panelActivo === "privacidad" ? "activo" : ""}
          onClick={() => setPanelActivo("privacidad")}
        >
          <span className="tab-icon icon-privacidad"></span>
          Privacidad
        </button>
      </div>

      {panelActivo === "preferencias" && (
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Personalización</span>
              <h2>Preferencias generales</h2>
              <p>
                Ajusta la forma en la que deseas visualizar y utilizar el
                sistema.
              </p>
            </div>
          </div>

          <div className="config-grid">
            <div className="config-option-card">
              <div className="config-option-icon icon-tema"></div>

              <div>
                <h3>Tema de visualización</h3>
                <p>Selecciona el modo visual preferido para tu cuenta.</p>
              </div>

              <select
                value={config.tema}
                onChange={(e) => cambiarCampo("tema", e.target.value)}
                disabled={guardando}
              >
                <option value="SISTEMA">Sistema</option>
                <option value="CLARO">Claro</option>
                <option value="OSCURO">Oscuro</option>
              </select>
            </div>

            <div className="config-option-card">
              <div className="config-option-icon icon-idioma"></div>

              <div>
                <h3>Idioma</h3>
                <p>Define el idioma principal de la plataforma.</p>
              </div>

              <select
                value={config.idioma}
                onChange={(e) => cambiarCampo("idioma", e.target.value)}
                disabled={guardando}
              >
                <option value="Español">Español</option>
                <option value="Inglés">Inglés</option>
              </select>
            </div>

            <div className="config-option-card">
              <div className="config-option-icon icon-inicio"></div>

              <div>
                <h3>Pantalla inicial</h3>
                <p>Elige la vista que quieres ver al ingresar al sistema.</p>
              </div>

              <select
                value={config.vista_inicio}
                onChange={(e) => cambiarCampo("vista_inicio", e.target.value)}
                disabled={guardando}
              >
                <option value="Inicio">Inicio</option>
                <option value="Catálogo">Catálogo</option>
                <option value="Favoritos">Favoritos</option>
                <option value="Mi perfil">Mi perfil</option>
              </select>
            </div>

            <div className="config-option-card">
              <div className="config-option-icon icon-descarga"></div>

              <div>
                <h3>Confirmar descargas</h3>
                <p>Solicitar confirmación antes de descargar un recurso.</p>
              </div>

              <Toggle
                activo={config.confirmar_descarga}
                onClick={() => cambiarToggle("confirmar_descarga")}
              />
            </div>
          </div>
        </div>
      )}

      {panelActivo === "notificaciones" && (
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Alertas del sistema</span>
              <h2>Notificaciones</h2>
              <p>
                Configura qué avisos deseas recibir dentro de la plataforma.
              </p>
            </div>
          </div>

          <div className="config-list">
            <div className="config-list-item">
              <div>
                <h3>Notificaciones por correo</h3>
                <p>Recibir avisos importantes en el correo institucional.</p>
              </div>

              <Toggle
                activo={config.noti_correo}
                onClick={() => cambiarToggle("noti_correo")}
              />
            </div>

            <div className="config-list-item">
              <div>
                <h3>Estado de solicitudes</h3>
                <p>Alertas cuando una solicitud cambie de estado.</p>
              </div>

              <Toggle
                activo={config.noti_solicitudes}
                onClick={() => cambiarToggle("noti_solicitudes")}
              />
            </div>

            <div className="config-list-item">
              <div>
                <h3>Recursos nuevos</h3>
                <p>Avisos sobre nuevos materiales disponibles.</p>
              </div>

              <Toggle
                activo={config.noti_recursos}
                onClick={() => cambiarToggle("noti_recursos")}
              />
            </div>

            <div className="config-list-item">
              <div>
                <h3>Novedades académicas</h3>
                <p>Información general sobre actualizaciones de SITEC.</p>
              </div>

              <Toggle
                activo={config.noti_novedades}
                onClick={() => cambiarToggle("noti_novedades")}
              />
            </div>
          </div>
        </div>
      )}

      {panelActivo === "seguridad" && (
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Protección de cuenta</span>
              <h2>Seguridad</h2>
              <p>
                Revisa las opciones principales de acceso y protección de tu
                cuenta institucional.
              </p>
            </div>
          </div>

          <div className="config-security-grid">
            <div className="config-security-card principal">
              <div className="security-icon"></div>

              <h3>Contraseña de acceso</h3>

              <p>
                Actualiza tu contraseña periódicamente para mantener protegida
                tu cuenta dentro del sistema.
              </p>

              <button type="button" onClick={() => setModalPassword(true)}>
                Cambiar contraseña
              </button>
            </div>

            <div className="config-security-card">
              <span>Correo vinculado</span>
              <strong>{correoUsuario}</strong>
              <p>Este correo se utiliza para identificar tu cuenta.</p>
            </div>

            <div className="config-security-card">
              <span>Estado de sesión</span>
              <strong>Activa</strong>
              <p>Tu sesión se encuentra abierta en este navegador.</p>
            </div>
          </div>
        </div>
      )}

      {panelActivo === "privacidad" && (
        <div className="config-panel">
          <div className="config-panel-header">
            <div>
              <span>Datos personales</span>
              <h2>Privacidad</h2>
              <p>
                Controla algunas opciones relacionadas con tu información dentro
                de SITEC.
              </p>
            </div>
          </div>

          <div className="config-list">
            <div className="config-list-item">
              <div>
                <h3>Perfil visible en el sistema</h3>
                <p>
                  Permitir que tu perfil sea visible en acciones académicas del
                  sistema.
                </p>
              </div>

              <Toggle
                activo={config.perfil_visible}
                onClick={() => cambiarToggle("perfil_visible")}
              />
            </div>

            <div className="config-list-item">
              <div>
                <h3>Mantener sesión iniciada</h3>
                <p>Recordar el acceso en este navegador.</p>
              </div>

              <Toggle
                activo={config.guardar_sesion}
                onClick={() => cambiarToggle("guardar_sesion")}
              />
            </div>
          </div>

          <div className="config-reset-box">
            <div>
              <h3>Restablecer configuración</h3>
              <p>
                Esta acción devuelve las preferencias visuales y notificaciones a
                su estado inicial.
              </p>
            </div>

            <button type="button" onClick={restablecerConfig}>
              Restablecer
            </button>
          </div>
        </div>
      )}

      {modalPassword && (
        <div className="config-modal-overlay">
          <form className="config-modal" onSubmit={guardarPassword}>
            <div className="config-modal-header">
              <div>
                <span>Seguridad</span>
                <h2>Cambiar contraseña</h2>
              </div>

              <button type="button" onClick={() => setModalPassword(false)}>
                ×
              </button>
            </div>

            <div className="config-modal-body">
              <label>
                Contraseña actual
                <input
                  type="password"
                  name="actual"
                  value={passwordForm.actual}
                  onChange={cambiarPassword}
                />
              </label>

              <label>
                Nueva contraseña
                <input
                  type="password"
                  name="nueva"
                  value={passwordForm.nueva}
                  onChange={cambiarPassword}
                />
              </label>

              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  name="confirmar"
                  value={passwordForm.confirmar}
                  onChange={cambiarPassword}
                />
              </label>
            </div>

            <div className="config-modal-footer">
              <button
                type="button"
                className="btn-config-cancelar"
                onClick={() => setModalPassword(false)}
              >
                Cancelar
              </button>

              <button type="submit" className="btn-config-guardar">
                Guardar cambio
              </button>
            </div>
          </form>
        </div>
      )}

      {guardadoVisible && (
        <div className="config-toast">
          <span></span>
          Configuración guardada correctamente
        </div>
      )}
    </section>
  );
}