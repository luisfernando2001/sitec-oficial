const db = require("../config/db");

const obtenerPerfil = (req, res) => {
  const { idUsuario } = req.params;

  const sql = `
    SELECT 
      u.id_usuario,
      u.nombre,
      u.apellido,
      u.correo,
      u.id_rol,
      r.nombre_rol AS rol,
      u.id_carrera,
      c.nombre_carrera,

      pu.telefono,
      pu.foto_perfil,
      pu.direccion,
      pu.fecha_nacimiento,
      pu.genero,
      pu.biografia,

      pe.registro_universitario,
      pe.id_semestre_actual,
      s.nombre_semestre,
      pe.turno,
      pe.estado_academico,

      pd.codigo_docente,
      pd.grado_academico,
      pd.especialidad,
      pd.departamento,
      pd.estado_docente

    FROM usuario u
    LEFT JOIN rol r ON u.id_rol = r.id_rol
    LEFT JOIN carrera c ON u.id_carrera = c.id_carrera
    LEFT JOIN perfil_usuario pu ON u.id_usuario = pu.id_usuario
    LEFT JOIN perfil_estudiante pe ON u.id_usuario = pe.id_usuario
    LEFT JOIN semestre s ON pe.id_semestre_actual = s.id_semestre
    LEFT JOIN perfil_docente pd ON u.id_usuario = pd.id_usuario
    WHERE u.id_usuario = ?
    LIMIT 1
  `;

  db.query(sql, [idUsuario], (error, resultado) => {
    if (error) {
      console.log("Error al obtener perfil:", error);
      return res.status(500).json({ mensaje: "Error al obtener perfil" });
    }

    if (resultado.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(resultado[0]);
  });
};

const obtenerResumenPerfil = (req, res) => {
  const { idUsuario } = req.params;

  const sqlUsuario = `
    SELECT id_rol 
    FROM usuario 
    WHERE id_usuario = ?
    LIMIT 1
  `;

  db.query(sqlUsuario, [idUsuario], (error, usuarios) => {
    if (error) {
      console.log("Error al obtener usuario:", error);
      return res.status(500).json({ mensaje: "Error al obtener usuario" });
    }

    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const idRol = usuarios[0].id_rol;

    const sqlRecursos =
      idRol === 2
        ? `
          SELECT COUNT(*) AS total
          FROM recurso
          WHERE id_usuario_subida = ?
        `
        : `
          SELECT COUNT(*) AS total
          FROM historial_visualizacion
          WHERE id_usuario = ?
        `;

    const sqlFavoritos = `
      SELECT COUNT(*) AS total
      FROM favorito_recurso
      WHERE id_usuario = ?
      AND estado = 1
    `;

    const sqlSolicitudes = `
      SELECT COUNT(*) AS total
      FROM solicitud
      WHERE id_usuario = ?
      AND estado IN ('Pendiente', 'En revisión', 'PENDIENTE', 'EN REVISION')
    `;

    db.query(sqlRecursos, [idUsuario], (errorRec, recursosResult) => {
      if (errorRec) {
        console.log("Error recursos:", errorRec);
        return res.status(500).json({ mensaje: "Error al contar recursos" });
      }

      db.query(sqlFavoritos, [idUsuario], (errorFav, favoritosResult) => {
        if (errorFav) {
          console.log("Error favoritos:", errorFav);
          return res.status(500).json({ mensaje: "Error al contar favoritos" });
        }

        db.query(sqlSolicitudes, [idUsuario], (errorSol, solicitudesResult) => {
          if (errorSol) {
            console.log("Error solicitudes:", errorSol);
            return res.status(500).json({ mensaje: "Error al contar solicitudes" });
          }

          res.json({
            recursos: recursosResult[0].total || 0,
            favoritos: favoritosResult[0].total || 0,
            solicitudes: solicitudesResult[0].total || 0,
          });
        });
      });
    });
  });
};

const obtenerDetallePerfil = (req, res) => {
  const { idUsuario, tipo } = req.params;

  if (tipo === "recursos") {
    const sqlUsuario = `
      SELECT id_rol 
      FROM usuario 
      WHERE id_usuario = ?
      LIMIT 1
    `;

    db.query(sqlUsuario, [idUsuario], (error, usuarios) => {
      if (error) {
        return res.status(500).json({ mensaje: "Error al obtener usuario" });
      }

      if (usuarios.length === 0) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      const idRol = usuarios[0].id_rol;

      const sql =
        idRol === 2
          ? `
            SELECT 
              r.id_recurso,
              r.titulo,
              r.formato,
              r.estado_aprobacion AS estado,
              r.fecha_registro AS fecha,
              c.nombre_categoria AS materia
            FROM recurso r
            LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
            WHERE r.id_usuario_subida = ?
            ORDER BY r.fecha_registro DESC
            LIMIT 10
          `
          : `
            SELECT 
              r.id_recurso,
              r.titulo,
              r.formato,
              'Consultado' AS estado,
              hv.fecha_visualizacion AS fecha,
              c.nombre_categoria AS materia
            FROM historial_visualizacion hv
            INNER JOIN recurso r ON hv.id_recurso = r.id_recurso
            LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
            WHERE hv.id_usuario = ?
            ORDER BY hv.fecha_visualizacion DESC
            LIMIT 10
          `;

      db.query(sql, [idUsuario], (errorDetalle, resultado) => {
        if (errorDetalle) {
          console.log("Error detalle recursos:", errorDetalle);
          return res.status(500).json({ mensaje: "Error al obtener recursos" });
        }

        res.json(resultado);
      });
    });

    return;
  }

  if (tipo === "favoritos") {
    const sql = `
      SELECT 
        fr.id_favorito,
        r.id_recurso,
        r.titulo,
        r.formato,
        fr.fecha_agregado,
        CONCAT(a.nombre_autor, ' ', a.apellido_autor) AS autor,
        c.nombre_categoria AS materia
      FROM favorito_recurso fr
      INNER JOIN recurso r ON fr.id_recurso = r.id_recurso
      LEFT JOIN autor a ON r.id_autor = a.id_autor
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
      WHERE fr.id_usuario = ?
      AND fr.estado = 1
      ORDER BY fr.fecha_agregado DESC
      LIMIT 10
    `;

    db.query(sql, [idUsuario], (error, resultado) => {
      if (error) {
        console.log("Error detalle favoritos:", error);
        return res.status(500).json({ mensaje: "Error al obtener favoritos" });
      }

      res.json(resultado);
    });

    return;
  }

  if (tipo === "solicitudes") {
    const sql = `
      SELECT 
        id_solicitud,
        titulo,
        estado,
        fecha,
        observacion,
        motivo_rechazo
      FROM solicitud
      WHERE id_usuario = ?
      ORDER BY fecha DESC
      LIMIT 10
    `;

    db.query(sql, [idUsuario], (error, resultado) => {
      if (error) {
        console.log("Error detalle solicitudes:", error);
        return res.status(500).json({ mensaje: "Error al obtener solicitudes" });
      }

      res.json(resultado);
    });

    return;
  }

  res.status(400).json({ mensaje: "Tipo de detalle no válido" });
};

const actualizarPerfil = (req, res) => {
  const { idUsuario } = req.params;

  const {
    nombre,
    apellido,
    telefono,
    direccion,
    fecha_nacimiento,
    genero,
    biografia,
    carrera,
    semestre,
    registro_universitario,
    especialidad,
    departamento,
    codigo_docente,
  } = req.body;

  const sqlUsuario = `
    UPDATE usuario
    SET nombre = ?, apellido = ?
    WHERE id_usuario = ?
  `;

  db.query(sqlUsuario, [nombre, apellido, idUsuario], (errorUsuario) => {
    if (errorUsuario) {
      console.log("Error al actualizar usuario:", errorUsuario);
      return res.status(500).json({ mensaje: "Error al actualizar usuario" });
    }

    const sqlPerfil = `
      INSERT INTO perfil_usuario
      (id_usuario, telefono, direccion, fecha_nacimiento, genero, biografia)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telefono = VALUES(telefono),
        direccion = VALUES(direccion),
        fecha_nacimiento = VALUES(fecha_nacimiento),
        genero = VALUES(genero),
        biografia = VALUES(biografia)
    `;

    db.query(
      sqlPerfil,
      [
        idUsuario,
        telefono || null,
        direccion || null,
        fecha_nacimiento || null,
        genero || "NO_ESPECIFICA",
        biografia || null,
      ],
      (errorPerfil) => {
        if (errorPerfil) {
          console.log("Error al actualizar perfil:", errorPerfil);
          return res.status(500).json({ mensaje: "Error al actualizar perfil" });
        }

        const sqlRol = `
          SELECT id_rol 
          FROM usuario 
          WHERE id_usuario = ?
          LIMIT 1
        `;

        db.query(sqlRol, [idUsuario], (errorRol, usuarios) => {
          if (errorRol || usuarios.length === 0) {
            return res.json({ mensaje: "Perfil actualizado correctamente" });
          }

          const idRol = usuarios[0].id_rol;

          if (idRol === 2) {
            const sqlDocente = `
              INSERT INTO perfil_docente
              (id_usuario, codigo_docente, especialidad, departamento)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                codigo_docente = VALUES(codigo_docente),
                especialidad = VALUES(especialidad),
                departamento = VALUES(departamento)
            `;

            db.query(
              sqlDocente,
              [
                idUsuario,
                codigo_docente || null,
                especialidad || null,
                departamento || null,
              ],
              (errorDocente) => {
                if (errorDocente) {
                  console.log("Error docente:", errorDocente);
                  return res.status(500).json({ mensaje: "Error al actualizar docente" });
                }

                res.json({ mensaje: "Perfil actualizado correctamente" });
              }
            );

            return;
          }

          const sqlEstudiante = `
            INSERT INTO perfil_estudiante
            (id_usuario, registro_universitario, id_carrera, id_semestre_actual)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              registro_universitario = VALUES(registro_universitario),
              id_carrera = VALUES(id_carrera),
              id_semestre_actual = VALUES(id_semestre_actual)
          `;

          db.query(
            sqlEstudiante,
            [
              idUsuario,
              registro_universitario || null,
              carrera || null,
              semestre || null,
            ],
            (errorEstudiante) => {
              if (errorEstudiante) {
                console.log("Error estudiante:", errorEstudiante);
                return res.status(500).json({ mensaje: "Error al actualizar estudiante" });
              }

              res.json({ mensaje: "Perfil actualizado correctamente" });
            }
          );
        });
      }
    );
  });
};

module.exports = {
  obtenerPerfil,
  obtenerResumenPerfil,
  obtenerDetallePerfil,
  actualizarPerfil,
};