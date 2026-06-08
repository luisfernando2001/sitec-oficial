import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../admin/layout/AdminSidebar/AdminSidebar.css";

const sidebarGroups = [
  {
    title: "Principal",
    items: [
      { label: "Panel", value: "Panel", icon: "panel" },
      { label: "Gestionar Recursos", value: "GestionLibros", icon: "books" },
      { label: "Solicitudes", value: "Solicitudes", icon: "requests" },
      { label: "Usuarios", value: "Usuarios", icon: "users" },
    ],
  },
  {
    title: "Mi cuenta",
    items: [
      { label: "Perfil", value: "Perfil", icon: "users" },
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
  if (!usuario) return "Gestor SITEC";

  const nombreCompleto = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

  return nombreCompleto || usuario.nombre_usuario || "Gestor SITEC";
}

function obtenerCorreo(usuario) {
  return usuario?.correo || "gestor.sitec@umsa.bo";
}

function obtenerInicial(nombre) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() || "G";
}

function GestorSidebar({ activeModule, onNavigate, solicitudesCount = 0 }) {
  const navigate = useNavigate();

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
                  const mostrarBadge =
                    item.value === "Solicitudes" && solicitudesCount > 0;

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

                      {mostrarBadge && (
                        <span className="admin-sidebar__counter warning">
                          {solicitudesCount}
                        </span>
                      )}
                    </button>
                  );
                })}
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

export default GestorSidebar;