const db = require("../../config/db").promise();

const calcularPorcentaje = (valor, maximo) => {
  const numero = Number(valor || 0);
  const base = Number(maximo || 1);

  if (base <= 0) return 0;

  return Math.min(100, Math.round((numero / base) * 100));
};

const obtenerIconoActividad = (tipo = "") => {
  const valor = String(tipo).toLowerCase();

  if (valor.includes("aprob")) return "check";
  if (valor.includes("usuario")) return "user";
  if (valor.includes("recurso") || valor.includes("subida")) return "upload";
  if (valor.includes("solicitud")) return "approval";
  if (valor.includes("descarga")) return "download";

  return "book";
};

const obtenerClaseActividad = (tipo = "") => {
  const valor = String(tipo).toLowerCase();

  if (valor.includes("aprob")) return "success";
  if (valor.includes("usuario")) return "info";
  if (valor.includes("rechaz")) return "warning";
  if (valor.includes("descarga")) return "danger";

  return "primary";
};

const obtenerPanel = async (req, res) => {
  try {
    const [[recursosRow]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado_aprobacion = 'APROBADO' THEN 1 ELSE 0 END) AS aprobados,
        SUM(CASE WHEN estado_aprobacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado_aprobacion = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados
      FROM recurso
      WHERE estado = 1
    `);

    const [[usuariosRow]] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN r.nombre_rol = 'Estudiante' THEN 1 ELSE 0 END) AS estudiantes,
        SUM(CASE WHEN r.nombre_rol = 'Docente' THEN 1 ELSE 0 END) AS docentes,
        SUM(CASE WHEN r.nombre_rol = 'Administrador' THEN 1 ELSE 0 END) AS administradores
      FROM usuario u
      LEFT JOIN rol r ON u.id_rol = r.id_rol
      WHERE IFNULL(u.estado, 1) = 1
    `);

    const [[pendientesRow]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM recurso
      WHERE estado = 1
      AND estado_aprobacion = 'PENDIENTE'
    `);

    const [[descargasRow]] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(fecha_descarga) = CURDATE() THEN 1 ELSE 0 END) AS hoy
      FROM descarga
    `);

    const [solicitudesPendientes] = await db.query(`
      SELECT 
        s.id_solicitud AS id,
        s.id_solicitud,
        s.id_recurso,

        COALESCE(r.titulo, 'Recurso sin título') AS titulo,
        r.formato,
        r.archivo_digital,
        r.url_acceso,
        r.resumen,
        r.estado_aprobacion,

        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''),
          'Solicitante no registrado'
        ) AS solicitante,

        COALESCE(c.nombre_categoria, 'Sin categoría') AS area,

        CASE
          WHEN r.id_usuario_subida IS NOT NULL THEN 'Subida de recurso'
          ELSE 'Solicitud'
        END AS tipo,

        DATE_FORMAT(s.fecha, '%d/%m/%Y') AS fecha,
        s.estado,
        s.observacion
      FROM solicitud s
      INNER JOIN recurso r ON s.id_recurso = r.id_recurso
      LEFT JOIN usuario u ON s.id_usuario = u.id_usuario
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      WHERE s.estado = 'PENDIENTE'
      AND r.estado = 1
      AND r.estado_aprobacion = 'PENDIENTE'
      ORDER BY s.id_solicitud DESC
      LIMIT 5
    `);

    const [actividadRows] = await db.query(`
      SELECT
        au.id_actividad,
        au.id_usuario,
        au.id_recurso,
        au.tipo,
        au.titulo,
        au.detalle,
        au.fecha,
        DATE_FORMAT(au.fecha, '%d/%m/%Y %H:%i') AS fecha_formateada,
        u.nombre,
        u.apellido,
        r.titulo AS titulo_recurso
      FROM actividad_usuario au
      LEFT JOIN usuario u ON au.id_usuario = u.id_usuario
      LEFT JOIN recurso r ON au.id_recurso = r.id_recurso
      WHERE au.estado = 1
      ORDER BY au.fecha DESC
      LIMIT 4
    `);

    const actividadReciente = actividadRows.map((item) => ({
      id_actividad: item.id_actividad,
      id: item.id_actividad,
      icon: obtenerIconoActividad(item.tipo),
      tipo: obtenerClaseActividad(item.tipo),
      titulo: item.titulo || "Actividad registrada",
      detalle: item.detalle || item.fecha_formateada || "Sin detalle",
      fecha: item.fecha,
    }));

    const totalRecursos = Number(recursosRow.total || 0);
    const recursosAprobados = Number(recursosRow.aprobados || 0);
    const recursosPendientes = Number(recursosRow.pendientes || 0);
    const recursosRechazados = Number(recursosRow.rechazados || 0);

    const totalUsuarios = Number(usuariosRow.total || 0);
    const estudiantes = Number(usuariosRow.estudiantes || 0);
    const docentes = Number(usuariosRow.docentes || 0);
    const administradores = Number(usuariosRow.administradores || 0);

    const aprobacionesPendientes = Number(pendientesRow.total || 0);
    const totalDescargas = Number(descargasRow.total || 0);
    const descargasHoy = Number(descargasRow.hoy || 0);

    const maximoResumen = Math.max(
      totalRecursos,
      totalUsuarios,
      aprobacionesPendientes,
      totalDescargas,
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

        usuariosActivos: totalUsuarios,
        estudiantes,
        docentes,
        administradores,

        aprobacionesPendientes,
        solicitudesPendientes: aprobacionesPendientes,

        totalDescargas,
        descargasHoy,
      },

      solicitudesPendientes,

      actividadReciente,

      resumenSistema: [
        {
          nombre: "Recursos digitales",
          valor: totalRecursos,
          porcentaje: calcularPorcentaje(totalRecursos, maximoResumen),
          tipo: "primary",
        },
        {
          nombre: "Usuarios activos",
          valor: totalUsuarios,
          porcentaje: calcularPorcentaje(totalUsuarios, maximoResumen),
          tipo: "success",
        },
        {
          nombre: "Aprobaciones pendientes",
          valor: aprobacionesPendientes,
          porcentaje: calcularPorcentaje(aprobacionesPendientes, maximoResumen),
          tipo: "warning",
        },
        {
          nombre: "Descargas",
          valor: totalDescargas,
          porcentaje: calcularPorcentaje(totalDescargas, maximoResumen),
          tipo: "danger",
        },
      ],
    });
  } catch (error) {
    console.error("Error al obtener panel:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener datos del panel administrativo",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPanel,
};