import "../../admin/sections/PanelSection/PanelSection.css";

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  try {
    return new Date(fecha).toLocaleString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fecha;
  }
}

function obtenerIconoActividad(tipo = "") {
  const valor = String(tipo).toLowerCase();

  if (valor.includes("aprob")) return "check";
  if (valor.includes("usuario")) return "user";
  if (valor.includes("subida") || valor.includes("recurso")) return "upload";
  if (valor.includes("alerta") || valor.includes("pendiente")) return "alert";

  return "book";
}

function obtenerTipoActividad(tipo = "") {
  const valor = String(tipo).toLowerCase();

  if (valor.includes("aprob")) return "success";
  if (valor.includes("usuario")) return "info";
  if (valor.includes("pendiente") || valor.includes("alerta")) return "warning";

  return "primary";
}

function PanelGestorSection({
  solicitudes = [],
  metricas = {},
  actividad = [],
  resumen = [],
  actualizando = false,
  onRefresh,
  onNavigate,
  onAprobar,
  onRechazar,
}) {
  const datosActividad = Array.isArray(actividad) ? actividad : [];
  const datosResumen = Array.isArray(resumen) ? resumen : [];

  return (
    <section className="panel-section">
      <div className="panel-section__header">
        <div>
          <p className="panel-section__eyebrow">Panel de control</p>
          <h1 className="panel-section__title">
  Panel de Gestión de Carrera
</h1>
          <p className="panel-section__subtitle">
            Resumen general de la biblioteca digital SITEC y actividad reciente del sistema.
          </p>
        </div>

        <div className="panel-section__actions">
          <div className="panel-section__status">
            <span></span>
            Sistema activo
          </div>

          <button
            type="button"
            className={`panel-section__refresh ${actualizando ? "spin" : ""}`}
            onClick={onRefresh}
          >
            {actualizando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <div className="panel-metrics">
        <MetricCard
          tipo="primary"
          icon="book"
          valor={(metricas.totalLibros ?? 0).toLocaleString("es-BO")}
          titulo="Libros digitales"
          detalle={`${metricas.aprobacionesPendientes ?? solicitudes.length ?? 0} pendientes de aprobación`}
        />

        <MetricCard
          tipo="success"
          icon="users"
          valor={(metricas.recursosAprobados ?? 0).toLocaleString("es-BO")}
          titulo="Recursos aprobados"
          detalle="Publicados en la carrera"
        />

        <MetricCard
          tipo="warning"
          icon="approval"
          valor={(metricas.aprobacionesPendientes ?? solicitudes.length ?? 0).toLocaleString("es-BO")}
          titulo="Aprobaciones"
          detalle="Recursos esperando revisión"
        />

        <MetricCard
          tipo="danger"
          icon="download"
          valor={(metricas.descargasTotales ?? 0).toLocaleString("es-BO")}
          titulo="Descargas"
          detalle={`${metricas.descargasHoy ?? 0} descargas hoy`}
        />
      </div>

      <div className="panel-layout">
        <div className="panel-card panel-card--large">
          <div className="panel-card__head">
            <div>
              <h2>Solicitudes pendientes</h2>
              <p>Recursos enviados por docentes o sugerencias de estudiantes.</p>
            </div>

            <button type="button" onClick={() => onNavigate("Solicitudes")}>
              Ver todas
            </button>
          </div>

          <div className="panel-table">
            <table>
              <thead>
                <tr>
                  <th>Libro / Solicitante</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="panel-table__empty">
                      No existen solicitudes pendientes.
                    </td>
                  </tr>
                ) : (
solicitudes.map((solicitud, index) => {
  const keySolicitud =
    solicitud.id_solicitud ||
    solicitud.id_recurso ||
    solicitud.id ||
    `solicitud-${index}`;

  return (
    <tr key={`${keySolicitud}-${index}`}>
                      <td>
                        <strong>
                          {solicitud.titulo || solicitud.recurso || "Recurso sin título"}
                        </strong>
                        <span>
                          {solicitud.solicitante || solicitud.usuario || "Solicitante no registrado"}
                          {solicitud.area ? ` · ${solicitud.area}` : ""}
                        </span>
                      </td>

                      <td>
                        <span className="panel-badge">
                          {solicitud.tipo || "Solicitud"}
                        </span>
                      </td>

                      <td>
                        {formatearFecha(solicitud.fecha || solicitud.fecha_registro)}
                      </td>

                      <td>
                        <div className="panel-table__actions">
                          <button
                            type="button"
                            className="approve"
                            onClick={() => onAprobar(solicitud)}
                          >
                            Aprobar
                          </button>

                          <button
                            type="button"
                            className="reject"
                            onClick={() => onRechazar(solicitud)}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
  </tr>
  );
})
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card__head">
            <div>
              <h2>Actividad reciente</h2>
              <p>Movimientos importantes del sistema.</p>
            </div>

        <button type="button" onClick={onRefresh}>
          Actualizar
        </button>
          </div>

          <div className="activity-list">
            {datosActividad.length === 0 ? (
              <div className="panel-table__empty">
                No existe actividad reciente registrada.
              </div>
            ) : (
              datosActividad.map((item, index) => {
                const tipo = item.tipo || item.tipo_actividad || "";
                const icono = item.icon || obtenerIconoActividad(tipo);
                const clase = item.clase || obtenerTipoActividad(tipo);

                return (
                  <div
                    className="activity-item"
                    key={item.id_actividad || item.id || index}
                  >
                    <div className={`activity-item__icon ${clase}`}>
                      <PanelIcon name={icono} />
                    </div>

                    <div>
                      <strong>{item.titulo || "Actividad registrada"}</strong>
                      <span>
                        {item.detalle || item.descripcion || formatearFecha(item.fecha)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="quick-panel">
          <QuickAction
            icon="book"
            titulo="Gestión de recursos"
            descripcion="Registrar, editar y organizar recursos digitales de tu carrera."
            boton="Gestionar recursos"
            onClick={() => onNavigate("GestionLibros")}
          />

        <QuickAction
          icon="approval"
          titulo="Aprobaciones"
          descripcion="Autorizar o rechazar libros subidos por docentes."
          boton="Revisar solicitudes"
          onClick={() => onNavigate("Solicitudes")}
        />

        <QuickAction
          icon="catalog"
          titulo="Perfil de carrera"
          descripcion="Consulta la información administrativa asignada a tu carrera."
          boton="Ver perfil"
          onClick={() => onNavigate("Perfil")}
        />
      </div>

      <div className="panel-card">
        <div className="panel-card__head">
          <div>
            <h2>Resumen del sistema</h2>
            <p>Indicadores generales de uso y administración.</p>
          </div>

      <button type="button" onClick={onRefresh}>
        Actualizar
      </button>
        </div>

        <div className="system-summary">
          {datosResumen.length === 0 ? (
            <div className="panel-table__empty">
              No existen indicadores de resumen registrados.
            </div>
          ) : (
            datosResumen.map((item, index) => (
              <div className="summary-row" key={item.nombre || index}>
                <span>{item.nombre}</span>

                <div className="summary-bar">
                  <div
                    className={`summary-bar__fill ${item.tipo || "primary"}`}
                    style={{ width: `${Number(item.porcentaje || 0)}%` }}
                  ></div>
                </div>

                <strong>
                  {Number(item.valor ?? 0).toLocaleString("es-BO")}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ tipo, icon, valor, titulo, detalle, estado }) {
  return (
    <article className={`metric-card-pro ${tipo}`}>
      <div className="metric-card-pro__top">
        <div className="metric-card-pro__icon">
          <PanelIcon name={icon} />
        </div>

        {estado && <span>{estado}</span>}
      </div>

      <strong>{valor}</strong>
      <h3>{titulo}</h3>
      <p>{detalle}</p>
    </article>
  );
}

function QuickAction({ icon, titulo, descripcion, boton, onClick }) {
  return (
    <article className="quick-action-card">
      <div className="quick-action-card__icon">
        <PanelIcon name={icon} />
      </div>

      <div>
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>

      <button type="button" onClick={onClick}>
        {boton}
      </button>
    </article>
  );
}

function PanelIcon({ name }) {
  const icons = {
    book: (
      <>
        <path d="M5 4.5h9a3 3 0 0 1 3 3v12.5H8a3 3 0 0 0-3 3V4.5Z" />
        <path d="M19 4.5h-2a3 3 0 0 0-3 3v12.5h5V4.5Z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M4 20a5 5 0 0 1 10 0" />
        <path d="M14 20a4 4 0 0 1 7 0" />
      </>
    ),
    approval: (
      <>
        <path d="M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" />
        <path d="m8 13 3 3 6-7" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    upload: (
      <>
        <path d="M12 20V8" />
        <path d="m8 12 4-4 4 4" />
        <path d="M5 20h14" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 3 20h18L12 4Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    catalog: (
      <>
        <path d="M4 5h7v14H4V5Z" />
        <path d="M13 5h7v14h-7V5Z" />
        <path d="M7 9h1" />
        <path d="M16 9h1" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="panel-svg-icon">
      {icons[name] || icons.book}
    </svg>
  );
}

export default PanelGestorSection;