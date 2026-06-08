const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

export async function obtenerUsuarios() {
  return request(`${API_URL}/admin/usuarios`);
}

export async function crearUsuario(usuario) {
  return request(`${API_URL}/admin/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario),
  });
}

export async function actualizarUsuario(id, usuario) {
  return request(`${API_URL}/admin/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario),
  });
}

export async function cambiarEstadoUsuario(id, estado) {
  return request(`${API_URL}/admin/usuarios/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
}

export async function eliminarUsuario(id) {
  return request(`${API_URL}/admin/usuarios/${id}`, {
    method: "DELETE",
  });
}