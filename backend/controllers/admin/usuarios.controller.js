const db = require("../../config/db").promise();
const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");

const DOMINIO_CORREO = "@umsa.bo";

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
};

const normalizarTexto = (valor) => {
  return limpiarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const obtenerIdRol = async (nombreRol) => {
  const [roles] = await db.query(
    "SELECT id_rol FROM rol WHERE nombre_rol = ? LIMIT 1",
    [nombreRol]
  );

  if (roles.length === 0) {
    throw new Error(`El rol ${nombreRol} no existe`);
  }

  return roles[0].id_rol;
};

const obtenerIdCarrera = async (valorCarrera) => {
  const carreraTexto = limpiarTexto(valorCarrera);

  if (!carreraTexto) return null;

  if (/^\d+$/.test(carreraTexto)) {
    const [carreras] = await db.query(
      `
      SELECT id_carrera
      FROM carrera
      WHERE id_carrera = ?
      AND IFNULL(estado, 1) = 1
      LIMIT 1
      `,
      [Number(carreraTexto)]
    );

    if (carreras.length > 0) return carreras[0].id_carrera;
  }

  const [carreras] = await db.query(
    `
    SELECT id_carrera
    FROM carrera
    WHERE IFNULL(estado, 1) = 1
    AND (
      LOWER(nombre_carrera) = LOWER(?)
      OR LOWER(sigla) = LOWER(?)
    )
    LIMIT 1
    `,
    [carreraTexto, carreraTexto]
  );

  if (carreras.length > 0) return carreras[0].id_carrera;

  const [carrerasParciales] = await db.query(
    `
    SELECT id_carrera
    FROM carrera
    WHERE IFNULL(estado, 1) = 1
    AND LOWER(nombre_carrera) LIKE LOWER(?)
    LIMIT 1
    `,
    [`%${carreraTexto}%`]
  );

  if (carrerasParciales.length > 0) {
    return carrerasParciales[0].id_carrera;
  }

  return null;
};

const validarCorreoInstitucional = (correo) => {
  return limpiarTexto(correo).toLowerCase().endsWith(DOMINIO_CORREO);
};

const existeUsuarioDuplicado = async ({
  correo,
  carnet,
  registro_universitario,
  idExcluir = null,
}) => {
  const parametros = [
    limpiarTexto(correo).toLowerCase(),
    limpiarTexto(carnet),
    limpiarTexto(registro_universitario),
  ];

  let condicionExtra = "";

  if (idExcluir) {
    condicionExtra = "AND id_usuario <> ?";
    parametros.push(idExcluir);
  }

  const [usuarios] = await db.query(
    `
    SELECT id_usuario, correo, carnet, registro_universitario
    FROM usuario
    WHERE (
      correo = ?
      OR carnet = ?
      OR registro_universitario = ?
    )
    ${condicionExtra}
    LIMIT 1
    `,
    parametros
  );

  return usuarios[0] || null;
};

const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT
        u.id_usuario AS id,
        u.nombre AS nombre_personal,
        u.apellido,
        u.carnet,
        u.registro_universitario,
        u.debe_cambiar_password,
        TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre,
        u.correo,
        r.nombre_rol AS rol,
        u.id_carrera,
        COALESCE(
          c.nombre_carrera,
          CASE 
            WHEN r.nombre_rol = 'Administrador' THEN 'Facultad de Tecnología'
            ELSE 'Sin carrera asignada'
          END
        ) AS carrera,
        CASE 
          WHEN IFNULL(u.estado, 1) = 1 THEN 'Activo'
          ELSE 'Inactivo'
        END AS estado,
        DATE_FORMAT(u.fecha_registro, '%d/%m/%Y') AS fechaRegistro,
        CASE
          WHEN u.ultimo_acceso IS NULL THEN 'Sin acceso registrado'
          ELSE DATE_FORMAT(u.ultimo_acceso, '%d/%m/%Y %H:%i')
        END AS ultimoAcceso,
        COALESCE(d.recursos, 0) AS recursos
      FROM usuario u
      LEFT JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN carrera c ON u.id_carrera = c.id_carrera
      LEFT JOIN (
        SELECT id_usuario, COUNT(*) AS recursos
        FROM descarga
        GROUP BY id_usuario
      ) d ON u.id_usuario = d.id_usuario
      ORDER BY u.id_usuario DESC
    `);

    const [[metricas]] = await db.query(`
      SELECT
        COUNT(*) AS totalUsuarios,
        SUM(CASE WHEN IFNULL(u.estado, 1) = 1 THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN r.nombre_rol = 'Estudiante' THEN 1 ELSE 0 END) AS estudiantes,
        SUM(CASE WHEN r.nombre_rol = 'Docente' THEN 1 ELSE 0 END) AS docentes,
        SUM(CASE WHEN r.nombre_rol = 'Administrador' THEN 1 ELSE 0 END) AS administradores
      FROM usuario u
      LEFT JOIN rol r ON u.id_rol = r.id_rol
    `);

    const [roles] = await db.query(`
      SELECT id_rol, nombre_rol
      FROM rol
      ORDER BY nombre_rol ASC
    `);

    const [carreras] = await db.query(`
      SELECT id_carrera, nombre_carrera, sigla, tipo
      FROM carrera
      WHERE IFNULL(estado, 1) = 1
      ORDER BY 
        CASE WHEN tipo = 'DEPARTAMENTO' THEN 1 ELSE 0 END,
        nombre_carrera ASC
    `);

    res.json({
      ok: true,
      usuarios,
      metricas: {
        totalUsuarios: Number(metricas.totalUsuarios || 0),
        activos: Number(metricas.activos || 0),
        estudiantes: Number(metricas.estudiantes || 0),
        docentes: Number(metricas.docentes || 0),
        administradores: Number(metricas.administradores || 0),
      },
      roles: roles.map((rol) => rol.nombre_rol),
      carreras,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar usuarios",
      error: error.message,
    });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      carnet,
      registro_universitario,
      correo,
      rol,
      id_carrera,
      contrasena,
      estado = "Activo",
    } = req.body;

    if (!nombre || !apellido || !correo || !rol) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre, apellido, correo y rol son obligatorios",
      });
    }

    if (!validarCorreoInstitucional(correo)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Solo se permiten correos institucionales @umsa.bo",
      });
    }

    if (rol === "Estudiante") {
      if (!carnet || !registro_universitario) {
        return res.status(400).json({
          ok: false,
          mensaje: "Carnet y registro universitario son obligatorios para estudiantes",
        });
      }
    }

    const duplicado = await existeUsuarioDuplicado({
      correo,
      carnet,
      registro_universitario,
    });

    if (duplicado) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe un usuario con ese correo, carnet o registro universitario",
      });
    }

    const idRol = await obtenerIdRol(rol);
    const passwordInicial = limpiarTexto(contrasena) || limpiarTexto(carnet) || "123456";
    const passwordHash = await bcrypt.hash(passwordInicial, 10);

    const [resultado] = await db.query(
      `
      INSERT INTO usuario (
        id_rol,
        id_carrera,
        nombre,
        apellido,
        carnet,
        registro_universitario,
        correo,
        contrasena,
        debe_cambiar_password,
        fecha_cambio_password,
        estado,
        fecha_registro
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NOW())
      `,
      [
        idRol,
        id_carrera || null,
        limpiarTexto(nombre),
        limpiarTexto(apellido),
        limpiarTexto(carnet) || null,
        limpiarTexto(registro_universitario) || null,
        limpiarTexto(correo).toLowerCase(),
        passwordHash,
        rol === "Estudiante" ? 1 : 0,
        estado === "Activo" ? 1 : 0,
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado correctamente",
      id: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al registrar usuario",
      error: error.message,
    });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      apellido,
      carnet,
      registro_universitario,
      correo,
      rol,
      id_carrera,
      contrasena,
      estado = "Activo",
    } = req.body;

    if (!nombre || !apellido || !correo || !rol) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre, apellido, correo y rol son obligatorios",
      });
    }

    if (!validarCorreoInstitucional(correo)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Solo se permiten correos institucionales @umsa.bo",
      });
    }

    if (rol === "Estudiante") {
      if (!carnet || !registro_universitario) {
        return res.status(400).json({
          ok: false,
          mensaje: "Carnet y registro universitario son obligatorios para estudiantes",
        });
      }
    }

    const duplicado = await existeUsuarioDuplicado({
      correo,
      carnet,
      registro_universitario,
      idExcluir: id,
    });

    if (duplicado) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe otro usuario con ese correo, carnet o registro universitario",
      });
    }

    const idRol = await obtenerIdRol(rol);

    if (contrasena && contrasena.trim() !== "") {
      const passwordHash = await bcrypt.hash(contrasena, 10);

      await db.query(
        `
        UPDATE usuario
        SET
          id_rol = ?,
          id_carrera = ?,
          nombre = ?,
          apellido = ?,
          carnet = ?,
          registro_universitario = ?,
          correo = ?,
          contrasena = ?,
          debe_cambiar_password = ?,
          estado = ?
        WHERE id_usuario = ?
        `,
        [
          idRol,
          id_carrera || null,
          limpiarTexto(nombre),
          limpiarTexto(apellido),
          limpiarTexto(carnet) || null,
          limpiarTexto(registro_universitario) || null,
          limpiarTexto(correo).toLowerCase(),
          passwordHash,
          rol === "Estudiante" ? 1 : 0,
          estado === "Activo" ? 1 : 0,
          id,
        ]
      );
    } else {
      await db.query(
        `
        UPDATE usuario
        SET
          id_rol = ?,
          id_carrera = ?,
          nombre = ?,
          apellido = ?,
          carnet = ?,
          registro_universitario = ?,
          correo = ?,
          estado = ?
        WHERE id_usuario = ?
        `,
        [
          idRol,
          id_carrera || null,
          limpiarTexto(nombre),
          limpiarTexto(apellido),
          limpiarTexto(carnet) || null,
          limpiarTexto(registro_universitario) || null,
          limpiarTexto(correo).toLowerCase(),
          estado === "Activo" ? 1 : 0,
          id,
        ]
      );
    }

    res.json({
      ok: true,
      mensaje: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar usuario",
      error: error.message,
    });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const nuevoEstado = estado === "Activo" ? 1 : 0;

    const [resultado] = await db.query(
      `
      UPDATE usuario
      SET estado = ?
      WHERE id_usuario = ?
      `,
      [nuevoEstado, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      ok: true,
      mensaje: "Estado del usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al cambiar estado del usuario",
      error: error.message,
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await db.query(
      `
      UPDATE usuario
      SET estado = 0
      WHERE id_usuario = ?
      `,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      ok: true,
      mensaje: "Usuario desactivado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al desactivar usuario",
      error: error.message,
    });
  }
};

function normalizarEncabezado(valor) {
  return normalizarTexto(valor)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function obtenerValorFila(filaNormalizada, alias) {
  for (const nombre of alias) {
    if (filaNormalizada[nombre] !== undefined) {
      return limpiarTexto(filaNormalizada[nombre]);
    }
  }

  return "";
}

function limpiarParaCorreo(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "n")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

function separarNombreCompletoUMSA(nombreCompleto) {
  const partes = String(nombreCompleto || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  /*
    Formato esperado:
    APELLIDO_PATERNO APELLIDO_MATERNO PRIMER_NOMBRE SEGUNDO_NOMBRE
    Ejemplo:
    LARICO TICONA LUIS FERNANDO
  */

  if (partes.length >= 4) {
    const apellidoPaterno = partes[0];
    const apellidoMaterno = partes[1];
    const nombresArray = partes.slice(2);

    return {
      nombre: nombresArray.join(" "),
      apellido: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
      apellidoPaterno,
      nombresArray,
    };
  }

  if (partes.length === 3) {
    const apellidoPaterno = partes[0];
    const apellidoMaterno = partes[1];
    const nombresArray = [partes[2]];

    return {
      nombre: nombresArray.join(" "),
      apellido: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
      apellidoPaterno,
      nombresArray,
    };
  }

  return {
    nombre: nombreCompleto,
    apellido: "",
    apellidoPaterno: "",
    nombresArray: partes,
  };
}

function generarCorreoUMSADesdeNombre(nombreCompleto) {
  const datos = separarNombreCompletoUMSA(nombreCompleto);

  const primerNombre = limpiarParaCorreo(datos.nombresArray[0] || "");
  const segundoNombre = limpiarParaCorreo(datos.nombresArray[1] || "");
  const apellidoPaterno = limpiarParaCorreo(datos.apellidoPaterno || "");

  if (!primerNombre || !apellidoPaterno) {
    return "";
  }

  const inicialPrimerNombre = primerNombre.charAt(0);
  const inicialSegundoNombre = segundoNombre ? segundoNombre.charAt(0) : "";

  return `${inicialPrimerNombre}${inicialSegundoNombre}${apellidoPaterno}@umsa.bo`;
}

function normalizarFilaExcel(fila) {
  const filaNormalizada = {};

  Object.keys(fila).forEach((clave) => {
    filaNormalizada[normalizarEncabezado(clave)] = fila[clave];
  });

  const nombreCompletoExcel = obtenerValorFila(filaNormalizada, [
    "nombres",
    "nombre",
    "nombre_completo",
    "estudiante",
    "apellidos_y_nombres",
    "apellido_y_nombre",
  ]);

  const datosNombre = separarNombreCompletoUMSA(nombreCompletoExcel);

  const apellidoDirecto = obtenerValorFila(filaNormalizada, [
    "apellido",
    "apellidos",
  ]);

  const apellidoPaterno = obtenerValorFila(filaNormalizada, [
    "apellido_paterno",
    "paterno",
  ]);

  const apellidoMaterno = obtenerValorFila(filaNormalizada, [
    "apellido_materno",
    "materno",
  ]);

  const correoExcel = obtenerValorFila(filaNormalizada, [
    "correo",
    "email",
    "correo_institucional",
  ]);

  const correoGenerado =
    correoExcel || generarCorreoUMSADesdeNombre(nombreCompletoExcel);

  return {
    nombre:
      datosNombre.nombre ||
      obtenerValorFila(filaNormalizada, [
        "nombre",
        "primer_nombre",
      ]),

    apellido:
      datosNombre.apellido ||
      apellidoDirecto ||
      `${apellidoPaterno} ${apellidoMaterno}`.trim(),

    carnet: obtenerValorFila(filaNormalizada, [
      "carnet",
      "ci",
      "c_i",
      "cedula",
      "cedula_identidad",
      "carnet_identidad",
      "carnet_de_identidad",
    ]),

    registro_universitario: obtenerValorFila(filaNormalizada, [
      "registro_universitario",
      "reg_univ",
      "reg_univ_",
      "ru",
      "registro",
      "registro_univ",
    ]),

    matricula: obtenerValorFila(filaNormalizada, [
      "matric",
      "matric_",
      "matricula",
    ]),

    categoria: obtenerValorFila(filaNormalizada, [
      "categoria",
    ]),

    tipo: obtenerValorFila(filaNormalizada, [
      "tipo",
    ]),

    correo: correoGenerado,

    carrera: obtenerValorFila(filaNormalizada, [
      "carrera",
      "nombre_carrera",
      "sigla_carrera",
      "id_carrera",
      "fac_carr_sede",
    ]),

    contrasena: obtenerValorFila(filaNormalizada, [
      "contrasena",
      "contraseña",
      "password",
      "clave",
    ]),
  };
}

function leerFilasExcelUMSA(hoja) {
  const matriz = XLSX.utils.sheet_to_json(hoja, {
    header: 1,
    defval: "",
    raw: false,
  });

  let indiceEncabezado = -1;

  for (let i = 0; i < matriz.length; i += 1) {
    const filaNormalizada = matriz[i].map((celda) =>
      normalizarEncabezado(celda)
    );

    const tieneNombres = filaNormalizada.includes("nombres");

    const tieneCI =
      filaNormalizada.includes("c_i") ||
      filaNormalizada.includes("ci");

    const tieneRegistro =
      filaNormalizada.includes("reg_univ") ||
      filaNormalizada.includes("registro_universitario") ||
      filaNormalizada.includes("ru");

    if (tieneNombres && tieneCI && tieneRegistro) {
      indiceEncabezado = i;
      break;
    }
  }

  if (indiceEncabezado === -1) {
    throw new Error(
      "No se encontró la fila de encabezados. Verifica que el Excel tenga columnas NOMBRES, Reg.Univ. y C.I."
    );
  }

  const encabezados = matriz[indiceEncabezado].map((celda) =>
    normalizarEncabezado(celda)
  );

  const filas = [];

  for (let i = indiceEncabezado + 1; i < matriz.length; i += 1) {
    const filaActual = matriz[i];

    const estaVacia = filaActual.every(
      (celda) => limpiarTexto(celda) === ""
    );

    if (estaVacia) continue;

    const objeto = {};

    encabezados.forEach((encabezado, index) => {
      if (encabezado) {
        objeto[encabezado] = filaActual[index] ?? "";
      }
    });

    objeto.__numeroFila = i + 1;

    const posibleNombre = limpiarTexto(objeto.nombres || objeto.nombre);
    const posibleCI = limpiarTexto(objeto.c_i || objeto.ci);

    if (!posibleNombre && !posibleCI) continue;

    filas.push(objeto);
  }

  return filas;
}

const matriculacionMasiva = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debes seleccionar un archivo Excel o CSV",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: false,
    });

    const nombreHoja = workbook.SheetNames[0];

    if (!nombreHoja) {
      return res.status(400).json({
        ok: false,
        mensaje: "El archivo no contiene hojas válidas",
      });
    }

    const hoja = workbook.Sheets[nombreHoja];

    const filas = leerFilasExcelUMSA(hoja);

    if (!filas.length) {
      return res.status(400).json({
        ok: false,
        mensaje: "El archivo no contiene estudiantes para registrar",
      });
    }

    const idRolEstudiante = await obtenerIdRol("Estudiante");

    const resumen = {
      totalFilas: filas.length,
      registrados: 0,
      duplicados: 0,
      errores: 0,
    };

    const detalle = [];

    const idCarreraFormulario =
      req.body.id_carrera ||
      req.body.idCarrera ||
      req.body.carrera ||
      null;

    for (let index = 0; index < filas.length; index += 1) {
      const numeroFila = filas[index].__numeroFila || index + 2;
      const estudiante = normalizarFilaExcel(filas[index]);

      try {
        if (!estudiante.nombre) {
          throw new Error("Falta el nombre");
        }

        if (!estudiante.apellido) {
          throw new Error("Falta el apellido");
        }

        if (!estudiante.carnet) {
          throw new Error("Falta el carnet");
        }

        if (!estudiante.registro_universitario) {
          throw new Error("Falta el registro universitario");
        }

        if (!estudiante.correo) {
          throw new Error("No se pudo generar el correo institucional desde el nombre");
        }

        if (!validarCorreoInstitucional(estudiante.correo)) {
          throw new Error("El correo generado no pertenece al dominio @umsa.bo");
        }

        const carreraReferencia = idCarreraFormulario || estudiante.carrera;

        if (!carreraReferencia) {
          throw new Error(
            "Falta la carrera. Selecciona una carrera o incluye FAC.CARR.SEDE en el Excel"
          );
        }

        const idCarrera = await obtenerIdCarrera(carreraReferencia);

        if (!idCarrera) {
          throw new Error(`No se encontró la carrera: ${carreraReferencia}`);
        }

        const duplicado = await existeUsuarioDuplicado({
          correo: estudiante.correo,
          carnet: estudiante.carnet,
          registro_universitario: estudiante.registro_universitario,
        });

        if (duplicado) {
          resumen.duplicados += 1;

          detalle.push({
            fila: numeroFila,
            estado: "DUPLICADO",
            estudiante: `${estudiante.nombre} ${estudiante.apellido}`,
            motivo: "Ya existe un usuario con ese correo, carnet o registro universitario",
          });

          continue;
        }

        const passwordInicial = estudiante.contrasena || estudiante.carnet;
        const passwordHash = await bcrypt.hash(passwordInicial, 10);

        const [resultado] = await db.query(
          `
          INSERT INTO usuario (
            id_rol,
            id_carrera,
            nombre,
            apellido,
            carnet,
            registro_universitario,
            correo,
            contrasena,
            debe_cambiar_password,
            fecha_cambio_password,
            estado,
            fecha_registro
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, 1, NOW())
          `,
          [
            idRolEstudiante,
            idCarrera,
            estudiante.nombre,
            estudiante.apellido,
            estudiante.carnet,
            estudiante.registro_universitario,
            estudiante.correo.toLowerCase(),
            passwordHash,
          ]
        );

        await db.query(
          `
          INSERT IGNORE INTO configuracion_usuario (id_usuario)
          VALUES (?)
          `,
          [resultado.insertId]
        );

        resumen.registrados += 1;

        detalle.push({
          fila: numeroFila,
          estado: "REGISTRADO",
          estudiante: `${estudiante.nombre} ${estudiante.apellido}`,
          motivo: "Registrado correctamente",
        });
      } catch (error) {
        resumen.errores += 1;

        detalle.push({
          fila: numeroFila,
          estado: "ERROR",
          estudiante: `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim(),
          motivo: error.message,
        });
      }
    }

    return res.json({
      ok: true,
      mensaje: "Matriculación masiva procesada",
      resumen,
      detalle,
    });
  } catch (error) {
    console.error("Error en matriculación masiva:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al procesar la matriculación masiva",
      error: error.message,
    });
  }
};

module.exports = {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
  matriculacionMasiva,
};