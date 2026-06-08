const db = require("../../config/db").promise();

const listarMaterias = async (req, res) => {
  try {
    const [materias] = await db.query(`
      SELECT
        m.id_materia AS id,
        m.id_carrera,
        m.id_semestre,
        m.id_area_basica,
        COALESCE(m.sigla_materia, 'S/S') AS sigla,
        m.nombre_materia AS nombre,
        COALESCE(m.descripcion, 'Materia registrada en el plan académico de la Facultad de Tecnología.') AS descripcion,

        c.nombre_carrera AS carrera,
        COALESCE(c.tipo, 'CARRERA') AS tipo_carrera,

        COALESCE(ab.nombre_area, c.nombre_carrera, 'Sin área') AS area,

        CASE
          WHEN s.nombre_semestre IS NULL THEN 'Sin semestre fijo'
          ELSE s.nombre_semestre
        END AS semestre,

        CASE
          WHEN COALESCE(c.tipo, 'CARRERA') = 'DEPARTAMENTO' OR m.id_area_basica IS NOT NULL THEN 'Básica'
          ELSE 'Carrera'
        END AS tipo,

        CASE
          WHEN IFNULL(m.estado, 1) = 1 THEN 'Activa'
          ELSE 'Inactiva'
        END AS estado,

        COALESCE(rm.recursos, 0) AS recursos,
        COALESCE(mp.docentes, 0) AS docentes,
        COALESCE(mp.paralelos, 0) AS paralelos

      FROM materia m
      INNER JOIN carrera c ON m.id_carrera = c.id_carrera
      LEFT JOIN semestre s ON m.id_semestre = s.id_semestre
      LEFT JOIN area_basica ab ON m.id_area_basica = ab.id_area_basica

      LEFT JOIN (
        SELECT id_materia, COUNT(DISTINCT id_recurso) AS recursos
        FROM recurso_materia
        GROUP BY id_materia
      ) rm ON m.id_materia = rm.id_materia

      LEFT JOIN (
        SELECT
          id_materia,
          COUNT(DISTINCT id_materia_paralelo) AS paralelos,
          COUNT(
            DISTINCT COALESCE(
              CAST(id_docente AS CHAR),
              docente_nombre,
              paralelo
            )
          ) AS docentes
        FROM materia_paralelo
        WHERE IFNULL(estado, 1) = 1
        GROUP BY id_materia
      ) mp ON m.id_materia = mp.id_materia

      ORDER BY
        c.nombre_carrera ASC,
        COALESCE(s.numero_semestre, 99) ASC,
        m.nombre_materia ASC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS totalMaterias,
        SUM(
          CASE
            WHEN COALESCE(c.tipo, 'CARRERA') = 'DEPARTAMENTO' OR m.id_area_basica IS NOT NULL THEN 1
            ELSE 0
          END
        ) AS materiasBasicas,
        SUM(
          CASE
            WHEN COALESCE(c.tipo, 'CARRERA') <> 'DEPARTAMENTO' AND m.id_area_basica IS NULL THEN 1
            ELSE 0
          END
        ) AS materiasCarrera
      FROM materia m
      INNER JOIN carrera c ON m.id_carrera = c.id_carrera
    `);

    const [[recursos]] = await db.query(`
      SELECT COUNT(DISTINCT id_recurso) AS recursosTotales
      FROM recurso_materia
    `);

    const [carreras] = await db.query(`
      SELECT
        id_carrera,
        nombre_carrera,
        sigla,
        COALESCE(tipo, 'CARRERA') AS tipo
      FROM carrera
      WHERE IFNULL(estado, 1) = 1
      ORDER BY
        CASE WHEN COALESCE(tipo, 'CARRERA') = 'DEPARTAMENTO' THEN 1 ELSE 0 END,
        nombre_carrera ASC
    `);

    const [semestres] = await db.query(`
      SELECT
        id_semestre,
        numero_semestre,
        nombre_semestre
      FROM semestre
      ORDER BY numero_semestre ASC
    `);

    const [areas] = await db.query(`
      SELECT
        ab.id_area_basica,
        ab.id_carrera,
        ab.nombre_area,
        c.nombre_carrera
      FROM area_basica ab
      INNER JOIN carrera c ON ab.id_carrera = c.id_carrera
      WHERE IFNULL(ab.estado, 1) = 1
      ORDER BY ab.nombre_area ASC
    `);

    res.json({
      ok: true,
      materias,
      metricas: {
        totalMaterias: Number(metricas.totalMaterias || 0),
        materiasBasicas: Number(metricas.materiasBasicas || 0),
        materiasCarrera: Number(metricas.materiasCarrera || 0),
        recursosTotales: Number(recursos.recursosTotales || 0),
      },
      carreras,
      semestres,
      areas,
    });
  } catch (error) {
    console.error("Error al listar materias:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar materias",
      error: error.message,
    });
  }
};

const crearMateria = async (req, res) => {
  try {
    const {
      id_carrera,
      id_semestre,
      id_area_basica,
      nombre,
      nombre_materia,
      sigla,
      sigla_materia,
      descripcion,
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_materia;
    const siglaFinal = sigla || sigla_materia;

    if (!id_carrera || !nombreFinal || !siglaFinal) {
      return res.status(400).json({
        ok: false,
        mensaje: "La carrera, la sigla y el nombre de la materia son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      INSERT INTO materia (
        id_carrera,
        id_area_basica,
        id_semestre,
        nombre_materia,
        sigla_materia,
        descripcion,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_carrera,
        id_area_basica || null,
        id_semestre || null,
        nombreFinal.trim(),
        siglaFinal.trim().toUpperCase(),
        descripcion || null,
        estado === "Activa" ? 1 : 0,
      ]
    );

    if (id_semestre) {
      await db.query(
        `
        INSERT INTO plan_estudio (
          id_carrera,
          id_materia,
          id_semestre,
          orden,
          estado
        )
        SELECT
          ?,
          ?,
          ?,
          COALESCE(MAX(orden), 0) + 1,
          1
        FROM plan_estudio
        WHERE id_carrera = ?
        AND id_semestre = ?
        `,
        [id_carrera, resultado.insertId, id_semestre, id_carrera, id_semestre]
      );
    }

    res.status(201).json({
      ok: true,
      mensaje: "Materia registrada correctamente",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear materia:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al crear materia",
      error: error.message,
    });
  }
};

const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_carrera,
      id_semestre,
      id_area_basica,
      nombre,
      nombre_materia,
      sigla,
      sigla_materia,
      descripcion,
      estado = "Activa",
    } = req.body;

    const nombreFinal = nombre || nombre_materia;
    const siglaFinal = sigla || sigla_materia;

    if (!id_carrera || !nombreFinal || !siglaFinal) {
      return res.status(400).json({
        ok: false,
        mensaje: "La carrera, la sigla y el nombre de la materia son obligatorios",
      });
    }

    const [resultado] = await db.query(
      `
      UPDATE materia
      SET
        id_carrera = ?,
        id_area_basica = ?,
        id_semestre = ?,
        nombre_materia = ?,
        sigla_materia = ?,
        descripcion = ?,
        estado = ?
      WHERE id_materia = ?
      `,
      [
        id_carrera,
        id_area_basica || null,
        id_semestre || null,
        nombreFinal.trim(),
        siglaFinal.trim().toUpperCase(),
        descripcion || null,
        estado === "Activa" ? 1 : 0,
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Materia no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Materia actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar materia:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar materia",
      error: error.message,
    });
  }
};

const cambiarEstadoMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const [resultado] = await db.query(
      `
      UPDATE materia
      SET estado = ?
      WHERE id_materia = ?
      `,
      [estado === "Activa" ? 1 : 0, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Materia no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Estado de la materia actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al cambiar estado de la materia",
      error: error.message,
    });
  }
};

const eliminarMateria = async (req, res) => {
  try {
    const { id } = req.params;

    const [[usoRecursos]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM recurso_materia
      WHERE id_materia = ?
      `,
      [id]
    );

    const [[usoParalelos]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM materia_paralelo
      WHERE id_materia = ?
      `,
      [id]
    );

    if (Number(usoRecursos.total) > 0 || Number(usoParalelos.total) > 0) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "No se puede eliminar una materia que tiene recursos o paralelos vinculados. Puedes desactivarla.",
      });
    }

    await db.query("DELETE FROM plan_estudio WHERE id_materia = ?", [id]);

    const [resultado] = await db.query(
      `
      DELETE FROM materia
      WHERE id_materia = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Materia no encontrada",
      });
    }

    res.json({
      ok: true,
      mensaje: "Materia eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar materia:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar materia",
      error: error.message,
    });
  }
};

module.exports = {
  listarMaterias,
  crearMateria,
  actualizarMateria,
  cambiarEstadoMateria,
  eliminarMateria,
};