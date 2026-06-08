const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("../../config/db").promise();

const router = express.Router();

/* CONFIGURACIÓN MULTER */
const carpetaRecursos = path.join(__dirname, "../../uploads/recursos");

if (!fs.existsSync(carpetaRecursos)) {
  fs.mkdirSync(carpetaRecursos, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaRecursos);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const nombreSeguro = file.originalname
      .replace(extension, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    cb(null, `${Date.now()}-${nombreSeguro}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

/* HELPERS */
const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
};

const obtenerOCrearCategoria = async (nombreCategoria) => {
  const nombre = limpiarTexto(nombreCategoria);

  if (!nombre) return null;

  const [existe] = await db.query(
    `
    SELECT id_categoria
    FROM categoria
    WHERE LOWER(nombre_categoria) = LOWER(?)
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_categoria;

  const [resultado] = await db.query(
    `
    INSERT INTO categoria (nombre_categoria, tipo, estado)
    VALUES (?, 'Académica', 1)
    `,
    [nombre]
  );

  return resultado.insertId;
};

const obtenerOCrearAutor = async (nombreAutor) => {
  const nombre = limpiarTexto(nombreAutor);

  if (!nombre) return null;

  const [existe] = await db.query(
    `
    SELECT id_autor
    FROM autor
    WHERE LOWER(TRIM(CONCAT_WS(' ', nombre_autor, apellido_autor))) = LOWER(?)
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_autor;

  const [resultado] = await db.query(
    `
    INSERT INTO autor (nombre_autor, apellido_autor, nacionalidad)
    VALUES (?, '', 'No especificada')
    `,
    [nombre]
  );

  return resultado.insertId;
};

const obtenerOCrearEditorial = async (nombreEditorial) => {
  const nombre = limpiarTexto(nombreEditorial);

  if (!nombre) return null;

  const [existe] = await db.query(
    `
    SELECT id_editorial
    FROM editorial
    WHERE LOWER(nombre_editorial) = LOWER(?)
    LIMIT 1
    `,
    [nombre]
  );

  if (existe.length > 0) return existe[0].id_editorial;

  const [resultado] = await db.query(
    `
    INSERT INTO editorial (nombre_editorial, pais)
    VALUES (?, 'No especificado')
    `,
    [nombre]
  );

  return resultado.insertId;
};

/* GET /api/gestor/libros/:idCarrera */
router.get("/:idCarrera", async (req, res) => {
  try {
    const idCarrera = Number(req.params.idCarrera);

    if (!idCarrera) {
      return res.status(400).json({
        ok: false,
        mensaje: "Carrera no válida",
      });
    }

    const [libros] = await db.query(
      `
      SELECT
        r.id_recurso AS id,
        r.id_recurso,
        r.titulo,
        r.resumen,
        r.archivo_digital,
        r.portada,
        r.formato,
        r.idioma,
        r.anio_publicacion AS anio,
        r.estado_aprobacion,
        r.id_carrera,

        CASE
          WHEN r.estado_aprobacion = 'APROBADO' THEN 'Publicado'
          WHEN r.estado_aprobacion = 'RECHAZADO' THEN 'Rechazado'
          ELSE 'Pendiente'
        END AS estado,

        TRIM(CONCAT_WS(' ', a.nombre_autor, a.apellido_autor)) AS autor,
        c.nombre_categoria AS categoria,
        e.nombre_editorial AS editorial,

        COALESCE(d.total_descargas, 0) AS descargas,

        rel.id_materia,
        rel.materia,
        rel.materias

      FROM recurso r

      LEFT JOIN autor a ON r.id_autor = a.id_autor
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      LEFT JOIN editorial e ON r.id_editorial = e.id_editorial

      LEFT JOIN (
        SELECT 
          rm.id_recurso,
          MIN(m.id_materia) AS id_materia,
          MIN(m.nombre_materia) AS materia,
          GROUP_CONCAT(
            DISTINCT CONCAT(
              COALESCE(m.sigla_materia, ''),
              CASE 
                WHEN m.sigla_materia IS NULL OR m.sigla_materia = '' THEN ''
                ELSE ' - '
              END,
              m.nombre_materia
            )
            ORDER BY m.nombre_materia
            SEPARATOR ' | '
          ) AS materias
        FROM recurso_materia rm
        INNER JOIN materia m ON rm.id_materia = m.id_materia
        WHERE rm.estado = 'ACTIVO'
        AND m.id_carrera = ?
        GROUP BY rm.id_recurso
      ) rel ON r.id_recurso = rel.id_recurso

      LEFT JOIN (
        SELECT id_recurso, COUNT(*) AS total_descargas
        FROM descarga
        GROUP BY id_recurso
      ) d ON r.id_recurso = d.id_recurso

      WHERE IFNULL(r.estado, 1) = 1
      AND (
        r.id_carrera = ?
        OR rel.id_recurso IS NOT NULL
      )

      ORDER BY r.fecha_registro DESC, r.id_recurso DESC
      `,
      [idCarrera, idCarrera]
    );

    const [[metricas]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT r.id_recurso) AS totalRecursos,
        SUM(CASE WHEN r.estado_aprobacion = 'APROBADO' THEN 1 ELSE 0 END) AS publicados,
        SUM(CASE WHEN r.estado_aprobacion = 'PENDIENTE' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN r.estado_aprobacion = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados
      FROM recurso r
      LEFT JOIN recurso_materia rm ON r.id_recurso = rm.id_recurso
      LEFT JOIN materia m ON rm.id_materia = m.id_materia
      WHERE IFNULL(r.estado, 1) = 1
      AND (
        r.id_carrera = ?
        OR m.id_carrera = ?
      )
      `,
      [idCarrera, idCarrera]
    );

    const [[descargas]] = await db.query(
      `
      SELECT COUNT(*) AS descargasTotales
      FROM descarga d
      INNER JOIN recurso r ON d.id_recurso = r.id_recurso
      LEFT JOIN recurso_materia rm ON r.id_recurso = rm.id_recurso
      LEFT JOIN materia m ON rm.id_materia = m.id_materia
      WHERE r.id_carrera = ?
      OR m.id_carrera = ?
      `,
      [idCarrera, idCarrera]
    );

    const [categorias] = await db.query(
      `
      SELECT id_categoria, nombre_categoria
      FROM categoria
      WHERE IFNULL(estado, 1) = 1
      ORDER BY nombre_categoria ASC
      `
    );

    const [materias] = await db.query(
      `
      SELECT
        m.id_materia,
        m.id_carrera,
        m.nombre_materia,
        m.sigla_materia,
        s.numero_semestre,
        s.nombre_semestre
      FROM materia m
      LEFT JOIN semestre s ON m.id_semestre = s.id_semestre
      WHERE IFNULL(m.estado, 1) = 1
      AND m.id_carrera = ?
      ORDER BY s.numero_semestre ASC, m.nombre_materia ASC
      `,
      [idCarrera]
    );

    return res.json({
      ok: true,
      libros,
      metricas: {
        totalRecursos: Number(metricas.totalRecursos || 0),
        totalLibros: Number(metricas.totalRecursos || 0),
        publicados: Number(metricas.publicados || 0),
        pendientes: Number(metricas.pendientes || 0),
        rechazados: Number(metricas.rechazados || 0),
        descargasTotales: Number(descargas.descargasTotales || 0),
      },
      categorias: categorias.map((item) => item.nombre_categoria),
      materias: materias.map((item) => ({
        id_materia: item.id_materia,
        id_carrera: item.id_carrera,
        nombre_materia: item.nombre_materia,
        sigla_materia: item.sigla_materia,
        nombre_semestre: item.nombre_semestre,
        etiqueta: `${item.sigla_materia || ""} - ${item.nombre_materia} | ${
          item.nombre_semestre || "Sin semestre"
        }`,
      })),
    });
  } catch (error) {
    console.error("Error al obtener libros del gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener libros del gestor",
      error: error.message,
      sql: error.sql,
    });
  }
});

/* POST /api/gestor/libros */
router.post("/", upload.single("archivo"), async (req, res) => {
  const conexion = await db.getConnection();

  try {
    await conexion.beginTransaction();

    const {
      titulo,
      autor,
      categoria,
      editorial,
      anio,
      id_materia,
      formato = "PDF",
      idioma = "Español",
      resumen = "",
      id_carrera,
      id_usuario_subida = null,
    } = req.body;

    if (!limpiarTexto(titulo)) {
      await conexion.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El título es obligatorio",
      });
    }

    if (!id_carrera) {
      await conexion.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "La carrera del gestor es obligatoria",
      });
    }

    const idCategoria = await obtenerOCrearCategoria(categoria || "General");
    const idAutor = await obtenerOCrearAutor(autor || "Autor no registrado");
    const idEditorial = await obtenerOCrearEditorial(editorial || "Editorial no registrada");

    const archivoDigital = req.file
      ? `uploads/recursos/${req.file.filename}`
      : null;

    const [resultado] = await conexion.query(
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
        descarga_habilitada,
        visualizacion_habilitada,
        tipo_visualizacion,
        id_carrera
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Libro digital', NOW(), 1, 'PENDIENTE', 1, 1, 'INDEFINIDO', ?)
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
        id_carrera,
      ]
    );

    const idRecurso = resultado.insertId;

    if (id_materia) {
      await conexion.query(
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

    await conexion.commit();

    return res.status(201).json({
      ok: true,
      mensaje: "Recurso registrado correctamente",
      id: idRecurso,
      id_recurso: idRecurso,
    });
  } catch (error) {
    await conexion.rollback();

    console.error("Error al crear recurso gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al crear recurso del gestor",
      error: error.message,
      sql: error.sql,
    });
  } finally {
    conexion.release();
  }
});

/* PUT /api/gestor/libros/:id */
router.put("/:id", upload.single("archivo"), async (req, res) => {
  const conexion = await db.getConnection();

  try {
    await conexion.beginTransaction();

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
      resumen = "",
    } = req.body;

    if (!limpiarTexto(titulo)) {
      await conexion.rollback();
      return res.status(400).json({
        ok: false,
        mensaje: "El título es obligatorio",
      });
    }

    const idCategoria = await obtenerOCrearCategoria(categoria || "General");
    const idAutor = await obtenerOCrearAutor(autor || "Autor no registrado");
    const idEditorial = await obtenerOCrearEditorial(editorial || "Editorial no registrada");

    const archivoDigital = req.file
      ? `uploads/recursos/${req.file.filename}`
      : null;

    await conexion.query(
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
        idioma = ?
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
        id,
      ]
    );

    await conexion.query(
      `
      UPDATE recurso_materia
      SET estado = 'INACTIVO'
      WHERE id_recurso = ?
      `,
      [id]
    );

    if (id_materia) {
      await conexion.query(
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

    await conexion.commit();

    return res.json({
      ok: true,
      mensaje: "Recurso actualizado correctamente",
    });
  } catch (error) {
    await conexion.rollback();

    console.error("Error al actualizar recurso gestor:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar recurso del gestor",
      error: error.message,
      sql: error.sql,
    });
  } finally {
    conexion.release();
  }
});

module.exports = router;