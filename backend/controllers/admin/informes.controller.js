const db = require("../../config/db").promise();

const calcularPorcentaje = (valor, maximo) => {
  const numero = Number(valor || 0);
  const base = Number(maximo || 1);

  if (base <= 0) return 0;

  return Math.min(100, Math.round((numero / base) * 100));
};

const obtenerInformes = async (req, res) => {
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

    const [[solicitudesRow]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazadas
      FROM solicitud
    `);

    const [[descargasRow]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(fecha_descarga) = CURDATE() THEN 1 ELSE 0 END) AS hoy
      FROM descarga
    `);

    const [[materiasRow]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM materia
      WHERE IFNULL(estado, 1) = 1
    `);

    const [recursosPorCategoria] = await db.query(`
      SELECT
        COALESCE(c.nombre_categoria, 'Sin categoría') AS nombre,
        COUNT(r.id_recurso) AS total
      FROM recurso r
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      WHERE r.estado = 1
      GROUP BY c.id_categoria, c.nombre_categoria
      ORDER BY total DESC
      LIMIT 6
    `);

    const [recursosMasDescargados] = await db.query(`
      SELECT
        r.id_recurso,
        r.titulo,
        COUNT(d.id_descarga) AS total_descargas
      FROM descarga d
      INNER JOIN recurso r ON d.id_recurso = r.id_recurso
      GROUP BY r.id_recurso, r.titulo
      ORDER BY total_descargas DESC
      LIMIT 5
    `);

    const totalRecursos = Number(recursosRow.total || 0);
    const aprobados = Number(recursosRow.aprobados || 0);
    const pendientes = Number(recursosRow.pendientes || 0);
    const rechazados = Number(recursosRow.rechazados || 0);

    const totalUsuarios = Number(usuariosRow.total || 0);
    const totalSolicitudes = Number(solicitudesRow.total || 0);
    const totalDescargas = Number(descargasRow.total || 0);
    const totalMaterias = Number(materiasRow.total || 0);

    const maximo = Math.max(
      totalRecursos,
      totalUsuarios,
      totalSolicitudes,
      totalDescargas,
      totalMaterias,
      1
    );

    const actividadPorModulo = [
      {
        modulo: "Recursos",
        valor: totalRecursos,
        porcentaje: calcularPorcentaje(totalRecursos, maximo),
        tipo: "primary",
      },
      {
        modulo: "Usuarios",
        valor: totalUsuarios,
        porcentaje: calcularPorcentaje(totalUsuarios, maximo),
        tipo: "success",
      },
      {
        modulo: "Solicitudes",
        valor: totalSolicitudes,
        porcentaje: calcularPorcentaje(totalSolicitudes, maximo),
        tipo: "warning",
      },
      {
        modulo: "Descargas",
        valor: totalDescargas,
        porcentaje: calcularPorcentaje(totalDescargas, maximo),
        tipo: "danger",
      },
      {
        modulo: "Materias",
        valor: totalMaterias,
        porcentaje: calcularPorcentaje(totalMaterias, maximo),
        tipo: "info",
      },
    ];

    const informes = [
      {
        id: 1,
        titulo: "Reporte general de recursos digitales",
        tipo: "Recursos",
        periodo: "Actual",
        fecha: new Date().toLocaleDateString("es-BO"),
        estado: "Generado",
        registros: totalRecursos,
        responsable: "Sistema SITEC",
        descripcion: `Recursos registrados: ${totalRecursos}. Aprobados: ${aprobados}, pendientes: ${pendientes}, rechazados: ${rechazados}.`,
      },
      {
        id: 2,
        titulo: "Reporte de usuarios activos",
        tipo: "Usuarios",
        periodo: "Actual",
        fecha: new Date().toLocaleDateString("es-BO"),
        estado: "Generado",
        registros: totalUsuarios,
        responsable: "Sistema SITEC",
        descripcion: `Usuarios activos: ${totalUsuarios}. Estudiantes: ${usuariosRow.estudiantes || 0}, docentes: ${usuariosRow.docentes || 0}, administradores: ${usuariosRow.administradores || 0}.`,
      },
      {
        id: 3,
        titulo: "Reporte de solicitudes",
        tipo: "Solicitudes",
        periodo: "Actual",
        fecha: new Date().toLocaleDateString("es-BO"),
        estado: pendientes > 0 ? "Pendiente" : "Generado",
        registros: totalSolicitudes,
        responsable: "Sistema SITEC",
        descripcion: `Solicitudes registradas: ${totalSolicitudes}. Pendientes: ${solicitudesRow.pendientes || 0}, aprobadas: ${solicitudesRow.aprobadas || 0}, rechazadas: ${solicitudesRow.rechazadas || 0}.`,
      },
      {
        id: 4,
        titulo: "Reporte de descargas",
        tipo: "Descargas",
        periodo: "Actual",
        fecha: new Date().toLocaleDateString("es-BO"),
        estado: "Generado",
        registros: totalDescargas,
        responsable: "Sistema SITEC",
        descripcion: `Total de descargas registradas: ${totalDescargas}. Descargas realizadas hoy: ${descargasRow.hoy || 0}.`,
      },
      {
        id: 5,
        titulo: "Reporte de materias registradas",
        tipo: "Materias",
        periodo: "Actual",
        fecha: new Date().toLocaleDateString("es-BO"),
        estado: "Generado",
        registros: totalMaterias,
        responsable: "Sistema SITEC",
        descripcion: `Total de materias registradas en la plataforma: ${totalMaterias}.`,
      },
    ];

    const indicadores = [
      {
        nombre: "Recursos publicados",
        valor: totalRecursos > 0 ? `${calcularPorcentaje(aprobados, totalRecursos)}%` : "0%",
        detalle: "Del total registrado",
      },
      {
        nombre: "Solicitudes atendidas",
        valor:
          totalSolicitudes > 0
            ? `${calcularPorcentaje(
                Number(solicitudesRow.aprobadas || 0) +
                  Number(solicitudesRow.rechazadas || 0),
                totalSolicitudes
              )}%`
            : "0%",
        detalle: "Aprobadas o rechazadas",
      },
      {
        nombre: "Usuarios activos",
        valor: totalUsuarios.toLocaleString("es-BO"),
        detalle: "Registrados activos",
      },
    ];

    return res.json({
      ok: true,
      informes,
      actividadPorModulo,
      indicadores,
      recursosPorCategoria,
      recursosMasDescargados,
      resumen: {
        totalRecursos,
        aprobados,
        pendientes,
        rechazados,
        totalUsuarios,
        totalSolicitudes,
        totalDescargas,
        totalMaterias,
      },
    });
  } catch (error) {
    console.error("Error al obtener informes:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener informes administrativos",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerInformes,
};