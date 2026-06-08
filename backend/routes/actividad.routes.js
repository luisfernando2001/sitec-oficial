const express = require("express");
const router = express.Router();

const db = require("../config/db");

/* Obtener actividad reciente de un usuario */
router.get("/usuario/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT
      a.id_actividad,
      a.id_usuario,
      a.id_recurso,
      a.tipo,
      a.titulo,
      a.detalle,
      a.fecha,
      r.titulo AS recurso_titulo
    FROM actividad_usuario a
    LEFT JOIN recurso r ON a.id_recurso = r.id_recurso
    WHERE a.id_usuario = ?
    AND a.estado = 1
    ORDER BY a.fecha DESC
    LIMIT 6
  `;

  db.query(sql, [id_usuario], (error, results) => {
    if (error) {
      console.error("Error al obtener actividad:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener actividad reciente",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      total: results.length,
      actividades: results,
    });
  });
});

/* Registrar actividad */
router.post("/", (req, res) => {
  const {
    id_usuario,
    id_recurso = null,
    tipo,
    titulo,
    detalle = null,
  } = req.body;

  if (!id_usuario || !tipo || !titulo) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan datos para registrar la actividad",
    });
  }

  const sql = `
    INSERT INTO actividad_usuario (
      id_usuario,
      id_recurso,
      tipo,
      titulo,
      detalle
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [id_usuario, id_recurso, tipo, titulo, detalle],
    (error, result) => {
      if (error) {
        console.error("Error al registrar actividad:", error);

        return res.status(500).json({
          ok: false,
          mensaje: "Error al registrar actividad",
          error: error.message,
        });
      }

      return res.status(201).json({
        ok: true,
        mensaje: "Actividad registrada",
        id_actividad: result.insertId,
      });
    }
  );
});

module.exports = router;