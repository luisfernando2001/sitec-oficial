const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const BASE_URL = `${API_URL}/admin/solicitudes`;

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

export async function obtenerSolicitudes() {
  return request(BASE_URL);
}

export async function aprobarSolicitudBackend(idSolicitud) {
  return request(`${BASE_URL}/${idSolicitud}/aprobar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observacion: "Aprobado desde el módulo de solicitudes",
      id_admin_aprobacion: null,
    }),
  });
}

export async function rechazarSolicitudBackend(idSolicitud) {
  return request(`${BASE_URL}/${idSolicitud}/rechazar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observacion: "Rechazado desde el módulo de solicitudes",
      id_admin_aprobacion: null,
    }),
  });
}