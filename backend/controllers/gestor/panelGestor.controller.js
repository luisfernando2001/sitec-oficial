const db = require("../../config/db").promise();

const calcularPorcentaje = (valor, maximo) => {
  const numero = Number(valor || 0);
  const base = Number(maximo || 1);

  if (base <= 0) return 0;

  return Math.min(100, Math.round((numero / base) * 100));
};

const obtenerPanelGestor = async (req, res) => {
  try {
    const idCarrera = Number(req.params.idCarrera);

    if (!idCarrera) {
      return res.status(400).json({
        ok: false,
        mensaje: "Carrera no válida",
      });
    }

    /* RECURSOS DE LA CARRERA */

    const [[recursosRow]] = await db.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN r.estado_aprobacion='APROBADO' THEN 1 ELSE 0 END) AS aprobados,
        SUM(CASE WHEN r.estado_aprobacion='PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN r.estado_aprobacion='RECHAZADO' THEN 1 ELSE 0 END) AS rechazados
      FROM recurso r
      INNER JOIN usuario u
        ON r.id_usuario_subida = u.id_usuario
      WHERE r.estado = 1
      AND u.id_carrera = ?
      `,
      [idCarrera]
    );

    /* PENDIENTES DE LA CARRERA */

    const [[pendientesRow]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM recurso r
      INNER JOIN usuario u
        ON r.id_usuario_subida = u.id_usuario
      WHERE r.estado = 1
      AND r.estado_aprobacion = 'PENDIENTE'
      AND u.id_carrera = ?
      `,
      [idCarrera]
    );

    /* SOLICITUDES PENDIENTES */

    const [solicitudesPendientes] = await db.query(
      `
      SELECT
        s.id_solicitud,
        r.id_recurso,
        r.titulo,
        r.formato,
        r.estado_aprobacion,

        CONCAT(
          COALESCE(us.nombre,''),
          ' ',
          COALESCE(us.apellido,'')
        ) AS solicitante,

        DATE_FORMAT(s.fecha,'%d/%m/%Y') AS fecha,
        s.estado

      FROM solicitud s

      INNER JOIN recurso r
        ON s.id_recurso = r.id_recurso

      INNER JOIN usuario ur
        ON r.id_usuario_subida = ur.id_usuario

      LEFT JOIN usuario us
        ON s.id_usuario = us.id_usuario

      WHERE s.estado = 'PENDIENTE'
      AND r.estado = 1
      AND r.estado_aprobacion = 'PENDIENTE'
      AND ur.id_carrera = ?

      ORDER BY s.id_solicitud DESC
      LIMIT 5
      `,
      [idCarrera]
    );

    /* ACTIVIDAD DE LA CARRERA */

    const [actividadRows] = await db.query(
      `
      SELECT
        au.id_actividad,
        au.tipo,
        au.titulo,
        au.detalle,
        au.fecha

      FROM actividad_usuario au

      INNER JOIN recurso r
        ON au.id_recurso = r.id_recurso

      INNER JOIN usuario u
        ON r.id_usuario_subida = u.id_usuario

      WHERE u.id_carrera = ?

      ORDER BY au.fecha DESC
      LIMIT 5
      `,
      [idCarrera]
    );

    const actividadReciente = actividadRows.map((item) => ({
      id: item.id_actividad,
      titulo: item.titulo || "Actividad registrada",
      detalle: item.detalle || "",
      fecha: item.fecha,
      tipo: item.tipo,
    }));

    const totalRecursos = Number(recursosRow.total || 0);
    const recursosAprobados = Number(recursosRow.aprobados || 0);
    const recursosPendientes = Number(recursosRow.pendientes || 0);
    const recursosRechazados = Number(recursosRow.rechazados || 0);

    const aprobacionesPendientes = Number(
      pendientesRow.total || 0
    );

    const maximoResumen = Math.max(
      totalRecursos,
      recursosAprobados,
      recursosPendientes,
      recursosRechazados,
      1
    );

    return res.json({
      ok: true,

      estadisticas: {
        totalLibros: totalRecursos,
        totalRecursos,

        recursosAprobados,
        recursosPendientes,
        recursosRechazados,

        aprobacionesPendientes,
        solicitudesPendientes: aprobacionesPendientes,
      },

      solicitudesPendientes,

      actividadReciente,

      resumenSistema: [
        {
          nombre: "Recursos",
          valor: totalRecursos,
          porcentaje: calcularPorcentaje(
            totalRecursos,
            maximoResumen
          ),
          tipo: "primary",
        },
        {
          nombre: "Aprobados",
          valor: recursosAprobados,
          porcentaje: calcularPorcentaje(
            recursosAprobados,
            maximoResumen
          ),
          tipo: "success",
        },
        {
          nombre: "Pendientes",
          valor: recursosPendientes,
          porcentaje: calcularPorcentaje(
            recursosPendientes,
            maximoResumen
          ),
          tipo: "warning",
        },
        {
          nombre: "Rechazados",
          valor: recursosRechazados,
          porcentaje: calcularPorcentaje(
            recursosRechazados,
            maximoResumen
          ),
          tipo: "danger",
        },
      ],
    });
  } catch (error) {
  console.error(error);

  return res.status(500).json({
    ok: false,
    mensaje: "Error al obtener panel del gestor",
    error: error.message,
    sql: error.sql,
  });

  }
};

module.exports = {
  obtenerPanelGestor,
};

