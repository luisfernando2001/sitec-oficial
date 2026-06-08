const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const BASE_URL = `${API_URL}/admin/materias`;

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

export async function obtenerMaterias() {
  return request(BASE_URL);
}

export async function crearMateria(datos) {
  return request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });
}

export async function actualizarMateria(id, datos) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });
}

export async function cambiarEstadoMateria(id, estado) {
  return request(`${BASE_URL}/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
}

export async function eliminarMateria(id) {
  return request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}