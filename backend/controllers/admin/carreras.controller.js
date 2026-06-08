const db = require("../../config/db").promise();

const listarCarreras = async (req, res) => {
  try {
    const [carreras] = await db.query(`
      SELECT
        c.id_carrera AS id,
        c.nombre_carrera AS nombre,
        c.sigla,
        COALESCE(c.descripcion, 'Sin descripción registrada') AS descripcion,
        COALESCE(c.tipo, 'CARRERA') AS tipo,
        CASE 
          WHEN IFNULL(c.estado, 1) = 1 THEN 'Activa'
          ELSE 'Inactiva'
        END AS estado,

        CASE
          WHEN COALESCE(c.tipo, 'CARRERA') = 'DEPARTAMENTO' THEN NULL
          ELSE COALESCE(MAX(s.numero_semestre), 0)
        END AS semestres,

        COUNT(DISTINCT m.id_materia) AS total_materias,

        GROUP_CONCAT(
          DISTINCT ab.nombre_area
          ORDER BY ab.nombre_area
          SEPARATOR ', '
        ) AS areas

      FROM carrera c
      LEFT JOIN materia m ON c.id_carrera = m.id_carrera
      LEFT JOIN semestre s ON m.id_semestre = s.id_semestre
      LEFT JOIN area_basica ab ON c.id_carrera = ab.id_carrera

      GROUP BY 
        c.id_carrera,
        c.nombre_carrera,
        c.sigla,
        c.descripcion,
        c.tipo,
        c.estado

      ORDER BY 
        CASE WHEN COALESCE(c.tipo, 'CARRERA') = 'DEPARTAMENTO' THEN 1 ELSE 0 END,
        c.nombre_carrera ASC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS totalCarreras,
        SUM(CASE WHEN COALESCE(tipo, 'CARRERA') = 'CARRERA' THEN 1 ELSE 0 END) AS carreras,
        SUM(CASE WHEN COALESCE(tipo, 'CARRERA') = 'DEPARTAMENTO' THEN 1 ELSE 0 END) AS departamentos,
        SUM(CASE WHEN IFNULL(estado, 1) = 1 THEN 1 ELSE 0 END) AS activas
      FROM carrera
    `);

    res.json({
      ok: true,
      carreras: carreras.map((carrera) => ({
        ...carrera,
        especial: carrera.tipo === "DEPARTAMENTO",
        areas: carrera.areas ? carrera.areas.split(", ") : [],
      })),
      metricas: {
        totalCarreras: Number(metricas.totalCarreras || 0),
        carreras: Number(metricas.carreras || 0),
        departamentos: Number(metricas.departamentos || 0),
        activas: Number(metricas.activas || 0),
      },
    });
  } catch (error) {
    console.error("Error al listar carreras:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar carreras",
      error: error.message,
    });
  }
};

const crearCarrera = async (req, res) => {
  try {
    const {
      nombre,
      nombre_carrera,
      sigla,
      descripcion,
      tipo = "CARRERA",
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_carrera;

    if (!nombreFinal || !sigla) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre y la sigla son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO carrera (
        nombre_carrera,
        sigla,
        descripcion,
        estado,
        tipo
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nombreFinal.trim(),
        sigla.trim().toUpperCase(),
        descripcion || null,
        estado === "Activa" ? 1 : 0,
        tipo,
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Carrera registrada correctamente",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear carrera:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al crear carrera",
      error: error.message,
    });
  }
};

const actualizarCarrera = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      nombre_carrera,
      sigla,
      descripcion,
      tipo = "CARRERA",
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_carrera;

    if (!nombreFinal || !sigla) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre y la sigla son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE carrera
      SET
        nombre_carrera = ?,
        sigla = ?,
        descripcion = ?,
        estado = ?,
        tipo = ?
      WHERE id_carrera = ?
      `,
      [
        nombreFinal.trim(),
        sigla.trim().toUpperCase(),
        descripcion || null,
        estado === "Activa" ? 1 : 0,
        tipo,
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Carrera no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Carrera actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar carrera:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar carrera",
      error: error.message,
    });
  }
};

const cambiarEstadoCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const [resultado] = await db.query(
      `
      UPDATE carrera
      SET estado = ?
      WHERE id_carrera = ?
      `,
      [estado === "Activa" ? 1 : 0, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Carrera no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al cambiar estado de la carrera",
      error: error.message,
    });
  }
};

const eliminarCarrera = async (req, res) => {
  try {
    const { id } = req.params;

    const [[usoMaterias]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM materia
      WHERE id_carrera = ?
      `,
      [id]
    );

    if (Number(usoMaterias.total) > 0) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "No se puede eliminar una carrera que tiene materias vinculadas. Puedes desactivarla.",
      });
    }

    const [resultado] = await db.query(
      `
      DELETE FROM carrera
      WHERE id_carrera = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Carrera no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Carrera eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar carrera:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar carrera",
      error: error.message,
    });
  }
};

module.exports = {
  listarCarreras,
  crearCarrera,
  actualizarCarrera,
  cambiarEstadoCarrera,
  eliminarCarrera,
};