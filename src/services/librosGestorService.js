const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BASE_URL = `${API_URL}/gestor/libros`;

function obtenerUsuarioActual() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
}

function obtenerIdCarreraGestor(idCarreraManual = null) {
  const usuario = obtenerUsuarioActual();

  return (
    idCarreraManual ||
    usuario.id_carrera ||
    usuario.idCarrera ||
    usuario.carrera_id ||
    ""
  );
}

function obtenerIdUsuarioGestor() {
  const usuario = obtenerUsuarioActual();

  return (
    usuario.id_usuario ||
    usuario.id ||
    usuario.idUsuario ||
    ""
  );
}

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

export async function obtenerLibrosGestor(idCarreraManual = null) {
  const idCarrera = obtenerIdCarreraGestor(idCarreraManual);

  if (!idCarrera) {
    throw new Error("No se encontró la carrera asignada al gestor");
  }

  return request(`${BASE_URL}/${idCarrera}`);
}

export async function crearLibroGestor(datos) {
  const idCarrera = obtenerIdCarreraGestor();
  const idUsuario = obtenerIdUsuarioGestor();

  if (!idCarrera) {
    throw new Error("No se encontró la carrera asignada al gestor");
  }

  if (datos instanceof FormData) {
    if (!datos.has("id_carrera")) {
      datos.append("id_carrera", idCarrera);
    }

    if (idUsuario && !datos.has("id_usuario_subida")) {
      datos.append("id_usuario_subida", idUsuario);
    }

    return request(BASE_URL, {
      method: "POST",
      body: datos,
    });
  }

  return request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...datos,
      id_carrera: datos?.id_carrera || idCarrera,
      id_usuario_subida: datos?.id_usuario_subida || idUsuario || null,
    }),
  });
}

export async function actualizarLibroGestor(id, datos) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: datos,
  });
}