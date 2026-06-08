const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function obtenerUsuarioActual() {
  try {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  } catch (error) {
    console.error("Error leyendo usuario:", error);
    return null;
  }
}

async function request(endpoint, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(opciones.headers || {}),
    },
    ...opciones,
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.mensaje || "Error en la petición");
  }

  return data;
}
/* PERFIL */
export function obtenerPerfil(idUsuario) {
  return request(`/perfil/${idUsuario}`);
}

export function obtenerResumenPerfil(idUsuario) {
  return request(`/perfil/${idUsuario}/resumen`);
}

export function obtenerDetallePerfil(idUsuario, tipo) {
  return request(`/perfil/${idUsuario}/detalle/${tipo}`);
}

export function actualizarPerfil(idUsuario, datos) {
  return request(`/perfil/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

/* CONFIGURACIÓN */
export function obtenerConfiguracion(idUsuario) {
  return request(`/configuracion/${idUsuario}`);
}

export function actualizarConfiguracion(idUsuario, datos) {
  return request(`/configuracion/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export function cambiarPasswordUsuario(idUsuario, datos) {
  return request(`/configuracion/${idUsuario}/password`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

/* FAVORITOS */
export function obtenerFavoritos(idUsuario) {
  // 🔧 BUG 1 CORREGIDO: El backend devuelve { ok: true, favoritos: [...] }
  // Extraemos el array de favoritos de la respuesta
  return request(`/favoritos/${idUsuario}`).then(data => {
    if (data.ok && Array.isArray(data.favoritos)) {
      return data.favoritos;
    }
    // Fallback por si la respuesta es directamente el array
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  });
}

// 🔧 NUEVA FUNCIÓN para el Bug 3 - Verificar un favorito específico sin cargar toda la lista
export function verificarFavorito(idUsuario, idRecurso) {
  return request(`/favoritos/${idUsuario}/${idRecurso}`).then(data => {
    if (data.ok) {
      return data.esFavorito === true;
    }
    return false;
  });
}

export function agregarFavorito(idUsuario, idRecurso) {
  return request("/favoritos", {
    method: "POST",
    body: JSON.stringify({
      id_usuario: idUsuario,
      id_recurso: idRecurso,
    }),
  });
}

export function quitarFavorito(idUsuario, idRecurso) {
  return request(`/favoritos/${idUsuario}/${idRecurso}`, {
    method: "DELETE",
  });
}