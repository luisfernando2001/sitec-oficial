import { useEffect, useMemo, useState } from "react";
import "./MateriasSection.css";

import {
  obtenerMaterias,
  crearMateria,
  actualizarMateria,
  cambiarEstadoMateria,
  eliminarMateria,
} from "../../../../services/materiasService";

const formularioInicial = {
  id_carrera: "",
  id_semestre: "",
  id_area_basica: "",
  sigla: "",
  nombre: "",
  descripcion: "",
  estado: "Activa",
};

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function MateriasSection() {
  const [materias, setMaterias] = useState([]);
  const [metricas, setMetricas] = useState({
    totalMaterias: 0,
    materiasBasicas: 0,
    materiasCarrera: 0,
    recursosTotales: 0,
  });

  const [carreras, setCarreras] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [areas, setAreas] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState("Todas las carreras");
  const [filtroSemestre, setFiltroSemestre] = useState("Todos los semestres");
  const [filtroArea, setFiltroArea] = useState("Todas las áreas");

  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarMaterias = async () => {
    try {
      setCargando(true);

      const data = await obtenerMaterias();

      setMaterias(data.materias || []);
      setMetricas(data.metricas || {});
      setCarreras(data.carreras || []);
      setSemestres(data.semestres || []);
      setAreas(data.areas || []);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al cargar materias desde el backend");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMaterias();
  }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 2600);
  };

  const areasFiltroUnicas = useMemo(() => {
    const mapa = new Map();

    areas.forEach((area) => {
      const nombreArea = area.nombre_area || area.area || "";

      if (!nombreArea) return;

      const clave = normalizarTexto(nombreArea);

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          clave,
          nombre_area: nombreArea,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre_area.localeCompare(b.nombre_area)
    );
  }, [areas]);

  const materiasFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda);

    return materias.filter((materia) => {
      const textoMateria = normalizarTexto(`
        ${materia.sigla || ""}
        ${materia.nombre || ""}
        ${materia.descripcion || ""}
        ${materia.carrera || ""}
        ${materia.area || ""}
        ${materia.semestre || ""}
        ${materia.tipo || ""}
        ${materia.estado || ""}
      `);

      const coincideBusqueda =
        !busquedaNormalizada ||
        textoMateria.includes(busquedaNormalizada);

      const coincideCarrera =
        filtroCarrera === "Todas las carreras" ||
        String(materia.id_carrera) === String(filtroCarrera);

      const coincideSemestre =
        filtroSemestre === "Todos los semestres" ||
        String(materia.id_semestre) === String(filtroSemestre);

      const coincideArea =
        filtroArea === "Todas las áreas" ||
        normalizarTexto(materia.area) === normalizarTexto(filtroArea);

      return (
        coincideBusqueda &&
        coincideCarrera &&
        coincideSemestre &&
        coincideArea
      );
    });
  }, [materias, busqueda, filtroCarrera, filtroSemestre, filtroArea]);

  const areasDelFormulario = useMemo(() => {
    if (!formulario.id_carrera) {
      return areas;
    }

    return areas.filter(
      (area) => String(area.id_carrera) === String(formulario.id_carrera)
    );
  }, [areas, formulario.id_carrera]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCarrera("Todas las carreras");
    setFiltroSemestre("Todos los semestres");
    setFiltroArea("Todas las áreas");
  };

  const abrirNueva = () => {
    setModoEdicion(false);
    setMateriaEditando(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (materia) => {
    setModoEdicion(true);
    setMateriaEditando(materia);

    setFormulario({
      id_carrera: materia.id_carrera || "",
      id_semestre: materia.id_semestre || "",
      id_area_basica: materia.id_area_basica || "",
      sigla: materia.sigla || "",
      nombre: materia.nombre || "",
      descripcion: materia.descripcion || "",
      estado: materia.estado || "Activa",
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setMateriaEditando(null);
    setFormulario(formularioInicial);
  };

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => {
      const actualizado = {
        ...actual,
        [name]: value,
      };

      if (name === "id_carrera") {
        actualizado.id_area_basica = "";
      }

      return actualizado;
    });
  };

  const guardarMateria = async (e) => {
    e.preventDefault();

    try {
      if (modoEdicion && materiaEditando) {
        await actualizarMateria(materiaEditando.id, formulario);
        mostrarMensaje("Materia actualizada correctamente");
      } else {
        await crearMateria(formulario);
        mostrarMensaje("Materia registrada correctamente");
      }

      cerrarModal();
      await cargarMaterias();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo guardar la materia");
    }
  };

  const cambiarEstado = async (materia) => {
    const nuevoEstado = materia.estado === "Activa" ? "Inactiva" : "Activa";

    try {
      await cambiarEstadoMateria(materia.id, nuevoEstado);
      mostrarMensaje(`Materia ${nuevoEstado.toLowerCase()} correctamente`);

      if (materiaSeleccionada?.id === materia.id) {
        setMateriaSeleccionada({
          ...materiaSeleccionada,
          estado: nuevoEstado,
        });
      }

      await cargarMaterias();
    } catch (error) {
      console.error(error);
      mostrarMensaje("No se pudo cambiar el estado");
    }
  };

  const eliminarMateriaSeleccionada = async (materia) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar la materia "${materia.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await eliminarMateria(materia.id);
      mostrarMensaje("Materia eliminada correctamente");

      if (materiaSeleccionada?.id === materia.id) {
        setMateriaSeleccionada(null);
      }

      await cargarMaterias();
    } catch (error) {
      console.error(error);
      mostrarMensaje(
        "No se puede eliminar si tiene recursos o paralelos vinculados. Desactívala."
      );
    }
  };

  const exportarCSV = () => {
    const encabezados = [
      "Sigla",
      "Materia",
      "Carrera",
      "Area",
      "Semestre",
      "Tipo",
      "Recursos",
      "Docentes",
      "Estado",
    ];

    const filas = materiasFiltradas.map((materia) => [
      materia.sigla,
      materia.nombre,
      materia.carrera,
      materia.area,
      materia.semestre,
      materia.tipo,
      materia.recursos,
      materia.docentes,
      materia.estado,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "materias_sitec.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  const hayFiltrosActivos =
    busqueda ||
    filtroCarrera !== "Todas las carreras" ||
    filtroSemestre !== "Todos los semestres" ||
    filtroArea !== "Todas las áreas";

  return (
    <section className="materias-section">
      <div className="materias-header">
        <div>
          <p className="materias-eyebrow">Catálogo académico</p>
          <h1>Gestión de Materias</h1>
          <p>
            Administra materias por carrera, semestre y área académica,
            incluyendo el Departamento de Materias Básicas.
          </p>
        </div>

        <div className="materias-header__actions">
          

          <button
            type="button"
            className="materias-btn primary"
            onClick={abrirNueva}
          >
            Nueva materia
          </button>
        </div>
      </div>


      <div className="materias-tools">
        <div className="materias-search">
          <span></span>
          <input
            type="text"
            placeholder="Buscar por sigla, materia, carrera, semestre o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroCarrera}
          onChange={(e) => {
            setFiltroCarrera(e.target.value);
            setFiltroSemestre("Todos los semestres");
            setFiltroArea("Todas las áreas");
          }}
        >
          <option value="Todas las carreras">Todas las carreras</option>
          {carreras.map((carrera) => (
            <option key={carrera.id_carrera} value={carrera.id_carrera}>
              {carrera.nombre_carrera}
            </option>
          ))}
        </select>

        <select
          value={filtroSemestre}
          onChange={(e) => setFiltroSemestre(e.target.value)}
        >
          <option value="Todos los semestres">Todos los semestres</option>
          {semestres.map((semestre) => (
            <option key={semestre.id_semestre} value={semestre.id_semestre}>
              {semestre.nombre_semestre}
            </option>
          ))}
        </select>

        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
        >
          <option value="Todas las áreas">Todas las áreas</option>
          {areasFiltroUnicas.map((area) => (
            <option key={area.clave} value={area.nombre_area}>
              {area.nombre_area}
            </option>
          ))}
        </select>

        {hayFiltrosActivos && (
          <button
            type="button"
            className="materias-btn secondary"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="materias-layout">
        <div className="materias-table-card">
          <div className="materias-card-head">
            <div>
              <h2>Lista de materias</h2>
              <p>
                {cargando
                  ? "Cargando materias..."
                  : `${materiasFiltradas.length} resultados encontrados`}
              </p>
            </div>

            <span className="materias-note">Plan académico SITEC</span>
          </div>

          <div className="materias-table-wrap">
            <table className="materias-table">
              <thead>
                <tr>
                  <th>Sigla</th>
                  <th>Materia</th>
                  <th>Carrera / Área</th>
                  <th>Semestre</th>
                  <th>Recursos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {materiasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="materias-empty">
                      {cargando
                        ? "Cargando información..."
                        : "No existen materias con los filtros seleccionados."}
                    </td>
                  </tr>
                ) : (
                  materiasFiltradas.map((materia) => (
                    <tr key={materia.id}>
                      <td>
                        <span className="materia-code">{materia.sigla}</span>
                      </td>

                      <td>
                        <div className="materia-main">
                          <strong>{materia.nombre}</strong>
                          <span>{materia.descripcion}</span>
                        </div>
                      </td>

                      <td>
                        <div className="materia-area">
                          <strong>{materia.carrera}</strong>
                          <span>{materia.area || "Sin área"}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`materia-badge ${getTipoClass(
                            materia.tipo
                          )}`}
                        >
                          {materia.semestre || "Sin semestre"}
                        </span>
                      </td>

                      <td>
                        <strong className="materia-recursos">
                          {materia.recursos || 0}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`materia-estado ${
                            materia.estado === "Activa" ? "activa" : "inactiva"
                          }`}
                        >
                          {materia.estado}
                        </span>
                      </td>

                      <td>
                        <div className="materias-actions">
                          <button
                            type="button"
                            className="view"
                            onClick={() => setMateriaSeleccionada(materia)}
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            className="view"
                            onClick={() => abrirEditar(materia)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              materia.estado === "Activa" ? "disable" : "enable"
                            }
                            onClick={() => cambiarEstado(materia)}
                          >
                            {materia.estado === "Activa"
                              ? "Desactivar"
                              : "Activar"}
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() => eliminarMateriaSeleccionada(materia)}
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

        <aside className="materia-detail">
          <div className="materia-detail__head">
            <h2>Detalle de materia</h2>
            <p>Información académica y recursos asociados.</p>
          </div>

          {materiaSeleccionada ? (
            <div className="materia-detail__body">
              <div
                className={`materia-detail__icon ${getTipoClass(
                  materiaSeleccionada.tipo
                )}`}
              >
                <SubjectIcon name="subjects" />
              </div>

              <span
                className={`materia-badge ${getTipoClass(
                  materiaSeleccionada.tipo
                )}`}
              >
                {materiaSeleccionada.tipo}
              </span>

              <h3>{materiaSeleccionada.nombre}</h3>

              <p className="materia-detail__desc">
                {materiaSeleccionada.descripcion}
              </p>

              <div className="materia-detail__list">
                <div>
                  <span>Sigla</span>
                  <strong>{materiaSeleccionada.sigla}</strong>
                </div>

                <div>
                  <span>Carrera</span>
                  <strong>{materiaSeleccionada.carrera}</strong>
                </div>

                <div>
                  <span>Área</span>
                  <strong>{materiaSeleccionada.area || "Sin área"}</strong>
                </div>

                <div>
                  <span>Semestre</span>
                  <strong>
                    {materiaSeleccionada.semestre || "Sin semestre"}
                  </strong>
                </div>

                <div>
                  <span>Docentes / paralelos</span>
                  <strong>
                    {materiaSeleccionada.docentes || 0} docentes ·{" "}
                    {materiaSeleccionada.paralelos || 0} paralelos
                  </strong>
                </div>

                <div>
                  <span>Recursos asociados</span>
                  <strong>{materiaSeleccionada.recursos || 0}</strong>
                </div>
              </div>

              <button
                type="button"
                className={
                  materiaSeleccionada.estado === "Activa"
                    ? "materia-detail__danger"
                    : "materia-detail__success"
                }
                onClick={() => cambiarEstado(materiaSeleccionada)}
              >
                {materiaSeleccionada.estado === "Activa"
                  ? "Desactivar materia"
                  : "Activar materia"}
              </button>
            </div>
          ) : (
            <div className="materia-detail__empty">
              <SubjectIcon name="subjects" />

              <h3>Selecciona una materia</h3>

              <p>
                Revisa su sigla, carrera, semestre, área académica y recursos
                vinculados.
              </p>
            </div>
          )}
        </aside>
      </div>

      {modalAbierto && (
        <div className="materia-modal-backdrop">
          <div className="materia-modal">
            <div className="materia-modal__head">
              <div>
                <p>{modoEdicion ? "Editar materia" : "Nueva materia"}</p>
                <h2>
                  {modoEdicion ? "Actualizar materia" : "Registrar materia"}
                </h2>
              </div>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="materia-form" onSubmit={guardarMateria}>
              <div className="materia-form__grid">
                <label>
                  Carrera / Departamento
                  <select
                    name="id_carrera"
                    value={formulario.id_carrera}
                    onChange={cambiarFormulario}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {carreras.map((carrera) => (
                      <option
                        key={carrera.id_carrera}
                        value={carrera.id_carrera}
                      >
                        {carrera.nombre_carrera}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Semestre
                  <select
                    name="id_semestre"
                    value={formulario.id_semestre}
                    onChange={cambiarFormulario}
                  >
                    <option value="">Sin semestre fijo</option>
                    {semestres.map((semestre) => (
                      <option
                        key={semestre.id_semestre}
                        value={semestre.id_semestre}
                      >
                        {semestre.nombre_semestre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Área básica
                  <select
                    name="id_area_basica"
                    value={formulario.id_area_basica}
                    onChange={cambiarFormulario}
                  >
                    <option value="">Sin área básica</option>
                    {areasDelFormulario.map((area) => (
                      <option
                        key={area.id_area_basica}
                        value={area.id_area_basica}
                      >
                        {area.nombre_area}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Sigla
                  <input
                    name="sigla"
                    value={formulario.sigla}
                    onChange={cambiarFormulario}
                    placeholder="Ej: MAT-100"
                    required
                  />
                </label>

                <label>
                  Nombre de materia
                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarFormulario}
                    placeholder="Ej: Álgebra"
                    required
                  />
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
              </div>

              <label className="materia-form__textarea">
                Descripción
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={cambiarFormulario}
                  rows="4"
                ></textarea>
              </label>

              <div className="materia-form__actions">
                <button
                  type="button"
                  className="materias-btn secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="materias-btn primary">
                  {modoEdicion ? "Guardar cambios" : "Registrar materia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`materia-toast ${mensaje ? "show" : ""}`}>
        {mensaje}
      </div>
    </section>
  );
}

function MateriaMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`materia-metric ${tipo}`}>
      <div className="materia-metric__icon">
        <SubjectIcon name={icon} />
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function SubjectIcon({ name }) {
  const icons = {
    subjects: (
      <>
        <path d="M5 4h14v16H5V4Z" />
        <path d="M9 4v16" />
        <path d="M12 8h4" />
        <path d="M12 12h4" />
      </>
    ),
    career: (
      <>
        <path d="M3 8l9-4 9 4-9 4-9-4Z" />
        <path d="M7 11v5c2 2 8 2 10 0v-5" />
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
    <svg viewBox="0 0 24 24" className="subject-icon" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function getTipoClass(tipo) {
  if (tipo === "Básica") return "basica";
  return "carrera";
}

export default MateriasSection;