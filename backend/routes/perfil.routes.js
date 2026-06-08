const express = require("express");
const router = express.Router();

const db = require("../config/db");

/* Obtener perfil por usuario */
router.get("/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT
      u.id_usuario,
      u.id_rol,
      u.id_carrera,
      u.nombre,
      u.apellido,
      u.correo,
      u.estado,
      u.fecha_registro,
      u.ultimo_acceso,

      r.nombre_rol,

      c.nombre_carrera,
      c.sigla AS sigla_carrera
    FROM usuario u
    LEFT JOIN rol r ON u.id_rol = r.id_rol
    LEFT JOIN carrera c ON u.id_carrera = c.id_carrera
    WHERE u.id_usuario = ?
    LIMIT 1
  `;

  db.query(sql, [id_usuario], (error, results) => {
    if (error) {
      console.error("Error al obtener perfil:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener el perfil",
        error: error.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    return res.json({
      ok: true,
      perfil: results[0],
      usuario: results[0],
    });
  });
});

module.exports = router;