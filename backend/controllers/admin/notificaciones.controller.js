const db = require("../../config/db").promise();

const listarNotificaciones = async (req, res) => {
  try {
    const [notificaciones] = await db.query(`
      SELECT
        n.id_notificacion AS id,
        n.id_notificacion,
        n.id_usuario_destino,
        n.id_usuario_origen,
        n.id_recurso,
        n.id_solicitud,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.leida,
        n.estado,
        n.fecha_creacion,
        DATE_FORMAT(n.fecha_creacion, '%d/%m/%Y %H:%i') AS fecha,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''),
          'Usuario no definido'
        ) AS usuario_origen,

        r.titulo AS recurso_titulo

      FROM notificacion n
      LEFT JOIN usuario u ON n.id_usuario_origen = u.id_usuario
      LEFT JOIN recurso r ON n.id_recurso = r.id_recurso
      WHERE n.estado = 1
      ORDER BY n.fecha_creacion DESC
      LIMIT 50
    `);

    const [[conteo]] = await db.query(`
      SELECT COUNT(*) AS no_leidas
      FROM notificacion
      WHERE leida = 0
      AND estado = 1
    `);

    res.json({
      ok: true,
      total: notificaciones.length,
      no_leidas: Number(conteo.no_leidas || 0),
      notificaciones,
    });
  } catch (error) {
    console.error("Error al listar notificaciones:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar notificaciones",
      error: error.message,
    });
  }
};

const contarNoLeidas = async (req, res) => {
  try {
    const [[conteo]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM notificacion
      WHERE leida = 0
      AND estado = 1
    `);

    res.json({
      ok: true,
      total: Number(conteo.total || 0),
    });
  } catch (error) {
    console.error("Error al contar notificaciones:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al contar notificaciones",
      error: error.message,
    });
  }
};

const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `
      UPDATE notificacion
      SET leida = 1
      WHERE id_notificacion = ?
      `,
      [id]
    );

    res.json({
      ok: true,
      mensaje: "Notificación marcada como leída",
    });
  } catch (error) {
    console.error("Error al marcar notificación:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al marcar notificación",
      error: error.message,
    });
  }
};

const marcarTodasLeidas = async (req, res) => {
  try {
    await db.query(`
      UPDATE notificacion
      SET leida = 1
      WHERE estado = 1
    `);

    res.json({
      ok: true,
      mensaje: "Todas las notificaciones fueron marcadas como leídas",
    });
  } catch (error) {
    console.error("Error al marcar todas:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al marcar notificaciones",
      error: error.message,
    });
  }
};

module.exports = {
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
};