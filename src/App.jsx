import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import DashboardEstDoc from "./pages/DashboardEstDoc.jsx";
import MisSolicitudes from "./pages/MisSolicitudes.jsx";
import SugerirLibro from "./pages/SugerirLibro.jsx";

import VistaCatalogo from "./componentes/VistaCatalogo.jsx";
import VistaFavoritos from "./componentes/VistaFavoritos.jsx";
import VistaSolicitudes from "./componentes/VistaSolicitudes.jsx";
import DetalleRecurso from "./componentes/DetalleRecurso.jsx";
import Admin from "./pages/admin/admin.jsx";

import DashboardGestor from "./pages/gestor/DashboardGestor.jsx";
import GestionarRecursosGestor from "./pages/gestor/GestionarRecursosGestor.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Rutas separadas por rol */}
        <Route
          path="/estudiante"
          element={<DashboardEstDoc tipoUsuario="estudiante" />}
        />

        <Route
          path="/docente"
          element={<DashboardEstDoc tipoUsuario="docente" />}
        />

        {/* Ruta antigua, por si algún botón todavía manda a /dashboard */}
        <Route
          path="/dashboard"
          element={<DashboardEstDoc />}
        />

        {/* Rutas estudiante/docente */}
        <Route path="/catalogo" element={<VistaCatalogo />} />

        <Route path="/recurso/:id" element={<DetalleRecurso />} />

        <Route path="/favoritos" element={<VistaFavoritos />} />

        <Route path="/mis-solicitudes" element={<MisSolicitudes />} />

        <Route path="/sugerir-libro" element={<SugerirLibro />} />

        <Route path="/historial" element={<VistaSolicitudes />} />

        <Route
          path="/perfil"
          element={<DashboardEstDoc />}
        />

        <Route
          path="/configuracion"
          element={<DashboardEstDoc />}
        />

        {/* Administrador */}
        <Route path="/admin" element={<Admin />} />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />

        <Route
  path="/gestor"
  element={<DashboardGestor />}
/>
<Route
  path="/gestorRecursos"
  element={<GestionarRecursosGestor />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;