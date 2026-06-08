import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BarraLateral.css";

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch (error) {
    console.error("Error al leer usuario del localStorage:", error);
    return null;
  }
}

export default function BarraLateral({ tabActivo, setTabActivo, rol }) {
  const navigate = useNavigate();
  const location = useLocation();

  const usuario = obtenerUsuarioGuardado();

  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const cerrarMenuMovil = () => {
    setMenuMovilAbierto(false);
  };

  const obtenerRutaBase = () => {
    if (location.pathname.includes("docente")) {
      return "/docente";
    }

    if (location.pathname.includes("estudiante")) {
      return "/estudiante";
    }

    const idRol = Number(usuario?.id_rol);

    if (idRol === 2) {
      return "/docente";
    }

    if (idRol === 3) {
      return "/estudiante";
    }

    if (rol?.toLowerCase?.() === "docente") {
      return "/docente";
    }

    return "/estudiante";
  };

  const cerrarSesion = () => {
    cerrarMenuMovil();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const irA = (id, ruta = null) => {
    setTabActivo(id);
    cerrarMenuMovil();

    if (ruta) {
      navigate(ruta);
      return;
    }

    navigate(obtenerRutaBase(), {
      state: { tab: id },
    });
  };

  const navItem = (id, icono, label, badge = null, ruta = null) => (
    <button
      type="button"
      className={`slink ${tabActivo === id ? "active" : ""}`}
      onClick={() => irA(id, ruta)}
    >
      <span className={`sico ${icono}`} aria-hidden="true"></span>

      <span className="slabel">{label}</span>

      {badge !== null && <span className="badge-count">{badge}</span>}
    </button>
  );

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMenuMovilAbierto(true)}
        aria-label="Abrir menú"
        title="Abrir menú"
      >
        ☰
      </button>

      {menuMovilAbierto && (
        <button
          type="button"
          className="sidebar-mobile-backdrop"
          onClick={cerrarMenuMovil}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`sidebar ${menuMovilAbierto ? "sidebar-open" : ""}`}>
        <div className="sidebar-inner">
          <div className="sidebar-block">
            <div className="sidebar-section">
              <span></span>
              Navegación
            </div>

            {navItem("inicio", "ico-inicio", "Inicio")}
            {navItem("catalogo", "ico-catalogo", "Catálogo")}
            {navItem("favoritos", "ico-favoritos", "Favoritos")}
          </div>

          <div className="sidebar-block">
            <div className="sidebar-section">
              <span></span>
              Acciones
            </div>

            {navItem("solicitudes", "ico-solicitudes", "Mis solicitudes")}

            {navItem(
              "sugerir",
              "ico-sugerir",
              "Sugerir un libro",
              null,
              "/sugerir-libro"
            )}

            {navItem("historial", "ico-historial", "Historial")}
          </div>

          <div className="sidebar-block">
            <div className="sidebar-section">
              <span></span>
              Mi cuenta
            </div>

            {navItem("perfil", "ico-perfil", "Mi perfil")}
            {navItem("configuracion", "ico-configuracion", "Configuración")}

            <button
              type="button"
              className="slink slink-salir"
              onClick={cerrarSesion}
            >
              <span className="sico ico-salir" aria-hidden="true"></span>
              <span className="slabel">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}