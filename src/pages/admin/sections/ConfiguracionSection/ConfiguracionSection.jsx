import { useEffect, useMemo, useState } from "react";
import "./ConfiguracionSection.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const CONFIG_VACIA = {
  nombreSistema: "",
  institucion: "",
  responsable: "",
  correoSoporte: "",
  descripcion: "",

  aprobacionRecursos: false,
  permitirSubidaDocentes: false,
  permitirSubidaEstudiantes: false,
  mostrarRecursosPendientes: false,

  autenticacionDoble: false,
  bloqueoSesion: "30 minutos",
  modoMantenimiento: false,
  registroActividad: false,


   respaldoAutomatico: false,
  frecuenciaRespaldo: "Semanal",
  conservacionRespaldos: "90 días",

  footer_titulo: "SITEC",
  footer_descripcion:
    "Sistema Integrado de Tecnología y Conocimiento de la Facultad de Tecnología. Accede, comparte y gestiona recursos académicos de manera eficiente.",
  footer_badge_1: "UMSA",
  footer_badge_2: "Fac. Tecnología",

  footer_titulo_recursos: "Recursos",
  footer_mostrar_catalogo: true,
  footer_mostrar_favoritos: true,
  footer_mostrar_historial: true,
  footer_mostrar_sugerir: true,

  footer_titulo_cuenta: "Mi Cuenta",
  footer_mostrar_perfil: true,
  footer_mostrar_solicitudes: true,
  footer_mostrar_configuracion: true,
  footer_mostrar_cerrar_sesion: true,

  footer_titulo_contacto: "Contacto",
  footer_direccion: "Av. Villazón esq. Calle 27, La Paz, Bolivia",
  footer_correo: "sitec@umsa.bo",
  footer_horario: "Lun – Vie, 08:00 – 18:00",
  footer_telefono: "(+591-2) 244-0565",

  footer_copyright: "SITEC – Facultad de Tecnología",
  footer_mostrar_facebook: true,
  footer_mostrar_instagram: true,
  footer_mostrar_youtube: true,
  footer_mostrar_whatsapp: true,
};
function ConfiguracionSection() {
  const [configuracion, setConfiguracion] = useState(CONFIG_VACIA);
  const [seccionActiva, setSeccionActiva] = useState("general");
  const [ultimoGuardado, setUltimoGuardado] = useState("Sin guardar");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2800);
  };
  const generarRespaldo = async () => {
  try {
    setGuardando(true);

    const respuesta = await fetch(`${API_URL}/admin/configuracion/respaldo`, {
      method: "POST",
    });

    if (!respuesta.ok) {
      const texto = await respuesta.text();
      throw new Error(texto || "No se pudo generar el respaldo");
    }

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `bdsitec_respaldo_${new Date()
      .toISOString()
      .slice(0, 10)}.sql`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.URL.revokeObjectURL(url);

    const fecha = new Date().toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setUltimoGuardado(fecha);
    mostrarMensaje("Respaldo generado y descargado correctamente");
  } catch (error) {
    console.error("Error al generar respaldo:", error);
    mostrarMensaje("No se pudo generar el respaldo");
  } finally {
    setGuardando(false);
  }
};
  const cargarConfiguracion = async () => {
    try {
      setLoading(true);

      const respuesta = await fetch(`${API_URL}/admin/configuracion`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje ||
            data.error ||
            "No se pudo cargar la configuración"
        );
      }

      setConfiguracion({
        ...CONFIG_VACIA,
        ...(data.configuracion || {}),
      });

      setUltimoGuardado("Cargado desde la base de datos");
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      mostrarMensaje("No se pudo cargar la configuración desde la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const metricas = useMemo(
    () => [
      
      
    ],
    [configuracion]
  );

  const actualizarCampo = (campo, valor) => {
    setConfiguracion((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const alternarCampo = (campo) => {
    setConfiguracion((actual) => ({
      ...actual,
      [campo]: !actual[campo],
    }));
  };

 const guardarCambios = async () => {
  try {
    setGuardando(true);

    console.log("CONFIG QUE SE ENVIARÁ:", configuracion);

    const respuesta = await fetch(`${API_URL}/admin/configuracion`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configuracion),
    });

    const texto = await respuesta.text();

    let data = {};
    try {
      data = texto ? JSON.parse(texto) : {};
    } catch {
      data = {};
    }

    console.log("RESPUESTA GUARDADO:", data);

    if (!respuesta.ok) {
      throw new Error(
        data.mensaje ||
        data.error ||
        texto ||
        "No se pudo guardar la configuración"
      );
    }

    await cargarConfiguracion();

    const fecha = new Date().toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setUltimoGuardado(fecha);
    mostrarMensaje("Configuración guardada correctamente en la base de datos");
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    mostrarMensaje("No se pudo guardar la configuración");
  } finally {
    setGuardando(false);
  }
};
 

  const restaurarConfiguracion = async () => {
    const confirmar = window.confirm(
      "¿Seguro que deseas restaurar la configuración predeterminada?"
    );

    if (!confirmar) return;

    try {
      setGuardando(true);

      const respuesta = await fetch(
        `${API_URL}/admin/configuracion/restaurar`,
        {
          method: "POST",
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje ||
            data.error ||
            "No se pudo restaurar la configuración"
        );
      }

      await cargarConfiguracion();

      setUltimoGuardado("Configuración restaurada");
      mostrarMensaje("Configuración restaurada correctamente");
    } catch (error) {
      console.error("Error al restaurar configuración:", error);
      mostrarMensaje("No se pudo restaurar la configuración");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="configuracion-section">
      <div className="configuracion-header">
        <div>
          <p className="configuracion-eyebrow">
            Panel administrativo
          </p>

          <h1>
            Configuración
          </h1>

          <p>
            Administra los parámetros principales de la biblioteca digital SITEC.
            Los cambios se guardan directamente en la base de datos.
          </p>
        </div>

        <div className="configuracion-header__actions">
          <button
            type="button"
            className="configuracion-btn secondary"
            onClick={restaurarConfiguracion}
            disabled={loading || guardando}
          >
            Restaurar valores
          </button>

          <button
            type="button"
            className="configuracion-btn primary"
            onClick={guardarCambios}
            disabled={loading || guardando}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Cargando configuración desde la base de datos...
        </div>
      ) : (
        <>
          

          <div className="configuracion-layout">
            <aside className="configuracion-menu-card">
              <div className="configuracion-menu-head">
                <h2>
                  Ajustes del sistema
                </h2>

                <p>
                  Selecciona una sección para modificar.
                </p>
              </div>

              <div className="configuracion-menu-list">
                <ConfigMenuButton
                  active={seccionActiva === "general"}
                  icon="settings"
                  title="General"
                  text="Datos institucionales"
                  onClick={() => setSeccionActiva("general")}
                />

                <ConfigMenuButton
                  active={seccionActiva === "biblioteca"}
                  icon="book"
                  title="Biblioteca"
                  text="Carga y aprobación"
                  onClick={() => setSeccionActiva("biblioteca")}
                />

                <ConfigMenuButton
                  active={seccionActiva === "seguridad"}
                  icon="shield"
                  title="Seguridad"
                  text="Accesos y sesiones"
                  onClick={() => setSeccionActiva("seguridad")}
                />


                <ConfigMenuButton
                  active={seccionActiva === "respaldo"}
                  icon="database"
                  title="Respaldo"
                  text="Copias de seguridad"
                  onClick={() => setSeccionActiva("respaldo")}
                />
                <ConfigMenuButton
                  active={seccionActiva === "footer"}
                  icon="settings"
                  title="Footer"
                  text="Textos e íconos visibles"
                  onClick={() => setSeccionActiva("footer")}
                />
              </div>
            </aside>

            <div className="configuracion-panel-card">
              {seccionActiva === "general" && (
                <ConfigBlock
                  icon="settings"
                  title="Configuración general"
                  text="Define la información principal que identifica al sistema dentro del panel administrativo."
                >
                  <div className="configuracion-form-grid">
                    <ConfigInput
                      label="Nombre del sistema"
                      value={configuracion.nombreSistema}
                      onChange={(value) =>
                        actualizarCampo("nombreSistema", value)
                      }
                    />

                    <ConfigInput
                      label="Institución"
                      value={configuracion.institucion}
                      onChange={(value) =>
                        actualizarCampo("institucion", value)
                      }
                    />

                    <ConfigInput
                      label="Responsable"
                      value={configuracion.responsable}
                      onChange={(value) =>
                        actualizarCampo("responsable", value)
                      }
                    />

                    <ConfigInput
                      label="Correo de soporte"
                      value={configuracion.correoSoporte}
                      onChange={(value) =>
                        actualizarCampo("correoSoporte", value)
                      }
                    />
                  </div>

                  <label className="configuracion-field full">
                    <span>
                      Descripción institucional
                    </span>

                    <textarea
                      value={configuracion.descripcion}
                      onChange={(e) =>
                        actualizarCampo("descripcion", e.target.value)
                      }
                    />
                  </label>
                </ConfigBlock>
              )}

              {seccionActiva === "biblioteca" && (
                <ConfigBlock
                  icon="book"
                  title="Configuración de biblioteca"
                  text="Controla cómo se registran, revisan y publican los recursos digitales académicos."
                >
                  <ConfigSettingRow
                    icon="approval"
                    title="Aprobación obligatoria de recursos"
                    text="Todo libro, documento o material cargado debe ser revisado por un administrador antes de publicarse."
                    checked={configuracion.aprobacionRecursos}
                    onToggle={() => alternarCampo("aprobacionRecursos")}
                  />

                  <ConfigSettingRow
                    icon="user"
                    title="Permitir carga de recursos por docentes"
                    text="Los docentes podrán subir recursos para sus materias, quedando pendientes de revisión."
                    checked={configuracion.permitirSubidaDocentes}
                    onToggle={() => alternarCampo("permitirSubidaDocentes")}
                  />

                  <ConfigSettingRow
                    icon="user"
                    title="Permitir sugerencias de estudiantes"
                    text="Los estudiantes podrán proponer materiales académicos para evaluación administrativa."
                    checked={configuracion.permitirSubidaEstudiantes}
                    onToggle={() =>
                      alternarCampo("permitirSubidaEstudiantes")
                    }
                  />

                  <ConfigSettingRow
                    icon="bell"
                    title="Mostrar recursos pendientes en el panel"
                    text="Las solicitudes pendientes aparecerán como alerta dentro del panel de administrador."
                    checked={configuracion.mostrarRecursosPendientes}
                    onToggle={() => alternarCampo("mostrarRecursosPendientes")}
                  />
                </ConfigBlock>
              )}

              {seccionActiva === "seguridad" && (
                <ConfigBlock
                  icon="shield"
                  title="Seguridad y acceso"
                  text="Administra los parámetros de control para proteger el acceso al sistema."
                >
                  <ConfigSettingRow
                    icon="shield"
                    title="Autenticación en dos pasos"
                    text="Solicita una verificación adicional para administradores y usuarios autorizados."
                    checked={configuracion.autenticacionDoble}
                    onToggle={() => alternarCampo("autenticacionDoble")}
                  />

                  <ConfigSettingRow
                    icon="settings"
                    title="Registro de actividad"
                    text="Guarda acciones importantes realizadas dentro del sistema."
                    checked={configuracion.registroActividad}
                    onToggle={() => alternarCampo("registroActividad")}
                  />

                  <ConfigSettingRow
                    icon="database"
                    title="Modo mantenimiento"
                    text="Bloquea temporalmente el acceso público mientras se realizan ajustes internos."
                    checked={configuracion.modoMantenimiento}
                    onToggle={() => alternarCampo("modoMantenimiento")}
                    danger
                  />

                  <label className="configuracion-field">
                    <span>
                      Bloqueo automático de sesión
                    </span>

                    <select
                      value={configuracion.bloqueoSesion}
                      onChange={(e) =>
                        actualizarCampo("bloqueoSesion", e.target.value)
                      }
                    >
                      <option value="15 minutos">
                        15 minutos
                      </option>

                      <option value="30 minutos">
                        30 minutos
                      </option>

                      <option value="1 hora">
                        1 hora
                      </option>

                      <option value="2 horas">
                        2 horas
                      </option>
                    </select>
                  </label>
                </ConfigBlock>
              )}


              {seccionActiva === "respaldo" && (
                <ConfigBlock
                  icon="database"
                  title="Respaldo y mantenimiento"
                  text="Configura las copias de seguridad para proteger la información académica."
                >
                  <ConfigSettingRow
                    icon="database"
                    title="Respaldo automático"
                    text="Genera copias de seguridad de la base de datos en intervalos programados."
                    checked={configuracion.respaldoAutomatico}
                    onToggle={() => alternarCampo("respaldoAutomatico")}
                  />

                  <div className="configuracion-form-grid">
                    <label className="configuracion-field">
                      <span>
                        Frecuencia de respaldo
                      </span>

                      <select
                        value={configuracion.frecuenciaRespaldo}
                        onChange={(e) =>
                          actualizarCampo(
                            "frecuenciaRespaldo",
                            e.target.value
                          )
                        }
                      >
                        <option value="Diario">
                          Diario
                        </option>

                        <option value="Semanal">
                          Semanal
                        </option>

                        <option value="Mensual">
                          Mensual
                        </option>
                      </select>
                    </label>

                    <label className="configuracion-field">
                      <span>
                        Conservación de respaldos
                      </span>

                      <select
                        value={configuracion.conservacionRespaldos}
                        onChange={(e) =>
                          actualizarCampo(
                            "conservacionRespaldos",
                            e.target.value
                          )
                        }
                      >
                        <option value="30 días">
                          30 días
                        </option>

                        <option value="60 días">
                          60 días
                        </option>

                        <option value="90 días">
                          90 días
                        </option>

                        <option value="1 año">
                          1 año
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="configuracion-actions-box">
                    <button
                      type="button"
                      className="configuracion-mini-btn primary"
                      onClick={generarRespaldo}
                      disabled={guardando}
                    >
                      {guardando ? "Generando..." : "Generar respaldo ahora"}
                    </button>

                    <button
                      type="button"
                      className="configuracion-mini-btn"
                      onClick={guardarCambios}
                    >
                      Exportar configuración
                    </button>
                  </div>
                </ConfigBlock>
              )}

              {seccionActiva === "footer" && (
  <ConfigBlock
    icon="settings"
    title="Footer del sistema"
    text="Edita los textos, enlaces visibles e íconos del footer sin modificar los colores del diseño."
  >
    <div className="configuracion-form-grid">
      <ConfigInput
        label="Título del footer"
        value={configuracion.footer_titulo}
        onChange={(value) => actualizarCampo("footer_titulo", value)}
      />

      <ConfigInput
        label="Texto insignia 1"
        value={configuracion.footer_badge_1}
        onChange={(value) => actualizarCampo("footer_badge_1", value)}
      />

      <ConfigInput
        label="Texto insignia 2"
        value={configuracion.footer_badge_2}
        onChange={(value) => actualizarCampo("footer_badge_2", value)}
      />

      <ConfigInput
        label="Texto de derechos reservados"
        value={configuracion.footer_copyright}
        onChange={(value) => actualizarCampo("footer_copyright", value)}
      />
    </div>

    <label className="configuracion-field full">
      <span>Descripción del footer</span>

      <textarea
        value={configuracion.footer_descripcion || ""}
        onChange={(e) =>
          actualizarCampo("footer_descripcion", e.target.value)
        }
      />
    </label>

    <div className="configuracion-form-grid">
      <ConfigInput
        label="Título columna Recursos"
        value={configuracion.footer_titulo_recursos}
        onChange={(value) =>
          actualizarCampo("footer_titulo_recursos", value)
        }
      />

      <ConfigInput
        label="Título columna Mi Cuenta"
        value={configuracion.footer_titulo_cuenta}
        onChange={(value) =>
          actualizarCampo("footer_titulo_cuenta", value)
        }
      />

      <ConfigInput
        label="Título columna Contacto"
        value={configuracion.footer_titulo_contacto}
        onChange={(value) =>
          actualizarCampo("footer_titulo_contacto", value)
        }
      />

      <ConfigInput
        label="Correo visible"
        value={configuracion.footer_correo}
        onChange={(value) => actualizarCampo("footer_correo", value)}
      />

      <ConfigInput
        label="Dirección"
        value={configuracion.footer_direccion}
        onChange={(value) => actualizarCampo("footer_direccion", value)}
      />

      <ConfigInput
        label="Teléfono"
        value={configuracion.footer_telefono}
        onChange={(value) => actualizarCampo("footer_telefono", value)}
      />

      <ConfigInput
        label="Horario"
        value={configuracion.footer_horario}
        onChange={(value) => actualizarCampo("footer_horario", value)}
      />
    </div>

    <ConfigSettingRow
      icon="book"
      title="Mostrar enlace Catálogo"
      text="Muestra u oculta el acceso al catálogo en el footer."
      checked={configuracion.footer_mostrar_catalogo}
      onToggle={() => alternarCampo("footer_mostrar_catalogo")}
    />

    <ConfigSettingRow
      icon="book"
      title="Mostrar enlace Favoritos"
      text="Muestra u oculta el acceso a favoritos en el footer."
      checked={configuracion.footer_mostrar_favoritos}
      onToggle={() => alternarCampo("footer_mostrar_favoritos")}
    />

    <ConfigSettingRow
      icon="book"
      title="Mostrar enlace Historial"
      text="Muestra u oculta el historial de descargas en el footer."
      checked={configuracion.footer_mostrar_historial}
      onToggle={() => alternarCampo("footer_mostrar_historial")}
    />

    <ConfigSettingRow
      icon="book"
      title="Mostrar enlace Sugerir libro"
      text="Muestra u oculta el enlace para sugerir un libro."
      checked={configuracion.footer_mostrar_sugerir}
      onToggle={() => alternarCampo("footer_mostrar_sugerir")}
    />

    <ConfigSettingRow
      icon="user"
      title="Mostrar Mi Perfil"
      text="Muestra u oculta el acceso al perfil del usuario."
      checked={configuracion.footer_mostrar_perfil}
      onToggle={() => alternarCampo("footer_mostrar_perfil")}
    />

    <ConfigSettingRow
      icon="user"
      title="Mostrar Mis Solicitudes"
      text="Muestra u oculta el acceso a solicitudes del usuario."
      checked={configuracion.footer_mostrar_solicitudes}
      onToggle={() => alternarCampo("footer_mostrar_solicitudes")}
    />

    <ConfigSettingRow
      icon="settings"
      title="Mostrar Configuración"
      text="Muestra u oculta el enlace de configuración en el footer."
      checked={configuracion.footer_mostrar_configuracion}
      onToggle={() => alternarCampo("footer_mostrar_configuracion")}
    />

    <ConfigSettingRow
      icon="shield"
      title="Mostrar Cerrar sesión"
      text="Muestra u oculta el botón de cierre de sesión en el footer."
      checked={configuracion.footer_mostrar_cerrar_sesion}
      onToggle={() => alternarCampo("footer_mostrar_cerrar_sesion")}
    />

    <ConfigSettingRow
      icon="settings"
      title="Mostrar Facebook"
      text="Muestra u oculta el ícono de Facebook."
      checked={configuracion.footer_mostrar_facebook}
      onToggle={() => alternarCampo("footer_mostrar_facebook")}
    />

    <ConfigSettingRow
      icon="settings"
      title="Mostrar Instagram"
      text="Muestra u oculta el ícono de Instagram."
      checked={configuracion.footer_mostrar_instagram}
      onToggle={() => alternarCampo("footer_mostrar_instagram")}
    />

    <ConfigSettingRow
      icon="settings"
      title="Mostrar YouTube"
      text="Muestra u oculta el ícono de YouTube."
      checked={configuracion.footer_mostrar_youtube}
      onToggle={() => alternarCampo("footer_mostrar_youtube")}
    />

    <ConfigSettingRow
      icon="settings"
      title="Mostrar WhatsApp"
      text="Muestra u oculta el ícono de WhatsApp."
      checked={configuracion.footer_mostrar_whatsapp}
      onToggle={() => alternarCampo("footer_mostrar_whatsapp")}
    />
  </ConfigBlock>
)}

            </div>

            <aside className="configuracion-status-card">
              <div className="configuracion-status-head">
                <div className="configuracion-status-icon">
                  <ConfigIcon name="shield" />
                </div>

                <div>
                  <h2>
                    Estado actual
                  </h2>

                  <p>
                    Resumen de configuración activa.
                  </p>
                </div>
              </div>

              <div className="configuracion-status-list">
                <ConfigStatus
                  label="Sistema"
                  value={configuracion.nombreSistema || "No definido"}
                />

                <ConfigStatus
                  label="Aprobación"
                  value={
                    configuracion.aprobacionRecursos
                      ? "Revisión obligatoria"
                      : "Publicación directa"
                  }
                />

                <ConfigStatus
                  label="Sesión"
                  value={configuracion.bloqueoSesion || "No definido"}
                />

                <ConfigStatus
                  label="Modo mantenimiento"
                  value={
                    configuracion.modoMantenimiento ? "Activo" : "Inactivo"
                  }
                  danger={configuracion.modoMantenimiento}
                />

                <ConfigStatus
                  label="Respaldo"
                  value={
                    configuracion.respaldoAutomatico
                      ? configuracion.frecuenciaRespaldo
                      : "Desactivado"
                  }
                />

                <ConfigStatus
                  label="Último guardado"
                  value={ultimoGuardado}
                />
                <ConfigStatus
                label="Footer"
                value={configuracion.footer_titulo || "SITEC"}
              />
              </div>

              <div className="configuracion-preview">
                <span>
                  Vista institucional
                </span>

                <strong>
                  {configuracion.nombreSistema || "SITEC"}
                </strong>

                <p>
                  {configuracion.institucion || "Facultad de Tecnología"}
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

function ConfigMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`configuracion-metric ${tipo}`}>
      <div className="configuracion-metric__icon">
        <ConfigIcon name={icon} />
      </div>

      <strong>
        {valor}
      </strong>

      <h3>
        {titulo}
      </h3>

      <p>
        {detalle}
      </p>
    </article>
  );
}

function ConfigMenuButton({ active, icon, title, text, onClick }) {
  return (
    <button
      type="button"
      className={`configuracion-menu-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="configuracion-menu-icon">
        <ConfigIcon name={icon} />
      </span>

      <span>
        <strong>
          {title}
        </strong>

        <small>
          {text}
        </small>
      </span>
    </button>
  );
}

function ConfigBlock({ icon, title, text, children }) {
  return (
    <div className="configuracion-block">
      <div className="configuracion-block-head">
        <div className="configuracion-block-icon">
          <ConfigIcon name={icon} />
        </div>

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {text}
          </p>
        </div>
      </div>

      <div className="configuracion-block-body">
        {children}
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onChange }) {
  return (
    <label className="configuracion-field">
      <span>
        {label}
      </span>

      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ConfigSettingRow({ icon, title, text, checked, onToggle, danger }) {
  return (
    <div className={`configuracion-setting-row ${danger ? "danger" : ""}`}>
      <div className="configuracion-setting-icon">
        <ConfigIcon name={icon} />
      </div>

      <div className="configuracion-setting-content">
        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>
      </div>

      <button
        type="button"
        className={`configuracion-switch ${checked ? "active" : ""}`}
        onClick={onToggle}
        aria-label={title}
      >
        <span></span>
      </button>
    </div>
  );
}

function ConfigStatus({ label, value, danger }) {
  return (
    <div className={`configuracion-status-item ${danger ? "danger" : ""}`}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ConfigIcon({ name }) {
  const icons = {
    settings: (
      <>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04A1.8 1.8 0 0 0 14.8 19.6a1.8 1.8 0 0 0-1.1 1.65V21a2.1 2.1 0 0 1-4.2 0v-.06A1.8 1.8 0 0 0 8.4 19.3a1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 3.8 14.7 1.8 1.8 0 0 0 2.15 13H2a2.1 2.1 0 0 1 0-4.2h.06A1.8 1.8 0 0 0 3.7 7.7a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04A1.8 1.8 0 0 0 8.3 3.1 1.8 1.8 0 0 0 9.4 1.45V1.4a2.1 2.1 0 0 1 4.2 0v.06a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04A1.8 1.8 0 0 0 19.3 7.7a1.8 1.8 0 0 0 1.65 1.1H21a2.1 2.1 0 0 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3Z" />
        <path d="M10 21h4" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
      </>
    ),
    approval: (
      <>
        <path d="M9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="configuracion-icon"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default ConfiguracionSection;