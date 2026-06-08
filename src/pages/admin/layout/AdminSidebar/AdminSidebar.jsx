import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const sidebarGroups = [
  {
    title: "Principal",
    items: [
      {
        label: "Panel",
        value: "Panel",
        icon: "panel",
      },
      {
        label: "Gestionar Recursos",
        value: "Gestionar Libros",
        icon: "books",
      },
      {
        label: "Solicitudes",
        value: "Solicitudes",
        icon: "requests",
      },
      {
        label: "Usuarios",
        value: "Usuarios",
        icon: "users",
        counter: "usuarios",
      },
    ],
  },
  {
    title: "Catálogo",
    items: [
      {
        label: "Categorías",
        value: "Categorías",
        icon: "categories",
      },
      {
        label: "Materias",
        value: "Materias",
        icon: "subjects",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        label: "Informes",
        value: "Informes",
        icon: "reports",
      },
      {
        label: "Configuración",
        value: "Configuración",
        icon: "settings",
      },
      {
        label: "Perfil",
        value: "Perfil",
        icon: "users",
      },
    ],
  },
];

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch {
    return null;
  }
}

function obtenerNombre(usuario) {
  if (!usuario) return "Administrador SITEC";

  const nombreCompleto = `${usuario.nombre || ""} ${
    usuario.apellido || ""
  }`.trim();

  return nombreCompleto || usuario.nombre_usuario || "Administrador SITEC";
}

function obtenerCorreo(usuario) {
  return usuario?.correo || "admin.sitec@umsa.bo";
}

function obtenerInicial(nombre) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() || "A";
}

function AdminSidebar({
  activeModule,
  onNavigate,
  solicitudesCount = 0,
  usuariosCount = 0,
  notificacionesCount = 0,
}) {
  const navigate = useNavigate();

  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const usuario = obtenerUsuarioGuardado();
  const nombreUsuario = obtenerNombre(usuario);
  const correoUsuario = obtenerCorreo(usuario);
  const inicial = obtenerInicial(nombreUsuario);

  const cerrarMenuMovil = () => {
    setMenuMovilAbierto(false);
  };

  const navegarModulo = (modulo) => {
    onNavigate(modulo);
    cerrarMenuMovil();
  };

  const cerrarSesion = () => {
    cerrarMenuMovil();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const obtenerContador = (item) => {
    if (item.counter === "solicitudes") {
      return solicitudesCount;
    }

    if (item.counter === "usuarios") {
      return usuariosCount;
    }

    if (item.counter === "notificaciones") {
      return notificacionesCount;
    }

    return null;
  };

  return (
    <>
      <button
        type="button"
        className="admin-sidebar-mobile-toggle"
        onClick={() => setMenuMovilAbierto(true)}
        aria-label="Abrir menú"
        title="Abrir menú"
      >
        ☰
      </button>

      {menuMovilAbierto && (
        <button
          type="button"
          className="admin-sidebar-mobile-backdrop"
          onClick={cerrarMenuMovil}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`admin-sidebar ${
          menuMovilAbierto ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-sidebar__content">
          {sidebarGroups.map((group) => (
            <div className="admin-sidebar__group" key={group.title}>
              <p className="admin-sidebar__title">{group.title}</p>

              <div className="admin-sidebar__items">
                {group.items.map((item) => {
                  const isActive = activeModule === item.value;
                  const contador = obtenerContador(item);

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`admin-sidebar__item ${
                        isActive ? "active" : ""
                      }`}
                      onClick={() => navegarModulo(item.value)}
                    >
                      <span
                        className={`admin-sidebar__icon icon-${item.icon}`}
                      ></span>

                      <span className="admin-sidebar__label">
                        {item.label}
                      </span>

                      {contador !== null && contador > 0 && (
                        <span
                          className={`admin-sidebar__counter ${
                            item.danger ? "danger" : "warning"
                          }`}
                        >
                          {contador}
                        </span>
                      )}
                    </button>
                  );
                })}

                {group.title === "Catálogo" && (
                  <div className="admin-sidebar__submenu-wrap">
                    <button
                      type="button"
                      className={`admin-sidebar__item ${
                        submenuAbierto ? "active" : ""
                      }`}
                      onClick={() => setSubmenuAbierto(!submenuAbierto)}
                    >
                      <span className="admin-sidebar__icon icon-careers"></span>

                      <span className="admin-sidebar__label">
                        Unidades Académicas
                      </span>

                      <span
                        className={`admin-sidebar__arrow ${
                          submenuAbierto ? "open" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </button>

                    {submenuAbierto && (
                      <div className="admin-sidebar__submenu">
                        <button
                          type="button"
                          className={`admin-sidebar__item admin-sidebar__subitem ${
                            activeModule === "Carreras" ? "active" : ""
                          }`}
                          onClick={() => navegarModulo("Carreras")}
                        >
                          <span className="admin-sidebar__icon icon-careers"></span>

                          <span className="admin-sidebar__label">
                            Carreras
                          </span>
                        </button>

                        <button
                          type="button"
                          className="admin-sidebar__item admin-sidebar__subitem"
                          onClick={() => navegarModulo("NuevaUnidad")}
                        >
                          <span className="admin-sidebar__icon icon-panel"></span>

                          <span className="admin-sidebar__label">
                            + Añadir Unidad
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="admin-sidebar__footer">
            <button
              type="button"
              className="admin-sidebar__logout"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;