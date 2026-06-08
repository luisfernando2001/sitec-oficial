const express = require("express");
const router = express.Router();

const db = require("../config/db");

/* Obtener favoritos de un usuario */
router.get("/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT
      f.id_favorito,
      f.fecha_favorito,

      r.id_recurso,
      r.titulo,
      r.portada,
      r.isbn,
      r.anio_publicacion,
      r.formato,
      r.url_acceso,
      r.archivo_digital,
      r.resumen,
      r.idioma,
      r.tipo,
      r.descarga_habilitada,
      r.visualizacion_habilitada,

      c.nombre_categoria,
      a.nombre_autor,
      a.apellido_autor,
      e.nombre_editorial

    FROM favorito f
    INNER JOIN recurso r ON f.id_recurso = r.id_recurso
    LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
    LEFT JOIN autor a ON r.id_autor = a.id_autor
    LEFT JOIN editorial e ON r.id_editorial = e.id_editorial

    WHERE f.id_usuario = ?
    AND f.estado = 1
    AND r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'

    ORDER BY f.fecha_favorito DESC
  `;

  db.query(sql, [id_usuario], (error, results) => {
    if (error) {
      console.error("Error al obtener favoritos:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener favoritos",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      total: results.length,
      favoritos: results,
      recursos: results,
    });
  });
});

/* Verificar si un recurso ya está en favoritos */
router.get("/:id_usuario/:id_recurso", (req, res) => {
  const { id_usuario, id_recurso } = req.params;

  const sql = `
    SELECT id_favorito
    FROM favorito
    WHERE id_usuario = ?
    AND id_recurso = ?
    AND estado = 1
    LIMIT 1
  `;

  db.query(sql, [id_usuario, id_recurso], (error, results) => {
    if (error) {
      console.error("Error al verificar favorito:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al verificar favorito",
      });
    }

    return res.json({
      ok: true,
      esFavorito: results.length > 0,
    });
  });
});

/* Agregar favorito */
router.post("/", (req, res) => {
  const { id_usuario, id_recurso } = req.body;

  if (!id_usuario || !id_recurso) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan datos del usuario o recurso",
    });
  }

  const sql = `
    INSERT INTO favorito (id_usuario, id_recurso, estado)
    VALUES (?, ?, 1)
    ON DUPLICATE KEY UPDATE
      estado = 1,
      fecha_favorito = CURRENT_TIMESTAMP
  `;

  db.query(sql, [id_usuario, id_recurso], (error) => {
    if (error) {
      console.error("Error al agregar favorito:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al agregar favorito",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      mensaje: "Recurso agregado a favoritos",
    });
  });
});

/* Quitar favorito */
router.delete("/:id_usuario/:id_recurso", (req, res) => {
  const { id_usuario, id_recurso } = req.params;

  const sql = `
    UPDATE favorito
    SET estado = 0
    WHERE id_usuario = ?
    AND id_recurso = ?
  `;

  db.query(sql, [id_usuario, id_recurso], (error) => {
    if (error) {
      console.error("Error al quitar favorito:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al quitar favorito",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Recurso quitado de favoritos",
    });
  });
});

module.exports = router;