const db = require("../config/db");
const bcrypt = require("bcryptjs");
const obtenerConfiguracion = (req, res) => {
  const { idUsuario } = req.params;

  const sql = `
    SELECT *
    FROM configuracion_usuario
    WHERE id_usuario = ?
    LIMIT 1
  `;

  db.query(sql, [idUsuario], (error, resultado) => {
    if (error) {
      console.log("Error al obtener configuración:", error);
      return res.status(500).json({ mensaje: "Error al obtener configuración" });
    }

    if (resultado.length === 0) {
      const insertar = `
        INSERT INTO configuracion_usuario (id_usuario)
        VALUES (?)
      `;

      db.query(insertar, [idUsuario], (errorInsert) => {
        if (errorInsert) {
          console.log("Error al crear configuración:", errorInsert);
          return res.status(500).json({ mensaje: "Error al crear configuración" });
        }

        return res.json({
          id_usuario: Number(idUsuario),
          tema: "SISTEMA",
          idioma: "Español",
          vista_inicio: "Inicio",
          noti_correo: 1,
          noti_solicitudes: 1,
          noti_recursos: 1,
          noti_novedades: 0,
          perfil_visible: 1,
          guardar_sesion: 1,
          confirmar_descarga: 1,
        });
      });

      return;
    }

    res.json(resultado[0]);
  });
};

const actualizarConfiguracion = (req, res) => {
  const { idUsuario } = req.params;

  const {
    tema,
    idioma,
    vista_inicio,
    noti_correo,
    noti_solicitudes,
    noti_recursos,
    noti_novedades,
    perfil_visible,
    guardar_sesion,
    confirmar_descarga,
  } = req.body;

  const sql = `
    INSERT INTO configuracion_usuario
    (
      id_usuario,
      tema,
      idioma,
      vista_inicio,
      noti_correo,
      noti_solicitudes,
      noti_recursos,
      noti_novedades,
      perfil_visible,
      guardar_sesion,
      confirmar_descarga
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      tema = VALUES(tema),
      idioma = VALUES(idioma),
      vista_inicio = VALUES(vista_inicio),
      noti_correo = VALUES(noti_correo),
      noti_solicitudes = VALUES(noti_solicitudes),
      noti_recursos = VALUES(noti_recursos),
      noti_novedades = VALUES(noti_novedades),
      perfil_visible = VALUES(perfil_visible),
      guardar_sesion = VALUES(guardar_sesion),
      confirmar_descarga = VALUES(confirmar_descarga)
  `;

  db.query(
    sql,
    [
      idUsuario,
      tema || "SISTEMA",
      idioma || "Español",
      vista_inicio || "Inicio",
      noti_correo ? 1 : 0,
      noti_solicitudes ? 1 : 0,
      noti_recursos ? 1 : 0,
      noti_novedades ? 1 : 0,
      perfil_visible ? 1 : 0,
      guardar_sesion ? 1 : 0,
      confirmar_descarga ? 1 : 0,
    ],
    (error) => {
      if (error) {
        console.log("Error al actualizar configuración:", error);
        return res.status(500).json({ mensaje: "Error al actualizar configuración" });
      }

      res.json({ mensaje: "Configuración actualizada correctamente" });
    }
  );
};
const cambiarPassword = (req, res) => {
  const { idUsuario } = req.params;
  const { actual, nueva } = req.body;

  if (!actual || !nueva) {
    return res.status(400).json({
      mensaje: "Debes enviar la contraseña actual y la nueva contraseña",
    });
  }

  if (nueva.length < 6) {
    return res.status(400).json({
      mensaje: "La nueva contraseña debe tener al menos 6 caracteres",
    });
  }

  const sqlBuscar = `
    SELECT id_usuario, contrasena, carnet
    FROM usuario
    WHERE id_usuario = ?
    LIMIT 1
  `;

  db.query(sqlBuscar, [idUsuario], (error, resultado) => {
    if (error) {
      console.log("Error al buscar usuario:", error);
      return res.status(500).json({
        mensaje: "Error al buscar usuario",
      });
    }

    if (resultado.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const usuario = resultado[0];
    const contrasenaActualBD = usuario.contrasena || "";

    const esHash =
      contrasenaActualBD.startsWith("$2a$") ||
      contrasenaActualBD.startsWith("$2b$") ||
      contrasenaActualBD.startsWith("$2y$");

    const passwordCorrecto = esHash
      ? bcrypt.compareSync(actual, contrasenaActualBD)
      : actual === contrasenaActualBD;

    if (!passwordCorrecto) {
      return res.status(400).json({
        mensaje: "La contraseña actual no es correcta",
      });
    }

    if (usuario.carnet && nueva === String(usuario.carnet)) {
      return res.status(400).json({
        mensaje: "La nueva contraseña no puede ser igual al carnet",
      });
    }

    const nuevaHash = bcrypt.hashSync(nueva, 10);

    const sqlActualizar = `
      UPDATE usuario
      SET contrasena = ?,
          debe_cambiar_password = 0,
          fecha_cambio_password = NOW()
      WHERE id_usuario = ?
    `;

    db.query(sqlActualizar, [nuevaHash, idUsuario], (errorUpdate) => {
      if (errorUpdate) {
        console.log("Error al cambiar contraseña:", errorUpdate);
        return res.status(500).json({
          mensaje: "Error al cambiar contraseña",
        });
      }

      res.json({
        mensaje: "Contraseña actualizada correctamente",
      });
    });
  });
};


module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarPassword,
};