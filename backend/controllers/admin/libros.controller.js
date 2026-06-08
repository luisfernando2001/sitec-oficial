const db = require("../../config/db").promise();

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
};

const normalizarEstado = (estado) => {
  const valor = String(estado || "PENDIENTE").toUpperCase();

  if (valor === "APROBADO" || valor === "PUBLICADO") return "APROBADO";
  if (valor === "RECHAZADO") return "RECHAZADO";

  return "PENDIENTE";
};

const obtenerOCrearCategoria = async (conexion, nombreCategoria) => {
  const nombre = limpiarTexto(nombreCategoria);

  if (!nombre) return null;

  const [existe] = await conexion.query(
    `
    SELECT id_categoria 
    FROM categoria 
    WHERE LOWER(nombre_categoria) = LOWER(?) 
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_categoria;

  const [resultado] = await conexion.query(
    `
    INSERT INTO categoria 
    (nombre_categoria, tipo, estado)
    VALUES (?, 'Académica', 1)
    `,
    [nombre]
  );

  return resultado.insertId;
};

const obtenerOCrearAutor = async (conexion, nombreAutor) => {
  const nombre = limpiarTexto(nombreAutor);

  if (!nombre) return null;

  const [existe] = await conexion.query(
    `
    SELECT id_autor
    FROM autor
    WHERE LOWER(TRIM(CONCAT_WS(' ', nombre_autor, apellido_autor))) = LOWER(?)
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_autor;

  const [resultado] = await conexion.query(
    `
    INSERT INTO autor 
    (nombre_autor, apellido_autor, nacionalidad)
    VALUES (?, '', 'No especificada')
    `,
    [nombre]
  );

  return resultado.insertId;
};

const obtenerOCrearEditorial = async (conexion, nombreEditorial) => {
  const nombre = limpiarTexto(nombreEditorial);

  if (!nombre) return null;

  const [existe] = await conexion.query(
    `
    SELECT id_editorial 
    FROM editorial 
    WHERE LOWER(nombre_editorial) = LOWER(?) 
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_editorial;

  const [resultado] = await conexion.query(
    `
    INSERT INTO editorial 
    (nombre_editorial, pais)
    VALUES (?, 'No especificado')
    `,
    [nombre]
  );

  return resultado.insertId;
};

const listarLibros = async (req, res) => {
  try {
    const [libros] = await db.query(`
      SELECT
        r.id_recurso AS id,
        r.id_recurso,
        r.titulo,
        r.archivo_digital,
        r.portada,
        r.isbn,
        r.anio_publicacion AS anio,
        r.formato,
        r.idioma,
        r.tipo,
        r.resumen,
        r.fecha_registro,
        r.estado_aprobacion,

        CASE
          WHEN r.estado_aprobacion = 'APROBADO' THEN 'Publicado'
          WHEN r.estado_aprobacion = 'RECHAZADO' THEN 'Rechazado'
          ELSE 'Pendiente'
        END AS estado,

        c.nombre_categoria AS categoria,
        e.nombre_editorial AS editorial,
        TRIM(CONCAT_WS(' ', a.nombre_autor, a.apellido_autor)) AS autor,

        COALESCE(d.total_descargas, 0) AS descargas,

        rel.id_materia,
        rel.id_carrera,
        rel.ids_materia,
        rel.ids_carrera,
        COALESCE(rel.materias, 'Sin materia') AS materia,
        COALESCE(rel.carreras, 'Sin carrera') AS carrera,

        CASE
          WHEN rel.tipos_carrera LIKE '%DEPARTAMENTO%' THEN 'Materias Básicas'
          ELSE 'Pregrado'
        END AS nivel
      FROM recurso r
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      LEFT JOIN autor a ON r.id_autor = a.id_autor
      LEFT JOIN editorial e ON r.id_editorial = e.id_editorial

      LEFT JOIN (
        SELECT 
          rm.id_recurso,

          CAST(SUBSTRING_INDEX(
            GROUP_CONCAT(m.id_materia ORDER BY m.id_materia SEPARATOR ','),
            ',', 
            1
          ) AS UNSIGNED) AS id_materia,

          CAST(SUBSTRING_INDEX(
            GROUP_CONCAT(ca.id_carrera ORDER BY ca.id_carrera SEPARATOR ','),
            ',', 
            1
          ) AS UNSIGNED) AS id_carrera,

          GROUP_CONCAT(DISTINCT m.id_materia ORDER BY m.id_materia SEPARATOR ',') AS ids_materia,
          GROUP_CONCAT(DISTINCT ca.id_carrera ORDER BY ca.id_carrera SEPARATOR ',') AS ids_carrera,

          GROUP_CONCAT(
            DISTINCT CONCAT(
              COALESCE(m.sigla_materia, ''),
              CASE 
                WHEN m.sigla_materia IS NULL OR m.sigla_materia = '' 
                THEN '' 
                ELSE ' - ' 
              END,
              m.nombre_materia
            )
            ORDER BY m.nombre_materia
            SEPARATOR ' | '
          ) AS materias,

          GROUP_CONCAT(
            DISTINCT ca.nombre_carrera
            ORDER BY ca.nombre_carrera
            SEPARATOR ' | '
          ) AS carreras,

          GROUP_CONCAT(
            DISTINCT ca.tipo
            ORDER BY ca.tipo
            SEPARATOR ','
          ) AS tipos_carrera

        FROM recurso_materia rm
        INNER JOIN materia m ON rm.id_materia = m.id_materia
        INNER JOIN carrera ca ON m.id_carrera = ca.id_carrera
        WHERE rm.estado = 'ACTIVO'
        GROUP BY rm.id_recurso
      ) rel ON r.id_recurso = rel.id_recurso

      LEFT JOIN (
        SELECT id_recurso, COUNT(*) AS total_descargas
        FROM descarga
        GROUP BY id_recurso
      ) d ON r.id_recurso = d.id_recurso

      WHERE IFNULL(r.estado, 1) = 1
      ORDER BY r.fecha_registro DESC, r.id_recurso DESC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS totalLibros,
        SUM(CASE WHEN estado_aprobacion = 'APROBADO' THEN 1 ELSE 0 END) AS publicados,
        SUM(CASE WHEN estado_aprobacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado_aprobacion = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados
      FROM recurso
      WHERE IFNULL(estado, 1) = 1
    `);

    const [[descargas]] = await db.query(`
      SELECT COUNT(*) AS descargasTotales
      FROM descarga
    `);

    const [categorias] = await db.query(`
      SELECT id_categoria, nombre_categoria
      FROM categoria
      WHERE IFNULL(estado, 1) = 1
      ORDER BY nombre_categoria ASC
    `);

    const [carreras] = await db.query(`
      SELECT 
        id_carrera,
        nombre_carrera,
        sigla,
        tipo
      FROM carrera
      WHERE IFNULL(estado, 1) = 1
      ORDER BY 
        CASE WHEN tipo = 'DEPARTAMENTO' THEN 1 ELSE 0 END,
        nombre_carrera ASC
    `);

    const [materias] = await db.query(`
      SELECT
        m.id_materia,
        m.id_carrera,
        m.nombre_materia,
        m.sigla_materia,
        c.nombre_carrera,
        c.tipo AS tipo_carrera,
        s.numero_semestre,
        s.nombre_semestre,
        ab.nombre_area
      FROM materia m
      INNER JOIN carrera c ON m.id_carrera = c.id_carrera
      LEFT JOIN semestre s ON m.id_semestre = s.id_semestre
      LEFT JOIN area_basica ab ON m.id_area_basica = ab.id_area_basica
      WHERE IFNULL(m.estado, 1) = 1
      ORDER BY 
        CASE WHEN c.tipo = 'DEPARTAMENTO' THEN 1 ELSE 0 END,
        c.nombre_carrera ASC,
        s.numero_semestre ASC,
        m.nombre_materia ASC
    `);

    return res.json({
      ok: true,
      libros,
      metricas: {
        totalLibros: Number(metricas.totalLibros || 0),
        publicados: Number(metricas.publicados || 0),
        pendientes: Number(metricas.pendientes || 0),
        rechazados: Number(metricas.rechazados || 0),
        descargasTotales: Number(descargas.descargasTotales || 0),
      },
      categorias: categorias.map((item) => item.nombre_categoria),
      carreras,
      materias: materias.map((item) => ({
        id_materia: item.id_materia,
        id_carrera: item.id_carrera,
        nombre_materia: item.nombre_materia,
        sigla_materia: item.sigla_materia,
        nombre_carrera: item.nombre_carrera,
        tipo_carrera: item.tipo_carrera,
        numero_semestre: item.numero_semestre,
        nombre_semestre: item.nombre_semestre,
        nombre_area: item.nombre_area,
        etiqueta:
          item.tipo_carrera === "DEPARTAMENTO"
            ? `${item.sigla_materia || ""} - ${item.nombre_materia} | ${
                item.nombre_area || "Materias Básicas"
              }`
            : `${item.sigla_materia || ""} - ${item.nombre_materia} | ${
                item.nombre_semestre || "Sin semestre"
              }`,
      })),
    });
  } catch (error) {
    console.error("Error al listar libros:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al listar libros",
      error: error.message,
    });
  }
};

const crearLibro = async (req, res) => {
  try {
    await db.beginTransaction();

    const {
      titulo,
      autor,
      categoria,
      editorial,
      anio,
      id_materia,
      formato = "PDF",
      idioma = "Español",
      tipo = "Libro digital",
      resumen = "",
      estado_aprobacion = "PENDIENTE",
      id_usuario_subida = null,
    } = req.body;

    if (!limpiarTexto(titulo)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El título es obligatorio",
      });
    }

    if (!limpiarTexto(autor)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El autor es obligatorio",
      });
    }

    if (!limpiarTexto(categoria)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "La categoría es obligatoria",
      });
    }

    if (!req.file) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "Debes cargar el archivo digital del recurso",
      });
    }

    const idCategoria = await obtenerOCrearCategoria(db, categoria);
    const idAutor = await obtenerOCrearAutor(db, autor);
    const idEditorial = await obtenerOCrearEditorial(db, editorial);

    const estadoFinal = normalizarEstado(estado_aprobacion);

    const archivoDigital = `uploads/recursos/${req.file.filename}`;

    const [resultado] = await db.query(
      `
      INSERT INTO recurso (
        id_categoria,
        id_editorial,
        id_autor,
        id_usuario_subida,
        titulo,
        anio_publicacion,
        formato,
        archivo_digital,
        resumen,
        idioma,
        tipo,
        fecha_registro,
        estado,
        estado_aprobacion,
        fecha_aprobacion,
        descarga_habilitada,
        visualizacion_habilitada,
        tipo_visualizacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, ?, ?, 1, 1, 'INDEFINIDO')
      `,
      [
        idCategoria,
        idEditorial,
        idAutor,
        id_usuario_subida || null,
        limpiarTexto(titulo),
        anio || null,
        formato,
        archivoDigital,
        resumen,
        idioma,
        tipo,
        estadoFinal,
        estadoFinal === "APROBADO" ? new Date() : null,
      ]
    );

    const idRecurso = resultado.insertId;

    if (id_materia) {
      await db.query(
        `
        INSERT INTO recurso_materia (
          id_recurso,
          id_materia,
          descarga_habilitada,
          visualizacion_habilitada,
          tipo_visualizacion,
          estado
        )
        VALUES (?, ?, 1, 1, 'INDEFINIDO', 'ACTIVO')
        `,
        [idRecurso, id_materia]
      );
    }

    await db.commit();

    return res.status(201).json({
      ok: true,
      mensaje: "Recurso registrado correctamente",
      id: idRecurso,
      id_recurso: idRecurso,
      archivo_digital: archivoDigital,
    });
  } catch (error) {
    await db.rollback();

    console.error("Error al crear recurso:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al registrar recurso",
      error: error.message,
    });
  }
};

const actualizarLibro = async (req, res) => {
  try {
    await db.beginTransaction();

    const { id } = req.params;

    const {
      titulo,
      autor,
      categoria,
      editorial,
      anio,
      id_materia,
      formato = "PDF",
      idioma = "Español",
      tipo = "Libro digital",
      resumen = "",
      estado_aprobacion = "PENDIENTE",
    } = req.body;

    if (!limpiarTexto(titulo)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El título es obligatorio",
      });
    }

    if (!limpiarTexto(autor)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El autor es obligatorio",
      });
    }

    if (!limpiarTexto(categoria)) {
      await db.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "La categoría es obligatoria",
      });
    }

    const idCategoria = await obtenerOCrearCategoria(db, categoria);
    const idAutor = await obtenerOCrearAutor(db, autor);
    const idEditorial = await obtenerOCrearEditorial(db, editorial);

    const estadoFinal = normalizarEstado(estado_aprobacion);

    const archivoDigital = req.file
      ? `uploads/recursos/${req.file.filename}`
      : null;

    const [resultado] = await db.query(
      `
      UPDATE recurso
      SET
        id_categoria = ?,
        id_editorial = ?,
        id_autor = ?,
        titulo = ?,
        anio_publicacion = ?,
        formato = ?,
        archivo_digital = COALESCE(?, archivo_digital),
        resumen = ?,
        idioma = ?,
        tipo = ?,
        estado_aprobacion = ?,
        fecha_aprobacion = CASE
          WHEN ? = 'APROBADO' THEN COALESCE(fecha_aprobacion, NOW())
          ELSE fecha_aprobacion
        END
      WHERE id_recurso = ?
      `,
      [
        idCategoria,
        idEditorial,
        idAutor,
        limpiarTexto(titulo),
        anio || null,
        formato,
        archivoDigital,
        resumen,
        idioma,
        tipo,
        estadoFinal,
        estadoFinal,
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      await db.rollback();

      return res.status(404).json({
        ok: false,
        mensaje: "Recurso no encontrado",
      });
    }

    await db.query(
      `
      UPDATE recurso_materia
      SET estado = 'INACTIVO'
      WHERE id_recurso = ?
      `,
      [id]
    );

    if (id_materia) {
      await db.query(
        `
        INSERT INTO recurso_materia (
          id_recurso,
          id_materia,
          descarga_habilitada,
          visualizacion_habilitada,
          tipo_visualizacion,
          estado
        )
        VALUES (?, ?, 1, 1, 'INDEFINIDO', 'ACTIVO')
        `,
        [id, id_materia]
      );
    }

    await db.query(
      `
      UPDATE solicitud
      SET estado = ?
      WHERE id_recurso = ?
      `,
      [estadoFinal, id]
    );

    await db.commit();

    return res.json({
      ok: true,
      mensaje: "Recurso actualizado correctamente",
      archivo_digital: archivoDigital,
    });
  } catch (error) {
    await db.rollback();

    console.error("Error al actualizar recurso:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar recurso",
      error: error.message,
    });
  }
};

const eliminarLibro = async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await db.query(
      `
      UPDATE recurso
      SET estado = 0
      WHERE id_recurso = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Recurso no encontrado",
      });
    }

    await db.query(
      `
      UPDATE recurso_materia
      SET estado = 'INACTIVO'
      WHERE id_recurso = ?
      `,
      [id]
    );

    return res.json({
      ok: true,
      mensaje: "Recurso eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar recurso:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar recurso",
      error: error.message,
    });
  }
};

module.exports = {
  listarLibros,
  crearLibro,
  actualizarLibro,
  eliminarLibro,

  obtenerLibrosAdmin: listarLibros,
  crearLibroAdmin: crearLibro,
  actualizarLibroAdmin: actualizarLibro,
  eliminarLibroAdmin: eliminarLibro,
};