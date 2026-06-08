import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminNavbar.css";

const BACKEND_URL = "http://localhost:4000";

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch (error) {
    console.error("Error al leer usuario administrador:", error);
    return null;
  }
}

function obtenerNombreUsuario(usuario) {
  if (!usuario) return "Administrador SITEC";

  const nombreCompleto = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

  return (
    nombreCompleto ||
    usuario.nombre_usuario ||
    usuario.usuario ||
    "Administrador SITEC"
  );
}

function obtenerRolUsuario(usuario) {
  return usuario?.rol || usuario?.nombre_rol || "Administrador";
}

function obtenerCorreoUsuario(usuario) {
  return usuario?.correo || "admin.sitec@fatec.edu.bo";
}

function obtenerInicial(nombre) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() || "A";
}

function obtenerFotoPerfil(usuario) {
  const foto = usuario?.foto_perfil;

  if (!foto) return "";

  if (foto.startsWith("http")) {
    return foto;
  }

  return `${BACKEND_URL}/${foto}`;
}

function AdminNavbar({ onNavigate }) {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(obtenerUsuarioGuardado());
  const [versionFoto, setVersionFoto] = useState(Date.now());

  useEffect(() => {
    const actualizarUsuario = (event) => {
      const usuarioActualizado = event?.detail || obtenerUsuarioGuardado();

      setUsuario(usuarioActualizado);
      setVersionFoto(Date.now());
    };

    window.addEventListener("usuarioActualizado", actualizarUsuario);
    window.addEventListener("storage", actualizarUsuario);

    return () => {
      window.removeEventListener("usuarioActualizado", actualizarUsuario);
      window.removeEventListener("storage", actualizarUsuario);
    };
  }, []);

  const nombreUsuario = obtenerNombreUsuario(usuario);
  const rolUsuario = obtenerRolUsuario(usuario);
  const correoUsuario = obtenerCorreoUsuario(usuario);
  const inicial = obtenerInicial(nombreUsuario);

  const fotoPerfil = obtenerFotoPerfil(usuario);
  const fotoPerfilConVersion = fotoPerfil
    ? `${fotoPerfil}?v=${versionFoto}`
    : "";

  const cerrarSesion = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const abrirPerfil = () => {
    if (onNavigate) {
      onNavigate("Perfil");
    }
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar__brand">
        <div className="admin-navbar__logos">
          <div className="admin-navbar__logo-card">
            <img src="/src/assets/logo_umsa.png" alt="Logo UMSA" />
          </div>

          <div className="admin-navbar__logo-card">
            <img
              src="/src/assets/logo_tecnologia.png"
              alt="Logo Facultad de Tecnología"
            />
          </div>
        </div>

        <div className="admin-navbar__system">
          <h1>SITEC</h1>
          <span>Biblioteca Digital</span>
        </div>
      </div>

      <div className="admin-navbar__spacer"></div>

      <div className="admin-navbar__right">
        <span className="admin-navbar__badge">
          {rolUsuario}
        </span>

        <button
          type="button"
          className="admin-navbar__user"
          onClick={abrirPerfil}
        >
          <div className="admin-navbar__avatar">
            {fotoPerfilConVersion ? (
              <img
                src={fotoPerfilConVersion}
                alt="Foto de perfil"
                className="admin-navbar__avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              inicial
            )}
          </div>

          <div>
            <p className="admin-navbar__user-name">
              {nombreUsuario}
            </p>

            <p className="admin-navbar__user-role">
              {correoUsuario}
            </p>
          </div>
        </button>

        <button
          type="button"
          className="admin-navbar__logout"
          onClick={cerrarSesion}
        >
          Salir
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;