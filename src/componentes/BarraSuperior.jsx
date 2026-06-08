import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BarraSuperior.css";

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch (error) {
    console.error("Error al leer usuario del localStorage:", error);
    return null;
  }
}

export default function BarraSuperior({
  rol = "Usuario",

  usuario = {
    nombre: "Usuario",
  },

  setTabActivo = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [busquedaGlobal, setBusquedaGlobal] = useState("");

  const obtenerRutaBase = () => {
    const usuarioStorage = obtenerUsuarioGuardado();
    const idRol = Number(usuarioStorage?.id_rol);

    if (location.pathname.includes("docente")) {
      return "/docente";
    }

    if (location.pathname.includes("estudiante")) {
      return "/estudiante";
    }

    if (idRol === 2) {
      return "/docente";
    }

    if (idRol === 3) {
      return "/estudiante";
    }

    return "/estudiante";
  };

  const buscarEnCatalogo = () => {
    const texto = busquedaGlobal.trim();

    setTabActivo("catalogo");

    navigate(obtenerRutaBase(), {
      state: {
        tab: "catalogo",
        busqueda: texto,
      },
    });
  };

  const limpiarBusqueda = () => {
    setBusquedaGlobal("");

    if (location.pathname.includes("docente") || location.pathname.includes("estudiante")) {
      navigate(obtenerRutaBase(), {
        state: {
          tab: "catalogo",
          busqueda: "",
        },
      });
    }
  };
  const irInicio = () => {
  setTabActivo("inicio");

  navigate(obtenerRutaBase(), {
    state: {
      tab: "inicio",
    },
  });
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      buscarEnCatalogo();
    }
  };

  return (
    <nav className="navbar">
      {/* izquierda */}
      <div className="nav-brand">
        <div className="nav-logos">
          <img
            className="nav-logo"
            src="/logo1.png"
            alt="logo"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />

          <div className="nav-sep" />

          <img
            className="nav-logo"
            src="/logo2.png"
            alt="logo"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        <div className="nav-title">
          SI<em>TEC</em>
        </div>
      </div>

      {/* centro */}
      <div className="nav-search">
        <span className="nav-search-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          type="text"
          placeholder="Buscar por título, autor, categoría o descripción..."
          value={busquedaGlobal}
          onChange={(e) => setBusquedaGlobal(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {busquedaGlobal && (
          <button
            type="button"
            className="nav-search-clear"
            onClick={limpiarBusqueda}
            aria-label="Limpiar búsqueda"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="nav-search-btn"
          onClick={buscarEnCatalogo}
          aria-label="Buscar"
        >
          <span className="nav-search-btn-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          <span className="nav-search-btn-label">
            Buscar
          </span>
        </button>
      </div>

        {/* derecha */}
        <div className="nav-right">
          <button
            type="button"
            className="nav-home-btn"
            onClick={irInicio}
            title="Volver al inicio"
          >
            <span>🏠</span>
            Inicio
          </button>

          <button
            type="button"
            className={`nav-badge ${rol === "Docente" ? "docente" : ""}`}
          >
            {rol}
        </button>

        <div className="nav-user">
          <div className="avatar">
            {usuario?.nombre?.charAt(0) || "U"}
          </div>

          <div>
            <div className="user-name">
              {usuario?.nombre || "Usuario"}
            </div>

            <div className="user-role">
  {usuario?.nombre_carrera || "Facultad de Tecnología"}
</div>

          </div>
        </div>
      </div>
    </nav>
  );
}