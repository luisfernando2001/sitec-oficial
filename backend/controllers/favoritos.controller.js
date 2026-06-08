const db = require("../config/db");

const listarFavoritos = (req, res) => {
  const { idUsuario } = req.params;

  const sql = `
    SELECT
      fr.id_favorito,
      fr.id_usuario,
      fr.id_recurso,
      fr.fecha_agregado,

      r.titulo,
      r.formato,
      r.anio_publicacion,
      r.resumen,
      r.url_acceso,
      r.archivo_digital,
      r.descarga_habilitada,
      r.visualizacion_habilitada,

      c.nombre_categoria AS categoria,
      CONCAT(a.nombre_autor, ' ', a.apellido_autor) AS autor,
      e.nombre_editorial AS editorial

    FROM favorito_recurso fr
    INNER JOIN recurso r ON fr.id_recurso = r.id_recurso
    LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
    LEFT JOIN autor a ON r.id_autor = a.id_autor
    LEFT JOIN editorial e ON r.id_editorial = e.id_editorial

    WHERE fr.id_usuario = ?
    AND fr.estado = 1
    AND r.estado = 1
    AND r.estado_aprobacion = 'APROBADO'

    ORDER BY fr.fecha_agregado DESC
  `;

  db.query(sql, [idUsuario], (error, resultado) => {
    if (error) {
      console.log("Error al listar favoritos:", error);
      return res.status(500).json({
        mensaje: "Error al obtener favoritos",
      });
    }

    res.json(resultado);
  });
};

const agregarFavorito = (req, res) => {
  const { id_usuario, id_recurso } = req.body;

  if (!id_usuario || !id_recurso) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios",
    });
  }

  const sql = `
    INSERT INTO favorito_recurso
    (id_usuario, id_recurso, fecha_agregado, estado)
    VALUES (?, ?, NOW(), 1)
    ON DUPLICATE KEY UPDATE
      estado = 1,
      fecha_agregado = NOW()
  `;

  db.query(sql, [id_usuario, id_recurso], (error) => {
    if (error) {
      console.log("Error al agregar favorito:", error);
      return res.status(500).json({
        mensaje: "Error al agregar favorito",
      });
    }

    res.json({
      mensaje: "Recurso agregado a favoritos",
    });
  });
};

const quitarFavorito = (req, res) => {
  const { idUsuario, idRecurso } = req.params;

  const sql = `
    UPDATE favorito_recurso
    SET estado = 0
    WHERE id_usuario = ?
    AND id_recurso = ?
  `;

  db.query(sql, [idUsuario, idRecurso], (error, resultado) => {
    if (error) {
      console.log("Error al quitar favorito:", error);
      return res.status(500).json({
        mensaje: "Error al quitar favorito",
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "El favorito no existe o ya fue quitado",
      });
    }

    res.json({
      mensaje: "Recurso quitado de favoritos",
    });
  });
};

module.exports = {
  listarFavoritos,
  agregarFavorito,
  quitarFavorito,
};