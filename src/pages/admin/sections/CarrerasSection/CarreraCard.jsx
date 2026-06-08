function CarreraCard({
  carrera,
  onSelect,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) {
  const esDepartamento = carrera.especial || carrera.tipo === "DEPARTAMENTO";

  return (
    <article className={`carrera-card ${esDepartamento ? "carrera-especial" : ""}`}>
      <div className="carrera-top">
        <div className="carrera-sigla">{carrera.sigla}</div>

        <span className={`carrera-tipo ${esDepartamento ? "tipo-departamento" : ""}`}>
          {esDepartamento ? "Departamento" : "Carrera"}
        </span>
      </div>

      <h3 className="carrera-nombre">{carrera.nombre}</h3>

      <p className="carrera-desc">{carrera.descripcion}</p>

      {esDepartamento ? (
        <div className="areas-list">
          {carrera.areas?.length ? (
            carrera.areas.map((area) => <span key={area}>{area}</span>)
          ) : (
            <span>Sin áreas registradas</span>
          )}
        </div>
      ) : (
        <div className="carrera-info">
          <span>{carrera.semestres || 0} semestres</span>
          <span>{carrera.total_materias || 0} materias</span>
        </div>
      )}

      <div className="carrera-info">
        <span className={carrera.estado === "Activa" ? "estado-activo" : "estado-inactivo"}>
          {carrera.estado}
        </span>
      </div>

      <div className="carrera-actions">
        <button type="button" onClick={() => onSelect("Materias")}>
          Ver materias
        </button>

        <button type="button" className="secondary" onClick={() => onEditar(carrera)}>
          Editar
        </button>
      </div>

      <div className="carrera-actions carrera-actions-extra">
        <button
          type="button"
          className="secondary"
          onClick={() => onCambiarEstado(carrera)}
        >
          {carrera.estado === "Activa" ? "Desactivar" : "Activar"}
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

export default CarreraCard;