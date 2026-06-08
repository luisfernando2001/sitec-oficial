const db = require("../../config/db").promise();

const obtenerPerfilAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [usuarios] = await db.query(
      `
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.correo,
        u.estado,
        u.fecha_registro,
        u.ultimo_acceso,
        u.foto_perfil,
        r.nombre_rol,
        c.nombre_carrera
      FROM usuario u
      LEFT JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN carrera c ON u.id_carrera = c.id_carrera
      WHERE u.id_usuario = ?
      LIMIT 1
      `,
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Administrador no encontrado",
      });
    }

    return res.json({
      ok: true,
      perfil: usuarios[0],
    });
  } catch (error) {
    console.error("Error al obtener perfil admin:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener perfil del administrador",
      error: error.message,
    });
  }
};

const actualizarPerfilAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { nombre, apellido, correo } = req.body;

    if (!nombre || !apellido || !correo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre, apellido y correo son obligatorios",
      });
    }

    let fotoPerfil = null;

    if (req.file) {
      fotoPerfil = `uploads/perfiles/${req.file.filename}`;
    }

    const [resultado] = await db.query(
      `
      UPDATE usuario
      SET
        nombre = ?,
        apellido = ?,
        correo = ?,
        foto_perfil = COALESCE(?, foto_perfil)
      WHERE id_usuario = ?
      `,
      [
        nombre.trim(),
        apellido.trim(),
        correo.trim().toLowerCase(),
        fotoPerfil,
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Administrador no encontrado",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Perfil actualizado correctamente",
      foto_perfil: fotoPerfil,
    });
  } catch (error) {
    console.error("Error al actualizar perfil admin:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar perfil del administrador",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerPerfilAdmin,
  actualizarPerfilAdmin,
};