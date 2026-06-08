const db = require("../../config/db").promise();

const listarSolicitudes = async (req, res) => {
  try {
    const [solicitudes] = await db.query(`
      SELECT
        s.id_solicitud,

        COALESCE(s.id_solicitud, r.id_recurso) AS id,

        s.id_usuario,
        r.id_recurso,
        r.id_recurso AS idRecurso,

        r.titulo,
        r.isbn,
        r.anio_publicacion,
        r.formato,
        r.url_acceso,
        r.archivo_digital,
        r.resumen,
       r.estado_aprobacion AS estado,
        r.fecha_registro,
        r.observacion_aprobacion AS motivo_rechazo,
        r.observacion_aprobacion,
        r.fecha_aprobacion,
        DATE_FORMAT(r.fecha_aprobacion, '%d/%m/%Y %H:%i') AS fecha_revision,
        s.observacion,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''),
          'Usuario no definido'
        ) AS solicitante,

        u.correo AS correo_solicitante,

        COALESCE(c.nombre_categoria, 'Sin categoría') AS area,
        COALESCE(c.nombre_categoria, 'Sin categoría') AS nombre_categoria,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', a.nombre_autor, a.apellido_autor)), ''),
          'Autor no registrado'
        ) AS autor,

        CASE
          WHEN r.archivo_digital IS NOT NULL THEN 'Subida'
          WHEN r.url_acceso IS NOT NULL THEN 'Sugerencia'
          ELSE 'Sugerencia'
        END AS tipo,

        DATE_FORMAT(r.fecha_registro, '%d/%m/%Y') AS fecha_formateada,
        DATE_FORMAT(r.fecha_registro, '%d/%m/%Y') AS fecha

      FROM recurso r
      LEFT JOIN solicitud s ON r.id_recurso = s.id_recurso
      LEFT JOIN usuario u ON r.id_usuario_subida = u.id_usuario
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      LEFT JOIN autor a ON r.id_autor = a.id_autor

      WHERE r.estado = 1
      ORDER BY r.fecha_registro DESC, r.id_recurso DESC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado_aprobacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado_aprobacion = 'APROBADO' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado_aprobacion = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazadas
      FROM recurso
      WHERE estado = 1
    `);

    return res.json({
      ok: true,
      total: solicitudes.length,
      solicitudes,
      metricas: {
        total: Number(metricas.total || 0),
        pendientes: Number(metricas.pendientes || 0),
        aprobadas: Number(metricas.aprobadas || 0),
        rechazadas: Number(metricas.rechazadas || 0),
      },
    });
  } catch (error) {
    console.error("Error al listar solicitudes admin:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al listar solicitudes administrativas",
      error: error.message,
    });
  }
};

const buscarSolicitudORecurso = async (id) => {
  const [solicitudes] = await db.query(
    `
    SELECT 
      s.id_solicitud,
      s.id_recurso
    FROM solicitud s
    WHERE s.id_solicitud = ? OR s.id_recurso = ?
    LIMIT 1
    `,
    [id, id]
  );

  if (solicitudes.length > 0) {
    return {
      id_solicitud: solicitudes[0].id_solicitud,
      id_recurso: solicitudes[0].id_recurso,
      tieneSolicitud: true,
    };
  }

  const [recursos] = await db.query(
    `
    SELECT id_recurso
    FROM recurso
    WHERE id_recurso = ?
    LIMIT 1
    `,
    [id]
  );

  if (recursos.length > 0) {
    return {
      id_solicitud: null,
      id_recurso: recursos[0].id_recurso,
      tieneSolicitud: false,
    };
  }

  return null;
};

const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_admin_aprobacion = null } = req.body;

    const registro = await buscarSolicitudORecurso(id);

    if (!registro) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud o recurso no encontrado",
      });
    }

    await db.query(
      `
      UPDATE recurso
      SET
        estado_aprobacion = 'APROBADO',
        id_admin_aprobacion = ?,
        fecha_aprobacion = NOW()
      WHERE id_recurso = ?
      `,
      [id_admin_aprobacion, registro.id_recurso]
    );

    if (registro.tieneSolicitud) {
      await db.query(
        `
        UPDATE solicitud
        SET estado = 'APROBADO'
        WHERE id_solicitud = ?
        `,
        [registro.id_solicitud]
      );
    }

    return res.json({
      ok: true,
      mensaje: "Solicitud aprobada correctamente",
    });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al aprobar la solicitud",
      error: error.message,
    });
  }
};

const rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      observacion,
      id_admin_aprobacion = null,
    } = req.body;

    if (!observacion || observacion.trim() === "") {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes escribir el motivo del rechazo",
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
      [
        id_admin_aprobacion,
        observacion.trim(),
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Solicitud rechazada correctamente",
      motivo: observacion.trim(),
    });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al rechazar la solicitud",
      error: error.message,
    });
  }
};

module.exports = {
  listarSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
};