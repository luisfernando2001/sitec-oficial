const db = require("../../config/db").promise();

const recursoPerteneceACarrera = async (idRecurso, idCarrera) => {
  const [filas] = await db.query(
    `
    SELECT r.id_recurso
    FROM recurso r
    LEFT JOIN usuario u ON r.id_usuario_subida = u.id_usuario
    WHERE r.id_recurso = ?
      AND IFNULL(r.estado, 1) = 1
      AND (
        r.id_carrera = ?
        OR u.id_carrera = ?
        OR EXISTS (
          SELECT 1
          FROM recurso_materia rm
          INNER JOIN materia m ON rm.id_materia = m.id_materia
          WHERE rm.id_recurso = r.id_recurso
            AND IFNULL(rm.estado, 'ACTIVO') = 'ACTIVO'
            AND m.id_carrera = ?
        )
      )
    LIMIT 1
    `,
    [idRecurso, idCarrera, idCarrera, idCarrera]
  );

  return filas.length > 0;
};

const listarSolicitudesGestor = async (req, res) => {
  try {
    const idCarrera = Number(req.params.idCarrera);

    if (!idCarrera) {
      return res.status(400).json({
        ok: false,
        mensaje: "Carrera no válida para el gestor",
      });
    }

    const [solicitudes] = await db.query(
      `
      SELECT
        s.id_solicitud,
        COALESCE(s.id_solicitud, r.id_recurso) AS id,
        s.id_usuario,

        r.id_recurso,
        r.id_recurso AS idRecurso,
        r.id_carrera,
        r.titulo,
        r.isbn,
        r.anio_publicacion,
        r.formato,
        r.url_acceso,
        r.archivo_digital,
        r.resumen,
        r.estado_aprobacion AS estado,
        r.estado_aprobacion,
        r.fecha_registro,
        r.fecha_aprobacion,
        r.observacion_aprobacion AS motivo_rechazo,
        r.observacion_aprobacion,

        s.observacion,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', us.nombre, us.apellido)), ''),
          NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''),
          'Usuario no definido'
        ) AS solicitante,

        COALESCE(us.correo, u.correo, 'No registrado') AS correo_solicitante,

        COALESCE(c.nombre_categoria, 'Sin categoría') AS area,
        COALESCE(c.nombre_categoria, 'Sin categoría') AS nombre_categoria,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', a.nombre_autor, a.apellido_autor)), ''),
          'Autor no registrado'
        ) AS autor,

        CASE
          WHEN r.archivo_digital IS NOT NULL AND r.archivo_digital <> '' THEN 'Subida'
          WHEN r.url_acceso IS NOT NULL AND r.url_acceso <> '' THEN 'Sugerencia'
          ELSE 'Sugerencia'
        END AS tipo,

        DATE_FORMAT(COALESCE(s.fecha, r.fecha_registro), '%d/%m/%Y') AS fecha_formateada,
        DATE_FORMAT(COALESCE(s.fecha, r.fecha_registro), '%d/%m/%Y') AS fecha,
        DATE_FORMAT(r.fecha_aprobacion, '%d/%m/%Y %H:%i') AS fecha_revision

      FROM recurso r

      LEFT JOIN solicitud s ON r.id_recurso = s.id_recurso
      LEFT JOIN usuario us ON s.id_usuario = us.id_usuario
      LEFT JOIN usuario u ON r.id_usuario_subida = u.id_usuario
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      LEFT JOIN autor a ON r.id_autor = a.id_autor

      WHERE IFNULL(r.estado, 1) = 1
        AND (
          r.id_carrera = ?
          OR u.id_carrera = ?
          OR EXISTS (
            SELECT 1
            FROM recurso_materia rm
            INNER JOIN materia m ON rm.id_materia = m.id_materia
            WHERE rm.id_recurso = r.id_recurso
              AND IFNULL(rm.estado, 'ACTIVO') = 'ACTIVO'
              AND m.id_carrera = ?
          )
        )

      ORDER BY r.fecha_registro DESC, r.id_recurso DESC
      `,
      [idCarrera, idCarrera, idCarrera]
    );

    const [[metricas]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT r.id_recurso) AS total,
        SUM(CASE WHEN r.estado_aprobacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN r.estado_aprobacion = 'APROBADO' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN r.estado_aprobacion = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazadas
      FROM recurso r
      LEFT JOIN usuario u ON r.id_usuario_subida = u.id_usuario
      WHERE IFNULL(r.estado, 1) = 1
        AND (
          r.id_carrera = ?
          OR u.id_carrera = ?
          OR EXISTS (
            SELECT 1
            FROM recurso_materia rm
            INNER JOIN materia m ON rm.id_materia = m.id_materia
            WHERE rm.id_recurso = r.id_recurso
              AND IFNULL(rm.estado, 'ACTIVO') = 'ACTIVO'
              AND m.id_carrera = ?
          )
        )
      `,
      [idCarrera, idCarrera, idCarrera]
    );

    return res.json({
      ok: true,
      solicitudes,
      metricas: {
        total: Number(metricas.total || 0),
        pendientes: Number(metricas.pendientes || 0),
        aprobadas: Number(metricas.aprobadas || 0),
        rechazadas: Number(metricas.rechazadas || 0),
      },
    });
  } catch (error) {
    console.error("Error al listar solicitudes del gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al listar solicitudes del gestor",
      error: error.message,
      sql: error.sql,
    });
  }
};

const aprobarSolicitudGestor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_carrera,
      id_admin_aprobacion = null,
      observacion = "Aprobado desde el panel gestor",
    } = req.body;

    const idCarrera = Number(id_carrera);

    if (!idCarrera) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se recibió la carrera del gestor",
      });
    }

    const permitido = await recursoPerteneceACarrera(id, idCarrera);

    if (!permitido) {
      return res.status(403).json({
        ok: false,
        mensaje: "El recurso no pertenece a la carrera asignada al gestor",
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE recurso
      SET
        estado_aprobacion = 'APROBADO',
        id_admin_aprobacion = ?,
        fecha_aprobacion = NOW(),
        observacion_aprobacion = ?,
        descarga_habilitada = 1,
        visualizacion_habilitada = 1
      WHERE id_recurso = ?
      `,
      [id_admin_aprobacion, observacion, id]
    );

    await db.query(
      `
      UPDATE solicitud
      SET estado = 'APROBADO'
      WHERE id_recurso = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Solicitud aprobada correctamente",
    });
  } catch (error) {
    console.error("Error al aprobar solicitud del gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al aprobar la solicitud del gestor",
      error: error.message,
      sql: error.sql,
    });
  }
};

const rechazarSolicitudGestor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_carrera,
      id_admin_aprobacion = null,
      observacion,
    } = req.body;

    const idCarrera = Number(id_carrera);

    if (!idCarrera) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se recibió la carrera del gestor",
      });
    }

    if (!observacion || observacion.trim() === "") {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes escribir el motivo del rechazo",
      });
    }

    const permitido = await recursoPerteneceACarrera(id, idCarrera);

    if (!permitido) {
      return res.status(403).json({
        ok: false,
        mensaje: "El recurso no pertenece a la carrera asignada al gestor",
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE recurso
      SET
        estado_aprobacion = 'RECHAZADO',
        id_admin_aprobacion = ?,
        fecha_aprobacion = NOW(),
        observacion_aprobacion = ?
      WHERE id_recurso = ?
      `,
      [id_admin_aprobacion, observacion.trim(), id]
    );

    await db.query(
      `
      UPDATE solicitud
      SET estado = 'RECHAZADO'
      WHERE id_recurso = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Solicitud rechazada correctamente",
      motivo: observacion.trim(),
    });
  } catch (error) {
    console.error("Error al rechazar solicitud del gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al rechazar la solicitud del gestor",
      error: error.message,
      sql: error.sql,
    });
  }
};

module.exports = {
  listarSolicitudesGestor,
  aprobarSolicitudGestor,
  rechazarSolicitudGestor,
};