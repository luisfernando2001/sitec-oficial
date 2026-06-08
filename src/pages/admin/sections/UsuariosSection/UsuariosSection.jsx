import { useEffect, useMemo, useRef, useState } from "react";
import "./UsuariosSection.css";

import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} from "../../../../services/usuariosService";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const formularioInicial = {
  nombre: "",
  apellido: "",
  carnet: "",
  registro_universitario: "",
  correo: "",
  rol: "Estudiante",
  id_carrera: "",
  estado: "Activo",
  contrasena: "",
};

function UsuariosSection() {
  const [usuarios, setUsuarios] = useState([]);
  const [metricas, setMetricas] = useState({
    totalUsuarios: 0,
    activos: 0,
    estudiantes: 0,
    docentes: 0,
    administradores: 0,
  });

  const [roles, setRoles] = useState(["Administrador", "Docente", "Estudiante"]);
  const [carreras, setCarreras] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const archivoMatriculaRef = useRef(null);
  const [procesandoMatricula, setProcesandoMatricula] = useState(false);
  const [resultadoMatricula, setResultadoMatricula] = useState(null);
  const [idCarreraMatricula, setIdCarreraMatricula] = useState("");
  const cargarUsuarios = async () => {
    try {
      setCargando(true);

      const data = await obtenerUsuarios();

      setUsuarios(data.usuarios || []);
      setMetricas(data.metricas || {});
      setRoles(data.roles?.length ? data.roles : ["Administrador", "Docente", "Estudiante"]);
      setCarreras(data.carreras || []);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar usuarios desde el backend");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2600);
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = `${usuario.nombre} ${usuario.correo} ${usuario.rol} ${usuario.carrera}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === "Todos" || usuario.rol === filtroRol;
      const coincideEstado =
        filtroEstado === "Todos" || usuario.estado === filtroEstado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const abrirNuevo = () => {
    setModoEdicion(false);
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setModoEdicion(true);
    setUsuarioEditando(usuario);

    setFormulario({
    nombre: usuario.nombre_personal || "",
    apellido: usuario.apellido || "",
    carnet: usuario.carnet || "",
    registro_universitario: usuario.registro_universitario || "",
    correo: usuario.correo || "",
    rol: usuario.rol || "Estudiante",
    id_carrera: usuario.id_carrera || "",
    estado: usuario.estado || "Activo",
    contrasena: "",
  });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
  };

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    try {
      if (modoEdicion && usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, formulario);
        mostrarMensaje("Usuario actualizado correctamente");
      } else {
        await crearUsuario(formulario);
        mostrarMensaje("Usuario registrado correctamente");
      }

      cerrarModal();
      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo guardar el usuario. Revisa el correo institucional.");
    }
  };

  const cambiarEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === "Activo" ? "Inactivo" : "Activo";

    try {
      await cambiarEstadoUsuario(usuario.id, nuevoEstado);
      mostrarMensaje(`Usuario ${nuevoEstado.toLowerCase()} correctamente`);

      if (usuarioSeleccionado?.id === usuario.id) {
        setUsuarioSeleccionado({
          ...usuarioSeleccionado,
          estado: nuevoEstado,
        });
      }

      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo cambiar el estado del usuario");
    }
  };

  const exportarCSV = () => {
    const encabezados = [
      "Nombre",
      "Correo",
      "Rol",
      "Carrera",
      "Estado",
      "Fecha registro",
      "Ultimo acceso",
      "Recursos",
    ];

    const filas = usuariosFiltrados.map((usuario) => [
      usuario.nombre,
      usuario.correo,
      usuario.rol,
      usuario.carrera,
      usuario.estado,
      usuario.fechaRegistro,
      usuario.ultimoAcceso,
      usuario.recursos,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "usuarios_sitec.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  };
const descargarPlantillaMatricula = () => {
  const carreraSeleccionada = carreras.find(
    (carrera) => String(carrera.id_carrera) === String(idCarreraMatricula)
  );

  const nombreCarrera =
    carreraSeleccionada?.nombre_carrera ||
    "ESCRIBE_AQUI_LA_CARRERA_O_SELECCIONA_UNA_ARRIBA";

  const filas = [
    [
      "Nro.",
      "FAC.CARR.SEDE",
      "NOMBRES",
      "Reg.Univ.",
      "MATRIC.",
      "C.I.",
      "CATEGORIA",
      "TIPO",
    ],
    [
      1,
      nombreCarrera,
      "PRUEBA ALFA CARLOS DEMO",
      "20990001",
      "99001",
      "9900001",
      "General",
      "NUEVO",
    ],
    [
      2,
      nombreCarrera,
      "PRUEBA BETA MARIA DEMO",
      "20990002",
      "99002",
      "9900002",
      "General",
      "NUEVO",
    ],
    [
      3,
      nombreCarrera,
      "PRUEBA GAMMA LUIS DEMO",
      "20990003",
      "99003",
      "9900003",
      "Profesional y/o Tec.Sup.",
      "ANTIGUO",
    ],
    [
      4,
      nombreCarrera,
      "PRUEBA DELTA ANA DEMO",
      "20990004",
      "99004",
      "9900004",
      "General",
      "NUEVO",
    ],
    [
      5,
      nombreCarrera,
      "PRUEBA EPSILON JUAN DEMO",
      "20990005",
      "99005",
      "9900005",
      "General",
      "ANTIGUO",
    ],
  ];

  const contenido = filas
    .map((fila) =>
      fila
        .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\ufeff" + contenido], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "plantilla_matriculacion_masiva_umsa.csv";
  enlace.click();

  URL.revokeObjectURL(url);
};
const procesarMatriculacionMasiva = async (e) => {
  const archivo = e.target.files?.[0];

  if (!archivo) return;

  const extension = archivo.name.split(".").pop().toLowerCase();

  if (!["xlsx", "xls", "csv"].includes(extension)) {
    mostrarMensaje("Solo se permiten archivos Excel o CSV");
    e.target.value = "";
    return;
  }

  try {
    setProcesandoMatricula(true);
    setResultadoMatricula(null);

    const formData = new FormData();
    formData.append("archivo", archivo);

    if (idCarreraMatricula) {
      formData.append("id_carrera", idCarreraMatricula);
    }

    const respuesta = await fetch(
      `${API_URL}/admin/usuarios/matriculacion-masiva`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "No se pudo procesar el archivo");
    }

    const resumen = data.resumen || {};

    setResultadoMatricula(data);

    mostrarMensaje(
      `Matriculación procesada: ${resumen.registrados || 0} registrados, ${resumen.duplicados || 0} duplicados, ${resumen.errores || 0} errores`
    );

    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message || "Error al procesar la matriculación masiva");
  } finally {
    setProcesandoMatricula(false);
    e.target.value = "";
  }
};
  return (
    <section className="usuarios-section">
<div className="usuarios-header">
  <div>
    <p className="usuarios-eyebrow">Administración de accesos</p>
    <h1>Gestión de Usuarios</h1>
    <p>
      Control de estudiantes, docentes y administradores registrados con
      cuenta institucional de la Facultad de Tecnología.
    </p>
  </div>

  <div className="usuarios-header__actions">
    <input
      ref={archivoMatriculaRef}
      type="file"
      accept=".xlsx,.xls,.csv"
      onChange={procesarMatriculacionMasiva}
      style={{ display: "none" }}
    />

    <select
      value={idCarreraMatricula}
      onChange={(e) => setIdCarreraMatricula(e.target.value)}
      title="Carrera para aplicar al Excel si el archivo no incluye una carrera válida"
      style={{
        minHeight: "42px",
        borderRadius: "12px",
        border: "1px solid rgba(18, 17, 75, 0.18)",
        padding: "0 12px",
        fontWeight: 800,
        color: "#12114b",
        background: "#ffffff",
      }}
    >
      <option value="">Usar carrera escrita en el Excel</option>

      {carreras.map((carrera) => (
        <option key={carrera.id_carrera} value={carrera.id_carrera}>
          {carrera.nombre_carrera}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="usuarios-btn secondary"
      onClick={descargarPlantillaMatricula}
    >
      Descargar plantilla
    </button>

    <button
      type="button"
      className="usuarios-btn secondary"
      onClick={() => archivoMatriculaRef.current?.click()}
      disabled={procesandoMatricula}
    >
      {procesandoMatricula ? "Procesando..." : "Matriculación masiva"}
    </button>

    <button
      type="button"
      className="usuarios-btn primary"
      onClick={abrirNuevo}
    >
      Nuevo usuario
    </button>
  </div>
</div>

{resultadoMatricula && (
  <div className="usuarios-table-card" style={{ marginBottom: "18px" }}>
    <div className="usuarios-card-head">
      <div>
        <h2>Resultado de matriculación masiva</h2>
        <p>
          Registrados: {resultadoMatricula.resumen?.registrados || 0} ·
          Duplicados: {resultadoMatricula.resumen?.duplicados || 0} ·
          Errores: {resultadoMatricula.resumen?.errores || 0}
        </p>
      </div>

      <button
        type="button"
        className="usuarios-btn secondary"
        onClick={() => setResultadoMatricula(null)}
      >
        Ocultar
      </button>
    </div>

    <div className="usuarios-table-wrap">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Fila</th>
            <th>Estudiante</th>
            <th>Estado</th>
            <th>Motivo</th>
          </tr>
        </thead>

        <tbody>
          {(resultadoMatricula.detalle || []).length === 0 ? (
            <tr>
              <td colSpan="4" className="usuarios-empty">
                No hay detalle disponible.
              </td>
            </tr>
          ) : (
            (resultadoMatricula.detalle || []).map((item, index) => (
              <tr key={`${item.fila}-${index}`}>
                <td>{item.fila}</td>
                <td>{item.estudiante || "Sin nombre"}</td>
                <td>
                  <span
                    className={`usuario-estado ${
                      item.estado === "REGISTRADO" ? "activo" : "inactivo"
                    }`}
                  >
                    {item.estado}
                  </span>
                </td>
                <td>{item.motivo}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

      <div className="usuarios-tools">
        <div className="usuarios-search">
          <span></span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol o carrera..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="Todos">Todos los roles</option>
          {roles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>
      </div>

      <div className="usuarios-layout">
        <div className="usuarios-table-card">
          <div className="usuarios-card-head">
            <div>
              <h2>Lista de usuarios</h2>
              <p>
                {cargando
                  ? "Cargando usuarios..."
                  : `${usuariosFiltrados.length} resultados encontrados`}
              </p>
            </div>

            <span className="usuarios-domain">@umsa.bo</span>
          </div>

          <div className="usuarios-table-wrap">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Carrera / Área</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="usuarios-empty">
                      {cargando
                        ? "Cargando información..."
                        : "No existen usuarios con los filtros seleccionados."}
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="usuario-main">
                          <div className={`usuario-avatar ${getRolClass(usuario.rol)}`}>
                            {getIniciales(usuario.nombre)}
                          </div>

                          <div>
                            <strong>{usuario.nombre}</strong>
                            <span>{usuario.correo}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`usuario-badge ${getRolClass(usuario.rol)}`}>
                          {usuario.rol}
                        </span>
                      </td>

                      <td>{usuario.carrera}</td>

                      <td>
                        <span
                          className={`usuario-estado ${
                            usuario.estado === "Activo" ? "activo" : "inactivo"
                          }`}
                        >
                          {usuario.estado}
                        </span>
                      </td>

                      <td>{usuario.ultimoAcceso}</td>

                      <td>
                        <div className="usuarios-actions">
                          <button
                            type="button"
                            className="view"
                            onClick={() => setUsuarioSeleccionado(usuario)}
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            className="view"
                            onClick={() => abrirEditar(usuario)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              usuario.estado === "Activo" ? "disable" : "enable"
                            }
                            onClick={() => cambiarEstado(usuario)}
                          >
                            {usuario.estado === "Activo" ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="usuario-detail">
          <div className="usuario-detail__head">
            <h2>Perfil del usuario</h2>
            <p>Información administrativa y control de cuenta.</p>
          </div>

          {usuarioSeleccionado ? (
            <div className="usuario-detail__body">
              <div className={`usuario-detail__avatar ${getRolClass(usuarioSeleccionado.rol)}`}>
                {getIniciales(usuarioSeleccionado.nombre)}
              </div>

              <h3>{usuarioSeleccionado.nombre}</h3>
              <p className="usuario-detail__mail">
                {usuarioSeleccionado.correo}
              </p>

              <div className="usuario-detail__badges">
                <span className={`usuario-badge ${getRolClass(usuarioSeleccionado.rol)}`}>
                  {usuarioSeleccionado.rol}
                </span>

                <span
                  className={`usuario-estado ${
                    usuarioSeleccionado.estado === "Activo" ? "activo" : "inactivo"
                  }`}
                >
                  {usuarioSeleccionado.estado}
                </span>
              </div>

              <div className="usuario-detail__list">
                <div>
                  <span>Carrera / Área</span>
                  <strong>{usuarioSeleccionado.carrera}</strong>
                </div>

                <div>
                  <span>Fecha de registro</span>
                  <strong>{usuarioSeleccionado.fechaRegistro}</strong>
                </div>

                <div>
                  <span>Último acceso</span>
                  <strong>{usuarioSeleccionado.ultimoAcceso}</strong>
                </div>

                <div>
                  <span>Recursos consultados</span>
                  <strong>{usuarioSeleccionado.recursos}</strong>
                </div>
                <div>
                <span>Carnet</span>
                <strong>{usuarioSeleccionado.carnet || "No registrado"}</strong>
              </div>

              <div>
                <span>Registro universitario</span>
                <strong>{usuarioSeleccionado.registro_universitario || "No registrado"}</strong>
              </div>
              </div>

              <button
                type="button"
                className={
                  usuarioSeleccionado.estado === "Activo"
                    ? "usuario-detail__danger"
                    : "usuario-detail__success"
                }
                onClick={() => cambiarEstado(usuarioSeleccionado)}
              >
                {usuarioSeleccionado.estado === "Activo"
                  ? "Desactivar cuenta"
                  : "Activar cuenta"}
              </button>
            </div>
          ) : (
            <div className="usuario-detail__empty">
              <UserIcon name="profile" />
              <h3>Selecciona un usuario</h3>
              <p>
                Revisa su rol, estado, cuenta institucional y actividad dentro
                del sistema.
              </p>
            </div>
          )}
        </aside>
      </div>

      {modalAbierto && (
        <div className="usuario-modal-backdrop">
          <div className="usuario-modal">
            <div className="usuario-modal__head">
              <div>
                <p>{modoEdicion ? "Editar cuenta" : "Nuevo acceso"}</p>
                <h2>{modoEdicion ? "Actualizar usuario" : "Registrar usuario"}</h2>
              </div>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="usuario-form" onSubmit={guardarUsuario}>
              <div className="usuario-form__grid">
                <label>
                  Nombre
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarFormulario}
                    required
                  />
                </label>

                <label>
                  Apellido
                  <input
                    name="apellido"
                    value={formulario.apellido}
                    onChange={cambiarFormulario}
                    required
                  />
                </label>
                <label>
                Carnet
                <input
                  name="carnet"
                  value={formulario.carnet}
                  onChange={cambiarFormulario}
                  placeholder="Ej. 12345678"
                  required={formulario.rol === "Estudiante"}
                />
              </label>

              <label>
                Registro universitario
                <input
                  name="registro_universitario"
                  value={formulario.registro_universitario}
                  onChange={cambiarFormulario}
                  placeholder="Ej. RU123456"
                  required={formulario.rol === "Estudiante"}
                />
              </label>
                <label>
                  Correo institucional
                  <input
                    type="email"
                    name="correo"
                    value={formulario.correo}
                    onChange={cambiarFormulario}
                    placeholder="usuario@umsa.bo"
                    required
                  />
                </label>

                <label>
                  Rol
                  <select
                    name="rol"
                    value={formulario.rol}
                    onChange={cambiarFormulario}
                  >
                    {roles.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Carrera / Área
                  <select
                    name="id_carrera"
                    value={formulario.id_carrera}
                    onChange={cambiarFormulario}
                  >
                    <option value="">Sin carrera asignada</option>
                    {carreras.map((carrera) => (
                      <option key={carrera.id_carrera} value={carrera.id_carrera}>
                        {carrera.nombre_carrera}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estado
                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarFormulario}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </label>

                <label>
                  Contraseña
                  <input
                    type="password"
                    name="contrasena"
                    value={formulario.contrasena}
                    onChange={cambiarFormulario}
                    placeholder={modoEdicion ? "Dejar vacío para no cambiar" : "Contraseña inicial"}
                    required={!modoEdicion}
                  />
                </label>
              </div>

              <div className="usuario-form__actions">
                <button type="button" className="usuarios-btn secondary" onClick={cerrarModal}>
                  Cancelar
                </button>

                <button type="submit" className="usuarios-btn primary">
                  {modoEdicion ? "Guardar cambios" : "Registrar usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`usuario-toast ${mensaje ? "show" : ""}`}>
        {mensaje}
      </div>
    </section>
  );
}

function UsuarioMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`usuario-metric ${tipo}`}>
      <div className="usuario-metric__icon">
        <UserIcon name={icon} />
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function UserIcon({ name }) {
  const icons = {
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M4 20a5 5 0 0 1 10 0" />
        <path d="M14 20a4 4 0 0 1 7 0" />
      </>
    ),
    student: (
      <>
        <path d="M3 8l9-4 9 4-9 4-9-4Z" />
        <path d="M7 11v4c2 2 8 2 10 0v-4" />
        <path d="M21 8v6" />
      </>
    ),
    teacher: (
      <>
        <rect x="4" y="5" width="16" height="11" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </>
    ),
    admin: (
      <>
        <path d="M12 3 5 6v6c0 5 3 8 7 9 4-1 7-4 7-9V6l-7-3Z" />
        <path d="M12 10a2 2 0 1 0 0.01 0" />
        <path d="M8.5 16a4 4 0 0 1 7 0" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className="user-icon" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function getIniciales(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function getRolClass(rol) {
  if (rol === "Administrador") return "admin";
  if (rol === "Docente") return "docente";
  return "estudiante";
}

export default UsuariosSection;