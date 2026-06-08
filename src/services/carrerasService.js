const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BASE_URL = `${API_URL}/admin/carreras`;

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

export async function obtenerCarreras() {
  const data = await request(BASE_URL);

  return Array.isArray(data)
    ? data
    : data.carreras || data.data || [];
}

export async function crearCarrera(carrera) {
  return request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(carrera),
  });
}

export async function actualizarCarrera(id, carrera) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(carrera),
  });
}

export async function cambiarEstadoCarrera(id, estado) {
  return request(`${BASE_URL}/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
}

export async function eliminarCarrera(id) {
  return request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}