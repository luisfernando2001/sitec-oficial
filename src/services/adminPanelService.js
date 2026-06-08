const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(url, options = {}) {
  const respuesta = await fetch(url, options);

  const texto = await respuesta.text();

  let data = {};
  try {
    data = texto ? JSON.parse(texto) : {};
  } catch {
    data = {};
  }

  if (!respuesta.ok) {
    throw new Error(
      data.mensaje ||
        data.error ||
        texto ||
        `Error HTTP ${respuesta.status}`
    );
  }

  return data;
}

/* PANEL PRINCIPAL ADMIN */
export async function obtenerPanelAdmin() {
  return request(`${API_URL}/admin/panel`);
}

/* SOLICITUDES ADMIN */
export async function obtenerSolicitudesAdmin() {
  const data = await request(`${API_URL}/admin/solicitudes`);

  return Array.isArray(data)
    ? data
    : data.solicitudes || data.solicitudesPendientes || [];
}

export async function aprobarRecursoPanel(idSolicitud) {
  return request(`${API_URL}/admin/solicitudes/${idSolicitud}/aprobar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observacion: "Aprobado desde el panel administrativo",
      id_admin_aprobacion: null,
    }),
  });
}


export async function rechazarRecursoPanel(idSolicitud) {
  return request(`${API_URL}/admin/solicitudes/${idSolicitud}/rechazar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observacion: "Rechazado desde el panel administrativo",
      id_admin_aprobacion: null,
    }),
  });
}