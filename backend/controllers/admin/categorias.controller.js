const db = require("../../config/db").promise();

const listarCategorias = async (req, res) => {
  try {
    const [categorias] = await db.query(`
      SELECT
        c.id_categoria AS id,
        COALESCE(c.codigo, UPPER(LEFT(c.nombre_categoria, 3))) AS codigo,
        c.nombre_categoria AS nombre,
        COALESCE(c.tipo, 'Académica') AS tipo,
        COALESCE(c.area, 'Sin área definida') AS area,
        CASE
          WHEN IFNULL(c.estado, 1) = 1 THEN 'Activa'
          ELSE 'Inactiva'
        END AS estado,
        COALESCE(r.recursos, 0) AS recursos,
        COALESCE(c.descripcion, 'Categoría registrada en el catálogo SITEC.') AS descripcion
      FROM categoria c
      LEFT JOIN (
        SELECT id_categoria, COUNT(*) AS recursos
        FROM recurso
        WHERE IFNULL(estado, 1) = 1
        GROUP BY id_categoria
      ) r ON c.id_categoria = r.id_categoria
      ORDER BY c.id_categoria DESC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS totalCategorias,
        SUM(CASE WHEN IFNULL(estado, 1) = 1 THEN 1 ELSE 0 END) AS activas,
        SUM(CASE WHEN tipo = 'Materias Básicas' THEN 1 ELSE 0 END) AS basicas
      FROM categoria
    `);

    const [[recursos]] = await db.query(`
      SELECT COUNT(*) AS recursosTotales
      FROM recurso
      WHERE id_categoria IS NOT NULL
      AND IFNULL(estado, 1) = 1
    `);

    res.json({
      ok: true,
      categorias,
      metricas: {
        totalCategorias: Number(metricas.totalCategorias || 0),
        activas: Number(metricas.activas || 0),
        basicas: Number(metricas.basicas || 0),
        recursosTotales: Number(recursos.recursosTotales || 0),
      },
    });
  } catch (error) {
    console.error("Error al listar categorías:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar categorías",
      error: error.message,
    });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      nombre_categoria,
      tipo = "Académica",
      area,
      descripcion,
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_categoria;

    if (!nombreFinal || !codigo) {
      return res.status(400).json({
        ok: false,
        mensaje: "El código y el nombre son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO categoria (
        codigo,
        nombre_categoria,
        tipo,
        area,
        descripcion,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        codigo.trim().toUpperCase(),
        nombreFinal.trim(),
        tipo,
        area || null,
        descripcion || null,
        estado === "Activa" ? 1 : 0,
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Categoría registrada correctamente",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al crear categoría",
      error: error.message,
    });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      codigo,
      nombre,
      nombre_categoria,
      tipo = "Académica",
      area,
      descripcion,
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_categoria;

    if (!nombreFinal || !codigo) {
      return res.status(400).json({
        ok: false,
        mensaje: "El código y el nombre son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE categoria
      SET
        codigo = ?,
        nombre_categoria = ?,
        tipo = ?,
        area = ?,
        descripcion = ?,
        estado = ?
      WHERE id_categoria = ?
      `,
      [
        codigo.trim().toUpperCase(),
        nombreFinal.trim(),
        tipo,
        area || null,
        descripcion || null,
        estado === "Activa" ? 1 : 0,
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoría no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Categoría actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar categoría",
      error: error.message,
    });
  }
};

const cambiarEstadoCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const [resultado] = await db.query(
      `
      UPDATE categoria
      SET estado = ?
      WHERE id_categoria = ?
      `,
      [estado === "Activa" ? 1 : 0, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoría no encontrada",
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
      mensaje: "Error al cambiar estado de la categoría",
      error: error.message,
    });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const [[uso]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM recurso
      WHERE id_categoria = ?
      `,
      [id]
    );

    if (Number(uso.total) > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se puede eliminar una categoría que tiene recursos vinculados. Puedes desactivarla.",
      });
    }

    const [resultado] = await db.query(
      `
      DELETE FROM categoria
      WHERE id_categoria = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Categoría no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Categoría eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar categoría",
      error: error.message,
    });
  }
};

module.exports = {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
};