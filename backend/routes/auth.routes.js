const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../config/db");

function normalizarCorreo(correo) {
  const valor = String(correo || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");

  if (!valor) return "";

  if (valor.includes("@")) {
    return valor;
  }

  return `${valor}@umsa.bo`;
}
function esCorreoUMSA(correo) {
  return /^[a-z0-9._%+-]+@umsa\.bo$/.test(correo);
}
function validarPasswordSegura(password) {
  const valor = String(password || "");

  const tieneLongitudValida = valor.length >= 6 && valor.length <= 8;
  const tieneMayuscula = /[A-Z]/.test(valor);
  const tieneMinuscula = /[a-z]/.test(valor);
  const tieneNumero = /\d/.test(valor);

  return (
    tieneLongitudValida &&
    tieneMayuscula &&
    tieneMinuscula &&
    tieneNumero
  );
}
function compararPassword(passwordIngresado, passwordBD) {
  if (!passwordBD) return false;

  const esHash =
    passwordBD.startsWith("$2a$") ||
    passwordBD.startsWith("$2b$") ||
    passwordBD.startsWith("$2y$");

  if (esHash) {
    return bcrypt.compareSync(passwordIngresado, passwordBD);
  }

  return passwordIngresado === passwordBD;
}

/* LOGIN */
router.post("/login", (req, res) => {
  const correo = normalizarCorreo(req.body.correo);
  const password = String(req.body.password || "").trim();

  if (!correo || !password) {
    return res.status(400).json({
      ok: false,
      message: "Debe ingresar correo y contraseña.",
    });
  }

  if (!esCorreoUMSA(correo)) {
    return res.status(400).json({
      ok: false,
      message: "Solo se permite correo institucional @umsa.bo.",
    });
  }

  const sql = `
    SELECT
      u.id_usuario,
      u.id_rol,
      u.id_carrera,
      u.nombre,
      u.apellido,
      u.carnet,
      u.registro_universitario,
      u.correo,
      u.contrasena,
      u.debe_cambiar_password,
      u.estado,
      u.foto_perfil,
      r.nombre_rol,
      c.nombre_carrera
    FROM usuario u
    INNER JOIN rol r ON u.id_rol = r.id_rol
    LEFT JOIN carrera c ON u.id_carrera = c.id_carrera
    WHERE u.correo = ?
    LIMIT 1
  `;

  db.query(sql, [correo], (error, results) => {
    if (error) {
      
      console.log("Error en login:", error);
      
      return res.status(500).json({
        ok: false,
        message: "Error al conectar con la base de datos.",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Correo o contraseña incorrectos.",
      });
    }

    const usuario = results[0];

    if (Number(usuario.estado) === 0) {
      return res.status(403).json({
        ok: false,
        message: "El usuario se encuentra bloqueado o inactivo.",
      });
    }

    const passwordValido = compararPassword(password, usuario.contrasena);

    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        message: "Correo o contraseña incorrectos.",
      });
    }

    const debeCambiarPassword =
      Number(usuario.debe_cambiar_password) === 1 ||
      (
        Number(usuario.id_rol) === 3 &&
        usuario.carnet &&
        password === String(usuario.carnet)
      );

    db.query(
      "UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?",
      [usuario.id_usuario]
    );
    

    return res.json({
      ok: true,
      message: "Inicio de sesión correcto.",
      debe_cambiar_password: debeCambiarPassword,
     usuario: {
  id_usuario: usuario.id_usuario,
  id: usuario.id_usuario,
  id_rol: usuario.id_rol,
  id_carrera: usuario.id_carrera,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  carnet: usuario.carnet,
  registro_universitario: usuario.registro_universitario,
  correo: usuario.correo,
  estado: usuario.estado,
  foto_perfil: usuario.foto_perfil,
  rol: usuario.nombre_rol,
  nombre_rol: usuario.nombre_rol,
  nombre_carrera: usuario.nombre_carrera,
  debe_cambiar_password: debeCambiarPassword ? 1 : 0,
},
    });
  });
});

/* REGISTRO */
router.post("/registro", (req, res) => {
  const nombres = String(req.body.nombres || req.body.nombre || "").trim();
  const apellidos = String(req.body.apellidos || req.body.apellido || "").trim();
  const correo = normalizarCorreo(req.body.correo);
  const carnet = String(req.body.carnet || "").trim();
  const registroUniversitario = String(
    req.body.registro_universitario ||
    req.body.registroUniversitario ||
    ""
  ).trim();

  if (!nombres || !apellidos || !correo || !carnet || !registroUniversitario) {
    return res.status(400).json({
      ok: false,
      message: "Debe completar nombres, apellidos, correo, carnet y registro universitario.",
    });
  }

  if (!esCorreoUMSA(correo)) {
    return res.status(400).json({
      ok: false,
      message: "Solo se permite correo institucional @umsa.bo.",
    });
  }

  const sqlVerificar = `
    SELECT id_usuario
    FROM usuario
    WHERE correo = ?
       OR carnet = ?
       OR registro_universitario = ?
    LIMIT 1
  `;

  db.query(
    sqlVerificar,
    [correo, carnet, registroUniversitario],
    (errorVerificar, resultadoVerificar) => {
      if (errorVerificar) {
        console.log("Error al verificar usuario:", errorVerificar);
        return res.status(500).json({
          ok: false,
          message: "Error al verificar usuario.",
        });
      }

      if (resultadoVerificar.length > 0) {
        return res.status(409).json({
          ok: false,
          message: "Ya existe un usuario con ese correo, carnet o registro universitario.",
        });
      }

      const passwordHash = bcrypt.hashSync(carnet, 10);

      const sqlInsertar = `
        INSERT INTO usuario
        (
          id_rol,
          nombre,
          apellido,
          carnet,
          registro_universitario,
          correo,
          contrasena,
          debe_cambiar_password,
          estado,
          fecha_registro
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      db.query(
        sqlInsertar,
        [
          3,
          nombres,
          apellidos,
          carnet,
          registroUniversitario,
          correo,
          passwordHash,
          1,
          1,
        ],
        (errorInsertar, resultadoInsertar) => {
          if (errorInsertar) {
            console.log("Error al registrar usuario:", errorInsertar);
            return res.status(500).json({
              ok: false,
              message: "No se pudo crear la cuenta.",
            });
          }

          return res.status(201).json({
            ok: true,
            message: "Cuenta creada correctamente.",
            usuario: {
              id_usuario: resultadoInsertar.insertId,
              id_rol: 3,
              nombre: nombres,
              apellido: apellidos,
              carnet,
              registro_universitario: registroUniversitario,
              correo,
              rol: "Estudiante",
              nombre_rol: "Estudiante",
              debe_cambiar_password: 1,
            },
          });
        }
      );
    }
  );
});

/* RESET PASSWORD */
router.put("/reset-password", (req, res) => {
  const correo = normalizarCorreo(req.body.correo);
  const carnet = String(req.body.carnet || "").trim();
  const registroUniversitario = String(
    req.body.registro_universitario ||
    req.body.registroUniversitario ||
    ""
  ).trim();

  if (!correo || !carnet || !registroUniversitario) {
    return res.status(400).json({
      ok: false,
      message: "Debe ingresar correo, carnet y registro universitario.",
    });
  }

  if (!esCorreoUMSA(correo)) {
    return res.status(400).json({
      ok: false,
      message: "Solo se permite correo institucional @umsa.bo.",
    });
  }

  const sqlBuscar = `
    SELECT id_usuario
    FROM usuario
    WHERE correo = ?
      AND carnet = ?
      AND registro_universitario = ?
      AND estado = 1
    LIMIT 1
  `;

  db.query(
    sqlBuscar,
    [correo, carnet, registroUniversitario],
    (errorBuscar, resultadoBuscar) => {
      if (errorBuscar) {
        console.log("Error al buscar usuario:", errorBuscar);
        return res.status(500).json({
          ok: false,
          message: "Error al buscar usuario.",
        });
      }

      if (resultadoBuscar.length === 0) {
        return res.status(404).json({
          ok: false,
          message: "No se encontró un usuario activo con los datos ingresados.",
        });
      }

      const idUsuario = resultadoBuscar[0].id_usuario;
      const passwordHash = bcrypt.hashSync(carnet, 10);

      const sqlActualizar = `
        UPDATE usuario
        SET contrasena = ?,
            debe_cambiar_password = 1,
            fecha_cambio_password = NULL
        WHERE id_usuario = ?
      `;

      db.query(sqlActualizar, [passwordHash, idUsuario], (errorActualizar) => {
        if (errorActualizar) {
          console.log("Error al resetear contraseña:", errorActualizar);
          return res.status(500).json({
            ok: false,
            message: "No se pudo resetear la contraseña.",
          });
        }

        return res.json({
          ok: true,
          message: "Contraseña reseteada correctamente. La nueva contraseña es el carnet.",
        });
      });
    }
  );
});

/* CAMBIAR PASSWORD PRIMER INGRESO */
router.put("/cambiar-password", (req, res) => {
  const idUsuario = req.body.id_usuario || req.body.id || null;
  const correo = normalizarCorreo(req.body.correo);
  const nuevaPassword = String(
  req.body.nueva_password ||
  req.body.nuevaPassword ||
  req.body.nueva ||
  ""
).trim();

if (/\s/.test(nuevaPassword)) {
  return res.status(400).json({
    ok: false,
    message: "La contraseña no debe contener espacios.",
  });
}
if (!validarPasswordSegura(nuevaPassword)) {
  return res.status(400).json({
    ok: false,
    message:
      "La nueva contraseña debe tener de 6 a 8 caracteres, incluir una letra mayúscula, una letra minúscula y un número.",
  });
}
  if (nuevaPassword.length < 6) {
    return res.status(400).json({
      ok: false,
      message: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  const sqlBuscar = `
    SELECT id_usuario, carnet
    FROM usuario
    WHERE ${idUsuario ? "id_usuario = ?" : "correo = ?"}
    LIMIT 1
  `;

  db.query(sqlBuscar, [idUsuario || correo], (errorBuscar, resultadoBuscar) => {
    if (errorBuscar) {
      console.log("Error al buscar usuario:", errorBuscar);
      return res.status(500).json({
        ok: false,
        message: "Error al buscar usuario.",
      });
    }

    if (resultadoBuscar.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado.",
      });
    }

    const usuario = resultadoBuscar[0];

    if (usuario.carnet && nuevaPassword === String(usuario.carnet)) {
      return res.status(400).json({
        ok: false,
        message: "La nueva contraseña no puede ser igual al carnet.",
      });
    }

    const passwordHash = bcrypt.hashSync(nuevaPassword, 10);

    const sqlActualizar = `
      UPDATE usuario
      SET contrasena = ?,
          debe_cambiar_password = 0,
          fecha_cambio_password = NOW()
      WHERE id_usuario = ?
    `;

    db.query(sqlActualizar, [passwordHash, usuario.id_usuario], (errorActualizar) => {
      if (errorActualizar) {
        console.log("Error al cambiar contraseña:", errorActualizar);
        return res.status(500).json({
          ok: false,
          message: "No se pudo cambiar la contraseña.",
        });
      }

      return res.json({
        ok: true,
        message: "Contraseña actualizada correctamente.",
      });
    });
  });
});

module.exports = router;