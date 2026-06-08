import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// estilos
import "../styles/variables.css";
import "../styles/DashboardEstDoc.css";

// componentes
import BarraSuperior from "../componentes/BarraSuperior";
import BarraLateral from "../componentes/BarraLateral";
import Footer from "../componentes/Footer";

// vistas
import VistaInicio from "../componentes/VistaInicio";
import VistaCatalogo from "../componentes/VistaCatalogo";
import VistaSolicitudes from "../componentes/VistaSolicitudes";
import VistaFavoritos from "../componentes/VistaFavoritos";
import VistaPerfil from "../componentes/VistaPerfil";
import VistaConfiguracion from "../componentes/VistaConfiguracion";
import AsistenteIA from "../componentes/AsistenteIA";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function obtenerUsuarioGuardado() {
  try {
    const usuarioStorage = localStorage.getItem("usuario");
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
  } catch (error) {
    console.error("Error al leer usuario del localStorage:", error);
    return null;
  }
}

function obtenerRolTexto(usuario, tipoUsuario, pathname) {
  const idRol = Number(usuario?.id_rol);

  if (idRol === 1) return "Administrador";
  if (idRol === 2) return "Docente";
  if (idRol === 3) return "Estudiante";

  if (tipoUsuario === "docente") return "Docente";
  if (tipoUsuario === "estudiante") return "Estudiante";

  if (pathname.includes("docente")) return "Docente";
  if (pathname.includes("estudiante")) return "Estudiante";

  const rolTexto =
    usuario?.rol ||
    usuario?.nombre_rol ||
    usuario?.rolSeleccionado ||
    usuario?.tipoUsuario ||
    "Usuario";

  return rolTexto;
}

export default function DashboardEstDoc({ tipoUsuario = "" }) {
  const location = useLocation();

  const usuarioGuardado = obtenerUsuarioGuardado();
  const rolTexto = obtenerRolTexto(
    usuarioGuardado,
    tipoUsuario,
    location.pathname
  );

  const USUARIO = {
  id_usuario: usuarioGuardado?.id_usuario || usuarioGuardado?.id || null,
  nombre: usuarioGuardado?.nombre || rolTexto,
  apellido: usuarioGuardado?.apellido || "",
  correo: usuarioGuardado?.correo || "usuario@umsa.edu.bo",
  rol: rolTexto,
  id_rol: usuarioGuardado?.id_rol || null,
  carrera: usuarioGuardado?.nombre_carrera || "Facultad de Tecnología",
  nombre_carrera: usuarioGuardado?.nombre_carrera || "Facultad de Tecnología", // ← agrega esto
};

  const [tabActivo, setTabActivo] = useState(
    location.state?.tab || "inicio"
  );

  useEffect(() => {
  if (location.state?.tab) {
    setTabActivo(location.state.tab);
  }
}, [location.state]);
  const [rol, setRol] = useState(rolTexto);

  const [estadisticas, setEstadisticas] = useState({
    recursos: 0,
    descargas: 0,
    solicitudes: 0,
    favoritos: 0,
  });

  useEffect(() => {
    setRol(rolTexto);
  }, [rolTexto]);

  useEffect(() => {
    fetch(`${API_URL}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        setEstadisticas({
          recursos: data.recursos || 0,
          descargas: data.descargas || 0,
          solicitudes: data.solicitudes || 0,
          favoritos: data.favoritos || 0,
        });
      })
      .catch((error) => {
        console.error("Error al cargar estadísticas:", error);
      });
  }, []);

  const renderVista = () => {
    switch (tabActivo) {
      case "inicio":
        return (
          <VistaInicio
            usuario={USUARIO}
            rol={rol}
            tipoUsuario={tipoUsuario}
            setTabActivo={setTabActivo}
            estadisticas={estadisticas}
          />
        );

      case "catalogo":
        return <VistaCatalogo usuario={USUARIO} rol={rol} />;

      case "solicitudes":
        return <VistaSolicitudes usuario={USUARIO} rol={rol} />;

      case "favoritos":
        return <VistaFavoritos usuario={USUARIO} rol={rol} />;

      case "perfil":
        return (
          <VistaPerfil
            usuario={USUARIO}
            rol={rol}
            estadisticas={estadisticas}
            setTabActivo={setTabActivo}
          />
        );

      case "configuracion":
        return (
          <VistaConfiguracion
            usuario={USUARIO}
            rol={rol}
            setTabActivo={setTabActivo}
          />
        );

      default:
        return (
          <VistaInicio
            usuario={USUARIO}
            rol={rol}
            tipoUsuario={tipoUsuario}
            setTabActivo={setTabActivo}
            estadisticas={estadisticas}
          />
        );
    }
  };

  return (
    <div className="sitec-wrap">
      <BarraSuperior
        tabActivo={tabActivo}
        setTabActivo={setTabActivo}
        rol={rol}
        usuario={USUARIO}
      />

      <div className="sitec-body">
        <BarraLateral
          tabActivo={tabActivo}
          setTabActivo={setTabActivo}
          rol={rol}
          usuario={USUARIO}
        />
        <AsistenteIA />
        <main className="sitec-content">
          {renderVista()}
          <Footer />
        </main>
      </div>
    </div>
  );
}