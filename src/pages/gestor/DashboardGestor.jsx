import { useEffect, useState } from "react";
import {
  aprobarRecursoPanel,
  rechazarRecursoPanel,
} from "../../services/adminPanelService";
import {
  obtenerPanelGestor,
} from "../../services/gestorPanelService";

import "../admin/admin.css";

import GestorSidebar from "./layout/GestorSidebar";
import AdminNavbar from "../admin/layout/AdminNavbar/AdminNavbar";

import PanelGestorSection from "./sections/PanelGestorSection";
import SolicitudesSection from "../admin/sections/SolicitudesSection/SolicitudesSection";
import PerfilAdminSection from "../admin/sections/PerfilAdminSection/PerfilAdminSection";

import GestionarRecursosGestor from "./GestionarRecursosGestor";

function DashboardGestor() {
  const [activo, setActivo] = useState("Panel");

  const [panelData, setPanelData] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const usuario = JSON.parse(
    localStorage.getItem("usuario") || "{}"
  );
const idCarrera = usuario?.id_carrera;


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

    const data = await obtenerPanelGestor(
      idCarrera
    );

    setPanelData(data);

    setSolicitudes(
      data?.solicitudesPendientes || []
    );

    if (mostrarToast) {
      mostrarMensaje(
        "Panel actualizado correctamente"
      );
    }
  } catch (error) {
    console.error(error);

    setError(
      "No se pudo conectar con el backend."
    );

    mostrarMensaje(
      "Error al conectar con el backend"
    );
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
        solicitud?.id;

      await aprobarRecursoPanel(idSolicitud);

      mostrarMensaje(
        `Solicitud aprobada: ${solicitud.titulo}`
      );

      await cargarPanel();
    } catch {
      mostrarMensaje(
        "No se pudo aprobar la solicitud"
      );
    }
  };

  const rechazarSolicitud = async (solicitud) => {
    try {
      const idSolicitud =
        solicitud?.id_solicitud ||
        solicitud?.id;

      await rechazarRecursoPanel(idSolicitud);

      mostrarMensaje(
        `Solicitud rechazada: ${solicitud.titulo}`
      );

      await cargarPanel();
    } catch {
      mostrarMensaje(
        "No se pudo rechazar la solicitud"
      );
    }
  };

  const solicitudesCount =
    solicitudes?.length || 0;

  const renderContenido = () => {
    if (cargando) {
      return (
        <section className="admin-loading">
          <h2>Cargando panel gestor...</h2>
        </section>
      );
    }

    if (error) {
      return (
        <section className="admin-loading">
          <h2>Error</h2>

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
        <PanelGestorSection
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
if (activo === "GestionLibros") {
  return <GestionarRecursosGestor onRefresh={actualizarPanel} />;
}

if (activo === "Solicitudes") {
  return (
    <SolicitudesSection
      modo="gestor"
      idCarrera={idCarrera}
      onRefresh={actualizarPanel}
    />
  );
}


    if (activo === "Perfil") {
      return (
        <PerfilAdminSection />
      );
    }

    return (
      <section className="admin-loading">
        <h2>Módulo no disponible</h2>
      </section>
    );
  };

  return (
    <div className="sitec-admin">
      <AdminNavbar
  seccionActiva={activo}
  onNavigate={cambiarModulo}
/>

      <div className="main">
        <GestorSidebar
  activeModule={activo}
  onNavigate={cambiarModulo}
  solicitudesCount={solicitudesCount}
/>

        <main className="content">
          {renderContenido()}
        </main>
      </div>

      <div
        className={`toast ${
          mensaje ? "show" : ""
        }`}
      >
        {mensaje}
      </div>
    </div>
  );
}

export default DashboardGestor;