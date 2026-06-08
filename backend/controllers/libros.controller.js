const db = require("../config/db");

const selectRecursos = `
  SELECT
    r.id_recurso,
    r.id_recurso AS id,
    r.id_recurso AS id_libro,
    r.titulo,
    r.titulo AS titulo_libro,
    r.portada,
    r.isbn,
    r.anio_publicacion,
    r.anio_publicacion AS anio,
    r.formato,
    r.url_acceso,
    r.archivo_digital,
    r.resumen,
    r.resumen AS descripcion,
    r.idioma,
    r.tipo,
    r.fecha_registro,
    r.estado,
    r.estado_aprobacion,
    r.descarga_habilitada,
    r.visualizacion_habilitada,
    r.tipo_visualizacion,
    r.dias_visualizacion,

    c.nombre_categoria,
    c.nombre_categoria AS categoria,

    a.nombre_autor,
    a.apellido_autor,
    CONCAT_WS(' ', a.nombre_autor, a.apellido_autor) AS autor,

    e.nombre_editorial,
    e.nombre_editorial AS editorial
  FROM recurso r
  LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
  LEFT JOIN autor a ON r.id_autor = a.id_autor
  LEFT JOIN editorial e ON r.id_editorial = e.id_editorial
`;

const obtenerRecursos = (req, res) => {
  const sql = `
    ${selectRecursos}
    WHERE r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'
    ORDER BY r.fecha_registro DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error al obtener recursos:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener recursos",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      total: results.length,
      recursos: results,
      libros: results,
    });
  });
};

const obtenerRecientes = (req, res) => {
  const sql = `
    ${selectRecursos}
    WHERE r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'
    ORDER BY r.fecha_registro DESC
    LIMIT 6
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error al obtener recursos recientes:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener recursos recientes",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      total: results.length,
      recursos: results,
      libros: results,
    });
  });
};

const buscarRecursos = (req, res) => {

  const q = req.query.q || "";
  const formato = req.query.formato || "";
  const categoria = req.query.categoria || "";

  let sql = `
    ${selectRecursos}

    WHERE r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'
  `;

  const valores = [];


  // BUSCADOR GENERAL
  if (q) {

    sql += `
      AND (
        r.titulo LIKE ?
        OR r.resumen LIKE ?
        OR c.nombre_categoria LIKE ?
        OR a.nombre_autor LIKE ?
        OR a.apellido_autor LIKE ?
        OR e.nombre_editorial LIKE ?
      )
    `;

    valores.push(
      `%${q}%`,
      `%${q}%`,
      `%${q}%`,
      `%${q}%`,
      `%${q}%`,
      `%${q}%`
    );

  }


  // FILTRO FORMATO
  if (
    formato &&
    formato !== "Todos"
  ) {

    sql += `
      AND UPPER(r.formato) = UPPER(?)
    `;

    valores.push(formato);

  }


  // FILTRO CATEGORIA
  if (
    categoria &&
    categoria !== "Todas"
  ) {

    sql += `
      AND c.nombre_categoria = ?
    `;

    valores.push(categoria);

  }


  sql += `
    ORDER BY r.fecha_registro DESC
  `;


  db.query(
    sql,
    valores,
    (error, results) => {

      if (error) {

        return res.status(500).json({
          ok: false,
          mensaje: "Error al buscar recursos",
          error: error.message
        });

      }

      return res.json({
        ok: true,
        recursos: results
      });

    }
  );

};
const obtenerRecursoPorId = (req, res) => {
  const { id } = req.params;

  const sql = `
    ${selectRecursos}
    WHERE r.id_recurso = ?
    AND r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'
    LIMIT 1
  `;

  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error("Error al obtener recurso:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener recurso",
        error: error.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Recurso no encontrado",
      });
    }

    return res.json({
      ok: true,
      recurso: results[0],
      libro: results[0],
    });
  });
};

const crearRecurso = (req, res) => {
  const {
    titulo,
    id_categoria = null,
    id_editorial = null,
    id_autor = null,
    id_usuario_subida = null,
    isbn = null,
    anio_publicacion = null,
    formato = "PDF",
    url_acceso = null,
    archivo_digital = null,
    resumen = "",
    idioma = "Español",
    tipo = "Libro digital",
  } = req.body;

  if (!titulo || !titulo.trim()) {
    return res.status(400).json({
      ok: false,
      mensaje: "El título del recurso es obligatorio",
    });
  }

  const sql = `
    INSERT INTO recurso (
      id_categoria,
      id_editorial,
      id_autor,
      id_usuario_subida,
      titulo,
      isbn,
      anio_publicacion,
      formato,
      url_acceso,
      archivo_digital,
      resumen,
      idioma,
      tipo,
      estado,
      estado_aprobacion,
      descarga_habilitada,
      visualizacion_habilitada,
      tipo_visualizacion
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'PENDIENTE', 1, 1, 'INDEFINIDO')
  `;

  const valores = [
    id_categoria,
    id_editorial,
    id_autor,
    id_usuario_subida,
    titulo,
    isbn,
    anio_publicacion,
    formato,
    url_acceso,
    archivo_digital,
    resumen,
    idioma,
    tipo,
  ];

  db.query(sql, valores, (error, result) => {
    if (error) {
      console.error("Error al crear recurso:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al crear recurso",
        error: error.message,
      });
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Recurso registrado correctamente y pendiente de aprobación",
      id_recurso: result.insertId,
    });
  });
};

const obtenerCategorias = (req, res) => {

  const sql = `
    SELECT *
    FROM categoria
    ORDER BY nombre_categoria ASC
  `;

  db.query(sql, (error, results) => {

    if (error) {

      return res.status(500).json({
        ok: false,
        error: error.message
      });

    }

    return res.json({
      ok: true,
      categorias: results
    });

  });

};

module.exports = {
  obtenerRecursos,
  obtenerLibros: obtenerRecursos,
  obtenerRecientes,
  buscarRecursos,
  obtenerRecursoPorId,
  crearRecurso,
  crearLibro: crearRecurso,
  obtenerCategorias,
};