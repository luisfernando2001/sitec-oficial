import { useEffect, useState } from "react";

import {
  obtenerPanelAdmin,
  aprobarRecursoPanel,
  rechazarRecursoPanel,
} from "../../services/adminPanelService";

import "./admin.css";

import AdminNavbar from "./layout/AdminNavbar/AdminNavbar";
import AdminSidebar from "./layout/AdminSidebar/AdminSidebar";

import PanelSection from "./sections/PanelSection/PanelSection";
import GestionLibrosSection from "./sections/GestionLibrosSection/GestionLibrosSection";
import SolicitudesSection from "./sections/SolicitudesSection/SolicitudesSection";
import UsuariosSection from "./sections/UsuariosSection/UsuariosSection";
import CategoriasSection from "./sections/CategoriasSection/CategoriasSection";
import CarrerasSection from "./sections/CarrerasSection/CarrerasSection";
import MateriasSection from "./sections/MateriasSection/MateriasSection";
import InformesSection from "./sections/InformesSection/InformesSection";
import ConfiguracionSection from "./sections/ConfiguracionSection/ConfiguracionSection";
import PerfilAdminSection from "./sections/PerfilAdminSection/PerfilAdminSection";
function Admin() {
  const [activo, setActivo] = useState("Panel");

  const [panelData, setPanelData] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2800);
  };

  const cargarPanel = async (mostrarToast = false) => {
    try {
      setError("");
      setActualizando(true);

      const data = await obtenerPanelAdmin();

      setPanelData(data);

      const solicitudesBD =
        data?.solicitudesPendientes ||
        data?.solicitudes ||
        [];

      setSolicitudes(solicitudesBD);

      if (mostrarToast) {
        mostrarMensaje("Panel actualizado correctamente");
      }
    } catch (error) {
      console.error("Error al cargar panel administrativo:", error);

      setError("No se pudo conectar con el backend administrativo.");
      mostrarMensaje("Error al conectar con el backend");
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarPanel();
  }, []);

  const actualizarPanel = () => {
    cargarPanel(true);
  };

  const cambiarModulo = (nombre) => {
    setActivo(nombre);
  };

  const aprobarSolicitud = async (solicitud) => {
    try {
      const idSolicitud =
        solicitud?.id_solicitud ||
        solicitud?.id ||
        solicitud?.idSolicitud;

      if (!idSolicitud) {
        mostrarMensaje("No se encontró el ID de la solicitud");
        return;
      }

      await aprobarRecursoPanel(idSolicitud);

      mostrarMensaje(`Solicitud aprobada: ${solicitud.titulo}`);
      await cargarPanel();
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      mostrarMensaje("No se pudo aprobar la solicitud");
    }
  };

  const rechazarSolicitud = async (solicitud) => {
    try {
      const idSolicitud =
        solicitud?.id_solicitud ||
        solicitud?.id ||
        solicitud?.idSolicitud;

      if (!idSolicitud) {
        mostrarMensaje("No se encontró el ID de la solicitud");
        return;
      }

      await rechazarRecursoPanel(idSolicitud);

      mostrarMensaje(`Solicitud rechazada: ${solicitud.titulo}`);
      await cargarPanel();
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      mostrarMensaje("No se pudo rechazar la solicitud");
    }
  };

  const solicitudesCount =
    solicitudes?.length ||
    panelData?.estadisticas?.aprobacionesPendientes ||
    panelData?.estadisticas?.solicitudesPendientes ||
    0;

  const renderContenido = () => {
    if (cargando) {
      return (
        <section className="admin-loading">
          <h2>Cargando panel administrativo...</h2>
          <p>Estamos obteniendo la información desde la base de datos.</p>
        </section>
      );
    }

    if (error) {
      return (
        <section className="admin-loading">
          <h2>No se pudo cargar el panel</h2>
          <p>{error}</p>

          <button
            type="button"
            className="btn-admin-primary"
            onClick={actualizarPanel}
          >
            Reintentar
          </button>
        </section>
      );
    }

    if (activo === "Panel") {
      return (
        <PanelSection
          solicitudes={solicitudes}
          metricas={panelData?.estadisticas}
          actividad={panelData?.actividadReciente}
          resumen={panelData?.resumenSistema}
          actualizando={actualizando}
          onRefresh={actualizarPanel}
          onNavigate={cambiarModulo}
          onAprobar={aprobarSolicitud}
          onRechazar={rechazarSolicitud}
        />
      );
    }

    if (activo === "Gestionar Libros") {
      return (
        <GestionLibrosSection
          onRefresh={actualizarPanel}
        />
      );
    }

    if (activo === "Solicitudes") {
      return (
        <SolicitudesSection
          onRefresh={actualizarPanel}
        />
      );
    }

    if (activo === "Usuarios") {
      return (
        <UsuariosSection
          onRefresh={actualizarPanel}
        />
      );
    }

    if (activo === "Categorías") {
      return (
        <CategoriasSection
          onRefresh={actualizarPanel}
        />
      );
    }

  if (activo === "Carreras") {
  return (
    <CarrerasSection
      onSelect={cambiarModulo}
      onRefresh={actualizarPanel}
    />
  );
}

    if (activo === "Materias") {
      return (
        <MateriasSection
          onRefresh={actualizarPanel}
        />
      );
    }

    if (activo === "Informes") {
      return (
        <InformesSection
          panelData={panelData}
        />
      );
    }

  
    if (activo === "Configuración") {
      return (
        <ConfiguracionSection />
      );
    }
    if (activo === "Perfil") {
      return (
        <PerfilAdminSection />
      );
    }

    if (activo === "NuevaUnidad") {
      return (
        <CarrerasSection
          abrirFormularioInicio={true}
          tipoInicio="DEPARTAMENTO"
          onSelect={cambiarModulo}
          onRefresh={actualizarPanel}
        />
      );
    }

    return (
      <section className="admin-loading">
        <h2>Módulo no encontrado</h2>
        <p>Selecciona una opción válida del menú administrativo.</p>
      </section>
    );
  };

  return (
    <div className="sitec-admin">
      <AdminNavbar
        activeModule={activo}
        onNavigate={cambiarModulo}
        solicitudesCount={solicitudesCount}
      />

      <div className="main">
        <AdminSidebar
          activeModule={activo}
          onNavigate={cambiarModulo}
          solicitudesCount={solicitudesCount}
        />

        <main className="content">
          {renderContenido()}
        </main>
      </div>

      <div className={`toast ${mensaje ? "show" : ""}`}>
        {mensaje}
      </div>
    </div>
  );
}

export default Admin;