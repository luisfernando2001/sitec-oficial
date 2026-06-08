import { useEffect, useMemo, useState } from "react";
import "./CategoriasSection.css";

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
} from "../../../../services/categoriasService";

const formularioInicial = {
  codigo: "",
  nombre: "",
  tipo: "",
  area: "",
  estado: "Activa",
  descripcion: "",
};

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function CategoriasSection() {
  const [categorias, setCategorias] = useState([]);
  const [metricas, setMetricas] = useState({
    totalCategorias: 0,
    activas: 0,
    basicas: 0,
    recursosTotales: 0,
  });

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarCategorias = async () => {
    try {
      setCargando(true);

      const data = await obtenerCategorias();

      setCategorias(data.categorias || []);
      setMetricas(data.metricas || {});
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar categorías desde el backend");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2600);
  };

  const tiposDisponibles = useMemo(() => {
    const tipos = categorias
      .map((categoria) => categoria.tipo)
      .filter(Boolean);

    return [...new Set(tipos)].sort();
  }, [categorias]);

  const categoriasFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda);

    return categorias.filter((categoria) => {
      const textoCategoria = normalizarTexto(`
        ${categoria.codigo || ""}
        ${categoria.nombre || ""}
        ${categoria.tipo || ""}
        ${categoria.area || ""}
        ${categoria.descripcion || ""}
        ${categoria.estado || ""}
      `);

      const coincideBusqueda =
        !busquedaNormalizada ||
        textoCategoria.includes(busquedaNormalizada);

      const coincideTipo =
        filtroTipo === "Todas" || categoria.tipo === filtroTipo;

      const coincideEstado =
        filtroEstado === "Todas" || categoria.estado === filtroEstado;

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }, [categorias, busqueda, filtroTipo, filtroEstado]);

  const hayFiltrosActivos =
    busqueda || filtroTipo !== "Todas" || filtroEstado !== "Todas";

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todas");
    setFiltroEstado("Todas");
  };

  const abrirNueva = () => {
    setModoEdicion(false);
    setCategoriaEditando(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (categoria) => {
    setModoEdicion(true);
    setCategoriaEditando(categoria);

    setFormulario({
      codigo: categoria.codigo || "",
      nombre: categoria.nombre || "",
      tipo: categoria.tipo || "Académica",
      area: categoria.area || "",
      estado: categoria.estado || "Activa",
      descripcion: categoria.descripcion || "",
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setCategoriaEditando(null);
    setFormulario(formularioInicial);
  };

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();

    try {
      if (modoEdicion && categoriaEditando) {
        await actualizarCategoria(categoriaEditando.id, formulario);
        mostrarMensaje("Categoría actualizada correctamente");
      } else {
        await crearCategoria(formulario);
        mostrarMensaje("Categoría registrada correctamente");
      }

      cerrarModal();
      await cargarCategorias();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo guardar la categoría");
    }
  };

  const cambiarEstado = async (categoria) => {
    const nuevoEstado =
      categoria.estado === "Activa" ? "Inactiva" : "Activa";

    try {
      await cambiarEstadoCategoria(categoria.id, nuevoEstado);
      mostrarMensaje(`Categoría ${nuevoEstado.toLowerCase()} correctamente`);

      if (categoriaSeleccionada?.id === categoria.id) {
        setCategoriaSeleccionada({
          ...categoriaSeleccionada,
          estado: nuevoEstado,
        });
      }

      await cargarCategorias();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo cambiar el estado");
    }
  };

  const eliminarCategoriaSeleccionada = async (categoria) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await eliminarCategoria(categoria.id);
      mostrarMensaje("Categoría eliminada correctamente");

      if (categoriaSeleccionada?.id === categoria.id) {
        setCategoriaSeleccionada(null);
      }

      await cargarCategorias();
    } catch (error) {
      console.error(error);
      mostrarMensaje(
        "No se puede eliminar si tiene recursos vinculados. Desactívala."
      );
    }
  };

  return (
    <section className="categorias-section">
      <div className="categorias-header">
        <div>
          <p className="categorias-eyebrow">Catálogo académico</p>
          <h1>Gestión de Categorías</h1>
          <p>
            Organiza los recursos digitales por áreas académicas, carreras y
            materias básicas para facilitar la búsqueda dentro de SITEC.
          </p>
        </div>

        <div className="categorias-header__actions">
          <button
            type="button"
            className="categorias-btn primary"
            onClick={abrirNueva}
          >
            Nueva categoría
          </button>
        </div>
      </div>

      

      <div className="categorias-tools">
        <div className="categorias-search">
          <span></span>
          <input
            type="text"
            placeholder="Buscar por nombre, código, tipo, área o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Todas">Todos los tipos</option>

          {tiposDisponibles.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todas">Todos los estados</option>
          <option value="Activa">Activas</option>
          <option value="Inactiva">Inactivas</option>
        </select>

        {hayFiltrosActivos && (
          <button
            type="button"
            className="categorias-btn secondary"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="categorias-layout">
        <div className="categorias-table-card">
          <div className="categorias-card-head">
            <div>
              <h2>Lista de categorías</h2>
              <p>
                {cargando
                  ? "Cargando categorías..."
                  : `${categoriasFiltradas.length} resultados encontrados`}
              </p>
            </div>

            <span className="categorias-note">Catálogo SITEC</span>
          </div>

          <div className="categorias-table-wrap">
            <table className="categorias-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Área relacionada</th>
                  <th>Recursos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {categoriasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="categorias-empty">
                      {cargando
                        ? "Cargando información..."
                        : "No existen categorías con los filtros seleccionados."}
                    </td>
                  </tr>
                ) : (
                  categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>
                        <span className="categoria-code">
                          {categoria.codigo || "S/C"}
                        </span>
                      </td>

                      <td>
                        <div className="categoria-main">
                          <strong>{categoria.nombre}</strong>
                          <span>
                            {categoria.descripcion || "Sin descripción"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`categoria-badge ${getTipoClass(
                            categoria.tipo
                          )}`}
                        >
                          {categoria.tipo || "Sin tipo"}
                        </span>
                      </td>

                      <td>{categoria.area || "Sin área"}</td>

                      <td>
                        <strong className="categoria-recursos">
                          {categoria.recursos || 0}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`categoria-estado ${
                            categoria.estado === "Activa"
                              ? "activa"
                              : "inactiva"
                          }`}
                        >
                          {categoria.estado}
                        </span>
                      </td>

                      <td>
                        <div className="categorias-actions">
                          <button
                            type="button"
                            className="view"
                            onClick={() => setCategoriaSeleccionada(categoria)}
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            className="view"
                            onClick={() => abrirEditar(categoria)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              categoria.estado === "Activa"
                                ? "disable"
                                : "enable"
                            }
                            onClick={() => cambiarEstado(categoria)}
                          >
                            {categoria.estado === "Activa"
                              ? "Desactivar"
                              : "Activar"}
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              eliminarCategoriaSeleccionada(categoria)
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="categoria-detail">
          <div className="categoria-detail__head">
            <h2>Detalle de categoría</h2>
            <p>Información de clasificación y uso académico.</p>
          </div>

          {categoriaSeleccionada ? (
            <div className="categoria-detail__body">
              <div
                className={`categoria-detail__icon ${getTipoClass(
                  categoriaSeleccionada.tipo
                )}`}
              >
                <CategoryIcon name="folder" />
              </div>

              <span
                className={`categoria-badge ${getTipoClass(
                  categoriaSeleccionada.tipo
                )}`}
              >
                {categoriaSeleccionada.tipo || "Sin tipo"}
              </span>

              <h3>{categoriaSeleccionada.nombre}</h3>

              <p className="categoria-detail__desc">
                {categoriaSeleccionada.descripcion || "Sin descripción"}
              </p>

              <div className="categoria-detail__list">
                <div>
                  <span>Código</span>
                  <strong>{categoriaSeleccionada.codigo || "S/C"}</strong>
                </div>

                <div>
                  <span>Área relacionada</span>
                  <strong>{categoriaSeleccionada.area || "Sin área"}</strong>
                </div>

                <div>
                  <span>Recursos vinculados</span>
                  <strong>{categoriaSeleccionada.recursos || 0}</strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>{categoriaSeleccionada.estado}</strong>
                </div>
              </div>

              <button
                type="button"
                className={
                  categoriaSeleccionada.estado === "Activa"
                    ? "categoria-detail__danger"
                    : "categoria-detail__success"
                }
                onClick={() => cambiarEstado(categoriaSeleccionada)}
              >
                {categoriaSeleccionada.estado === "Activa"
                  ? "Desactivar categoría"
                  : "Activar categoría"}
              </button>
            </div>
          ) : (
            <div className="categoria-detail__empty">
              <CategoryIcon name="folder" />
              <h3>Selecciona una categoría</h3>
              <p>
                Revisa su descripción, área relacionada, estado y cantidad de
                recursos asociados.
              </p>
            </div>
          )}
        </aside>
      </div>

      {modalAbierto && (
        <div className="categoria-modal-backdrop">
          <div className="categoria-modal">
            <div className="categoria-modal__head">
              <div>
                <p>{modoEdicion ? "Editar categoría" : "Nueva clasificación"}</p>
                <h2>
                  {modoEdicion
                    ? "Actualizar categoría"
                    : "Registrar categoría"}
                </h2>
              </div>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="categoria-form" onSubmit={guardarCategoria}>
              <div className="categoria-form__grid">
                <label>
                  Código
                  <input
                    name="codigo"
                    value={formulario.codigo}
                    onChange={cambiarFormulario}
                    placeholder="Ej: MAT"
                    required
                  />
                </label>

                <label>
                  Nombre
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarFormulario}
                    placeholder="Ej: Matemática"
                    required
                  />
                </label>

                <label>
                  Tipo
                  <select
                    name="tipo"
                    value={formulario.tipo}
                    onChange={cambiarFormulario}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Académica">Académica</option>
                    <option value="Carrera">Carrera</option>
                    <option value="Materias Básicas">Materias Básicas</option>
                  </select>
                </label>

                <label>
                  Estado
                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarFormulario}
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </label>

                <label className="categoria-form__full">
                  Área relacionada
                  <input
                    name="area"
                    value={formulario.area}
                    onChange={cambiarFormulario}
                    placeholder="Ej: Departamento de Materias Básicas"
                  />
                </label>
              </div>

              <label className="categoria-form__textarea">
                Descripción
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={cambiarFormulario}
                  rows="4"
                ></textarea>
              </label>

              <div className="categoria-form__actions">
                <button
                  type="button"
                  className="categorias-btn secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="categorias-btn primary">
                  {modoEdicion ? "Guardar cambios" : "Registrar categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`categoria-toast ${mensaje ? "show" : ""}`}>
        {mensaje}
      </div>
    </section>
  );
}

function CategoriaMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`categoria-metric ${tipo}`}>
      <div className="categoria-metric__icon">
        <CategoryIcon name={icon} />
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function CategoryIcon({ name }) {
  const icons = {
    folder: (
      <>
        <path d="M3 6h7l2 3h9v10H3V6Z" />
        <path d="M3 9h18" />
      </>
    ),
    active: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    basic: (
      <>
        <path d="M4 5h7v14H4V5Z" />
        <path d="M13 5h7v14h-7V5Z" />
        <path d="M7 9h1" />
        <path d="M16 9h1" />
      </>
    ),
    resources: (
      <>
        <path d="M7 3h10v18H7V3Z" />
        <path d="M10 7h4" />
        <path d="M10 11h4" />
        <path d="M10 15h3" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className="category-icon" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function getTipoClass(tipo) {
  if (tipo === "Carrera") return "carrera";
  if (tipo === "Materias Básicas") return "basica";
  return "academica";
}

export default CategoriasSection;