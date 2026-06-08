const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const BASE_URL = `${API_URL}/admin/libros`;

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

export async function obtenerLibros() {
  return request(BASE_URL);
}

export async function crearLibro(datos) {
  return request(BASE_URL, {
    method: "POST",
    body: datos,
  });
}

export async function actualizarLibro(id, datos) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: datos,
  });
}

export async function eliminarLibro(id) {
  return request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}