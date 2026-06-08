import { useEffect, useMemo, useState } from "react";
import "./InformesSection.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function InformesSection() {
  const [informes, setInformes] = useState([]);
  const [actividadPorModulo, setActividadPorModulo] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [resumen, setResumen] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [informeSeleccionado, setInformeSeleccionado] = useState(null);

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargarInformes = async () => {
    try {
      setLoading(true);
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/admin/informes`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.mensaje ||
          data.error ||
          "No se pudieron cargar los informes"
        );
      }

      setInformes(data.informes || []);
      setActividadPorModulo(data.actividadPorModulo || []);
      setIndicadores(data.indicadores || []);
      setResumen(data.resumen || null);
    } catch (error) {
      console.error("Error al cargar informes:", error);
      setMensaje("No se pudieron cargar los informes desde la base de datos.");
      setInformes([]);
      setActividadPorModulo([]);
      setIndicadores([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInformes();
  }, []);

  const informesFiltrados = useMemo(() => {
    return informes.filter((informe) => {
      const texto = `
        ${informe.titulo || ""}
        ${informe.tipo || ""}
        ${informe.periodo || ""}
        ${informe.estado || ""}
        ${informe.descripcion || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      const coincideTipo =
        filtroTipo === "Todos" ||
        informe.tipo === filtroTipo;

      const coincideEstado =
        filtroEstado === "Todos" ||
        informe.estado === filtroEstado;

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }, [informes, busqueda, filtroTipo, filtroEstado]);

  const totalInformes = informes.length;

  const generados = informes.filter(
    (i) => i.estado === "Generado"
  ).length;

  const pendientes = informes.filter(
    (i) => i.estado === "Pendiente"
  ).length;

  const registrosTotales = informes.reduce(
    (acc, i) => acc + Number(i.registros || 0),
    0
  );

  const exportarResumen = () => {
    const contenido = {
      fecha_exportacion: new Date().toLocaleString("es-BO"),
      resumen,
      informes,
      actividadPorModulo,
      indicadores,
    };

    const blob = new Blob(
      [JSON.stringify(contenido, null, 2)],
      { type: "application/json" }
    );

    const url = window.URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte_administrativo_sitec.json";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="informes-section">
      <div className="informes-header">
        <div>
          <p className="informes-eyebrow">
            Control y seguimiento
          </p>

          <h1>
            Informes del Sistema
          </h1>

          <p>
            Revisa reportes administrativos generados con información real de
            la base de datos: recursos, usuarios, solicitudes, descargas y
            materias registradas.
          </p>
        </div>

        <div className="informes-header__actions">
          

          <button
            type="button"
            className="informes-btn primary"
            onClick={cargarInformes}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar informes"}
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="admin-inline-message">
          {mensaje}
        </div>
      )}

      <div className="informes-tools">
        <div className="informes-search">
          <span></span>

          <input
            type="text"
            placeholder="Buscar por título, tipo, periodo o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Todos">Todos los tipos</option>
          <option value="Recursos">Recursos</option>
          <option value="Usuarios">Usuarios</option>
          <option value="Solicitudes">Solicitudes</option>
          <option value="Descargas">Descargas</option>
          <option value="Materias">Materias</option>
          <option value="Auditoría">Auditoría</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Generado">Generados</option>
          <option value="Pendiente">Pendientes</option>
          <option value="Revisión">En revisión</option>
        </select>
      </div>

      <div className="informes-dashboard">
        <div className="informes-chart-card">
          <div className="informes-card-head">
            <div>
              <h2>
                Actividad por módulo
              </h2>

              <p>
                Resumen visual calculado desde la base de datos.
              </p>
            </div>

            
          </div>

          <div className="informes-chart">
            {loading ? (
              <p>Cargando actividad...</p>
            ) : actividadPorModulo.length === 0 ? (
              <p>No hay datos de actividad registrados.</p>
            ) : (
              actividadPorModulo.map((item) => (
                <div
                  className="informes-chart__row"
                  key={item.modulo}
                >
                  <span>
                    {item.modulo}
                  </span>

                  <div className="informes-chart__bar">
                    <div
                      className={`informes-chart__fill ${item.tipo}`}
                      style={{
                        width: `${item.porcentaje || 0}%`,
                      }}
                    ></div>
                  </div>

                  <strong>
                    {Number(item.valor || 0).toLocaleString("es-BO")}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="informes-indicators">
          {loading ? (
            <article className="informes-indicator-card">
              <span>Cargando</span>
              <strong>...</strong>
              <p>Obteniendo indicadores</p>
            </article>
          ) : indicadores.length === 0 ? (
            <article className="informes-indicator-card">
              <span>Sin indicadores</span>
              <strong>0</strong>
              <p>No hay datos disponibles</p>
            </article>
          ) : (
            indicadores.map((item) => (
              <article
                key={item.nombre}
                className="informes-indicator-card"
              >
                <span>
                  {item.nombre}
                </span>

                <strong>
                  {item.valor}
                </strong>

                <p>
                  {item.detalle}
                </p>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="informes-layout">
        <div className="informes-table-card">
          <div className="informes-card-head">
            <div>
              <h2>
                Lista de informes
              </h2>

              <p>
                {loading
                  ? "Cargando informes..."
                  : `${informesFiltrados.length} resultados encontrados`}
              </p>
            </div>

            <span className="informes-note">
              Datos desde MySQL
            </span>
          </div>

          <div className="informes-table-wrap">
            <table className="informes-table">
              <thead>
                <tr>
                  <th>Informe</th>
                  <th>Tipo</th>
                  <th>Periodo</th>
                  <th>Fecha</th>
                  <th>Registros</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="informes-empty">
                      Cargando informes desde la base de datos...
                    </td>
                  </tr>
                ) : informesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="informes-empty">
                      No existen informes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  informesFiltrados.map((informe) => (
                    <tr key={informe.id}>
                      <td>
                        <div className="informe-main">
                          <strong>
                            {informe.titulo}
                          </strong>

                          <span>
                            {informe.descripcion}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`informe-badge ${getTipoClass(
                            informe.tipo
                          )}`}
                        >
                          {informe.tipo}
                        </span>
                      </td>

                      <td>
                        {informe.periodo}
                      </td>

                      <td>
                        {informe.fecha}
                      </td>

                      <td>
                        <strong className="informe-registros">
                          {Number(informe.registros || 0).toLocaleString(
                            "es-BO"
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`informe-estado ${getEstadoClass(
                            informe.estado
                          )}`}
                        >
                          {informe.estado}
                        </span>
                      </td>

                      <td>
                        <div className="informes-actions">
                          <button
                            type="button"
                            className="view"
                            onClick={() =>
                              setInformeSeleccionado(informe)
                            }
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            className="export"
                            onClick={exportarResumen}
                          >
                            Exportar
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

        <aside className="informe-detail">
          <div className="informe-detail__head">
            <h2>
              Detalle del informe
            </h2>

            <p>
              Información resumida del reporte seleccionado.
            </p>
          </div>

          {informeSeleccionado ? (
            <div className="informe-detail__body">
              <div
                className={`informe-detail__icon ${getTipoClass(
                  informeSeleccionado.tipo
                )}`}
              >
                <ReportIcon name="reports" />
              </div>

              <span
                className={`informe-badge ${getTipoClass(
                  informeSeleccionado.tipo
                )}`}
              >
                {informeSeleccionado.tipo}
              </span>

              <h3>
                {informeSeleccionado.titulo}
              </h3>

              <p className="informe-detail__desc">
                {informeSeleccionado.descripcion}
              </p>

              <div className="informe-detail__list">
                <div>
                  <span>Periodo</span>
                  <strong>{informeSeleccionado.periodo}</strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>{informeSeleccionado.fecha}</strong>
                </div>

                <div>
                  <span>Responsable</span>
                  <strong>{informeSeleccionado.responsable}</strong>
                </div>

                <div>
                  <span>Registros analizados</span>
                  <strong>
                    {Number(
                      informeSeleccionado.registros || 0
                    ).toLocaleString("es-BO")}
                  </strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>{informeSeleccionado.estado}</strong>
                </div>
              </div>

              <button
                type="button"
                className="informe-detail__button"
                onClick={exportarResumen}
              >
                Exportar informe
              </button>
            </div>
          ) : (
            <div className="informe-detail__empty">
              <ReportIcon name="reports" />

              <h3>
                Selecciona un informe
              </h3>

              <p>
                Revisa el detalle del reporte antes de exportarlo o utilizarlo
                para análisis administrativo.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function InformeMetric({ tipo, icon, valor, titulo, detalle }) {
  return (
    <article className={`informe-metric ${tipo}`}>
      <div className="informe-metric__icon">
        <ReportIcon name={icon} />
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function ReportIcon({ name }) {
  const icons = {
    reports: (
      <>
        <path d="M5 4h14v16H5V4Z" />
        <path d="M8 16V11" />
        <path d="M12 16V8" />
        <path d="M16 16v-6" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="report-icon"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function getTipoClass(tipo) {
  if (tipo === "Usuarios") return "usuarios";
  if (tipo === "Solicitudes") return "solicitudes";
  if (tipo === "Descargas") return "descargas";
  if (tipo === "Materias") return "materias";
  if (tipo === "Auditoría") return "auditoria";
  return "recursos";
}

function getEstadoClass(estado) {
  if (estado === "Generado") return "generado";
  if (estado === "Pendiente") return "pendiente";
  return "revision";
}

export default InformesSection;