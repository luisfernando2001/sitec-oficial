const API_BASE = "http://localhost:3000/api";

function obtenerUsuarioActual() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || {};
  } catch {
    return {};
  }
}

function obtenerIdCarrera(idCarreraManual = null) {
  const usuario = obtenerUsuarioActual();

  return (
    idCarreraManual ||
    usuario.id_carrera ||
    usuario.idCarrera ||
    usuario.carrera_id ||
    ""
  );
}

export async function obtenerPanelGestor(idCarreraManual = null) {
  const idCarrera = obtenerIdCarrera(idCarreraManual);

  if (!idCarrera) {
    throw new Error("No se encontró la carrera asignada al gestor");
  }

  const respuesta = await fetch(
    `${API_BASE}/gestor/panel/${idCarrera}`
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      data.mensaje ||
        data.error ||
        "Error al obtener panel del gestor"
    );
  }

  return data;
}