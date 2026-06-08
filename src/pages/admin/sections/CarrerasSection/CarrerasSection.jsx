import { useEffect, useState } from "react";

import {
  obtenerCarreras,
  crearCarrera,
  actualizarCarrera,
  cambiarEstadoCarrera,
  eliminarCarrera,
} from "../../../../services/carrerasService";

import "./CarrerasSection.css";

function normalizarCarrera(carrera) {
  const tipo = carrera.tipo || carrera.tipo_carrera || "CARRERA";

  return {
    id: carrera.id_carrera || carrera.id,
    id_carrera: carrera.id_carrera || carrera.id,
    sigla: carrera.sigla || "S/S",
    nombre: carrera.nombre_carrera || carrera.nombre || "Sin nombre",
    tipo,
    descripcion: carrera.descripcion || "Sin descripción registrada.",
    estado:
      Number(carrera.estado) === 1 ||
      carrera.estado === "Activa" ||
      carrera.estado === "ACTIVA"
        ? "Activa"
        : "Inactiva",
    estadoValor:
      Number(carrera.estado) === 1 ||
      carrera.estado === "Activa" ||
      carrera.estado === "ACTIVA"
        ? 1
        : 0,
    semestres:
      carrera.semestres ||
      carrera.total_semestres ||
      carrera.cantidad_semestres ||
      0,
    total_materias:
      carrera.total_materias ||
      carrera.materias ||
      carrera.cantidad_materias ||
      0,
    especial:
      tipo === "DEPARTAMENTO" ||
      carrera.especial === true,
    areas:
      Array.isArray(carrera.areas)
        ? carrera.areas
        : carrera.areas
          ? String(carrera.areas).split(",")
          : [],
  };
}

function CarreraCard({
  carrera,
  onSelect,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) {
  const esDepartamento =
    carrera.especial ||
    carrera.tipo === "DEPARTAMENTO";

  return (
    <article
      className={`carrera-card ${
        esDepartamento ? "carrera-especial" : ""
      }`}
    >
      <div className="carrera-top">
        <div className="carrera-sigla">
          {carrera.sigla}
        </div>

        <span
          className={`carrera-tipo ${
            esDepartamento ? "tipo-departamento" : ""
          }`}
        >
          {esDepartamento ? "Departamento" : "Carrera"}
        </span>
      </div>

      <h3 className="carrera-nombre">
        {carrera.nombre}
      </h3>

      <p className="carrera-desc">
        {carrera.descripcion}
      </p>

      {esDepartamento ? (
        <div className="areas-list">
          {carrera.areas?.length ? (
            carrera.areas.map((area) => (
              <span key={area}>
                {area}
              </span>
            ))
          ) : (
            <span>
              Sin áreas registradas
            </span>
          )}
        </div>
      ) : (
        <div className="carrera-info">
          <span>
            {carrera.semestres || 0} semestres
          </span>

          <span>
            {carrera.total_materias || 0} materias
          </span>
        </div>
      )}

      <div className="carrera-info">
        <span
          className={
            carrera.estado === "Activa"
              ? "estado-activo"
              : "estado-inactivo"
          }
        >
          {carrera.estado}
        </span>
      </div>

      <div className="carrera-actions">
        <button
          type="button"
          onClick={() => onSelect("Materias")}
        >
          Ver materias
        </button>

        <button
          type="button"
          className="secondary"
          onClick={() => onEditar(carrera)}
        >
          Editar
        </button>
      </div>

      <div className="carrera-actions carrera-actions-extra">
        <button
          type="button"
          className="secondary"
          onClick={() => onCambiarEstado(carrera)}
        >
          {carrera.estado === "Activa"
            ? "Desactivar"
            : "Activar"}
        </button>

        <button
          type="button"
          className="danger"
          onClick={() => onEliminar(carrera)}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default function CarrerasSection({ onSelect = () => {}, abrirFormularioInicio = false, tipoInicio = "CARRERA" }) {  
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    nombre_carrera: "",
    sigla: "",
    tipo: "CARRERA",
    descripcion: "",
    estado: 1,
  });

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2600);
  };

  const cargarCarreras = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await obtenerCarreras();

      const lista = data.map(normalizarCarrera);

      setCarreras(lista);
    } catch (error) {
      console.error("Error al cargar carreras:", error);
      setError("No se pudieron cargar las carreras desde la base de datos.");
      setCarreras([]);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  cargarCarreras();
}, []);

useEffect(() => {
  if (abrirFormularioInicio === true) {
    setMostrarFormulario(true);
    setForm(prev => ({ ...prev, tipo: tipoInicio }));
  }
}, [abrirFormularioInicio, tipoInicio]);

  const limpiarFormulario = () => {
    setForm({
      nombre_carrera: "",
      sigla: "",
      tipo: "CARRERA",
      descripcion: "",
      estado: 1,
    });

    setEditando(null);
    setMostrarFormulario(false);
  };

  const abrirNuevo = () => {
    setEditando(null);

    setForm({
      nombre_carrera: "",
      sigla: "",
      tipo: "CARRERA",
      descripcion: "",
      estado: 1,
    });

    setMostrarFormulario(true);
  };

  const abrirEditar = (carrera) => {
    setEditando(carrera);

    setForm({
      nombre_carrera: carrera.nombre || "",
      sigla: carrera.sigla || "",
      tipo: carrera.tipo || "CARRERA",
      descripcion: carrera.descripcion || "",
      estado: carrera.estadoValor || 1,
    });

    setMostrarFormulario(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarCarrera = async (e) => {
    e.preventDefault();

    if (!form.nombre_carrera.trim()) {
      mostrarMensaje("El nombre de la carrera es obligatorio");
      return;
    }

    if (!form.sigla.trim()) {
      mostrarMensaje("La sigla es obligatoria");
      return;
    }

    try {
      const payload = {
        nombre_carrera: form.nombre_carrera.trim(),
        sigla: form.sigla.trim(),
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        estado: Number(form.estado),
      };

      if (editando) {
        await actualizarCarrera(editando.id_carrera, payload);
        mostrarMensaje("Carrera actualizada correctamente");
      } else {
        await crearCarrera(payload);
        mostrarMensaje("Carrera registrada correctamente");
      }

      limpiarFormulario();
      await cargarCarreras();
    } catch (error) {
      console.error("Error al guardar carrera:", error);
      mostrarMensaje("No se pudo guardar la carrera");
    }
  };

  const cambiarEstado = async (carrera) => {
    const nuevoEstado =
      carrera.estado === "Activa" ? 0 : 1;

    try {
      await cambiarEstadoCarrera(carrera.id_carrera, nuevoEstado);

      mostrarMensaje(
        nuevoEstado === 1
          ? "Carrera activada correctamente"
          : "Carrera desactivada correctamente"
      );

      await cargarCarreras();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      mostrarMensaje("No se pudo cambiar el estado de la carrera");
    }
  };

  const eliminar = async (carrera) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${carrera.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await eliminarCarrera(carrera.id_carrera);

      mostrarMensaje("Carrera eliminada correctamente");
      await cargarCarreras();
    } catch (error) {
      console.error("Error al eliminar carrera:", error);
      mostrarMensaje("No se pudo eliminar la carrera. Puede tener materias asociadas.");
    }
  };

  return (
    <section className="admin-section carreras-section">
      <div className="section-head carreras-head">
  <div className="carreras-head__content">
    <span className="section-kicker">
      Catálogo académico
    </span>

   <h2 className="section-title">
  {abrirFormularioInicio && tipoInicio === "DEPARTAMENTO" ? "Nueva Unidad Académica" : "Carreras"}
</h2>

    <p className="section-sub">
      Administración de carreras y departamentos registrados en SITEC.
    </p>
  </div>

  <button
    type="button"
    className="primary-action"
    onClick={abrirNuevo}
  >
    Nueva carrera
  </button>
</div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          className="carrera-form"
          onSubmit={guardarCarrera}
        >
          <div className="form-grid">
            <div className="form-field">
              <label>
                Nombre
              </label>

              <input
                type="text"
                name="nombre_carrera"
                value={form.nombre_carrera}
                onChange={handleChange}
                placeholder="Ej: Informática Industrial"
              />
            </div>

            <div className="form-field">
              <label>
                Sigla
              </label>

              <input
                type="text"
                name="sigla"
                value={form.sigla}
                onChange={handleChange}
                placeholder="Ej: INF"
              />
            </div>

            <div className="form-field">
              <label>
                Tipo
              </label>

              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="CARRERA">
                  Carrera
                </option>

                <option value="DEPARTAMENTO">
                  Departamento
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Estado
              </label>

              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                <option value={1}>
                  Activa
                </option>

                <option value={0}>
                  Inactiva
                </option>
              </select>
            </div>

            <div className="form-field form-full">
              <label>
                Descripción
              </label>

              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Descripción breve de la carrera o departamento"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
            >
{editando ? "Guardar cambios" : tipoInicio === "DEPARTAMENTO" ? "Registrar Unidad" : "Registrar carrera"}            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={limpiarFormulario}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="admin-empty">
          Cargando carreras...
        </div>
      ) : error ? (
        <div className="admin-empty">
          <p>{error}</p>

          <button
            type="button"
            className="btn-primary"
            onClick={cargarCarreras}
          >
            Reintentar
          </button>
        </div>
      ) : carreras.length === 0 ? (
        <div className="admin-empty">
          No hay carreras registradas
        </div>
        ) : abrirFormularioInicio ? null : (
        <div className="carreras-grid">
          {carreras.map((carrera) => (
            <CarreraCard
              key={carrera.id_carrera}
              carrera={carrera}
              onSelect={onSelect}
              onEditar={abrirEditar}
              onCambiarEstado={cambiarEstado}
              onEliminar={eliminar}
            />
          ))}
        </div>
      )}
    </section>
  );
}