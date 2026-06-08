const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const db = require("../../config/db").promise();

const clavesPermitidas = {
  nombreSistema: { tipo: "TEXTO", seccion: "general" },
  institucion: { tipo: "TEXTO", seccion: "general" },
  responsable: { tipo: "TEXTO", seccion: "general" },
  correoSoporte: { tipo: "TEXTO", seccion: "general" },
  descripcion: { tipo: "TEXTO", seccion: "general" },

  aprobacionRecursos: { tipo: "BOOLEANO", seccion: "biblioteca" },
  permitirSubidaDocentes: { tipo: "BOOLEANO", seccion: "biblioteca" },
  permitirSubidaEstudiantes: { tipo: "BOOLEANO", seccion: "biblioteca" },
  mostrarRecursosPendientes: { tipo: "BOOLEANO", seccion: "biblioteca" },

  autenticacionDoble: { tipo: "BOOLEANO", seccion: "seguridad" },
  bloqueoSesion: { tipo: "TEXTO", seccion: "seguridad" },
  modoMantenimiento: { tipo: "BOOLEANO", seccion: "seguridad" },
  registroActividad: { tipo: "BOOLEANO", seccion: "seguridad" },

  respaldoAutomatico: { tipo: "BOOLEANO", seccion: "respaldo" },
  frecuenciaRespaldo: { tipo: "TEXTO", seccion: "respaldo" },
  conservacionRespaldos: { tipo: "TEXTO", seccion: "respaldo" },

  footer_titulo: { tipo: "TEXTO", seccion: "footer" },
  footer_descripcion: { tipo: "TEXTO", seccion: "footer" },
  footer_badge_1: { tipo: "TEXTO", seccion: "footer" },
  footer_badge_2: { tipo: "TEXTO", seccion: "footer" },

  footer_titulo_recursos: { tipo: "TEXTO", seccion: "footer" },
  footer_mostrar_catalogo: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_favoritos: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_historial: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_sugerir: { tipo: "BOOLEANO", seccion: "footer" },

  footer_titulo_cuenta: { tipo: "TEXTO", seccion: "footer" },
  footer_mostrar_perfil: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_solicitudes: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_configuracion: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_cerrar_sesion: { tipo: "BOOLEANO", seccion: "footer" },

  footer_titulo_contacto: { tipo: "TEXTO", seccion: "footer" },
  footer_direccion: { tipo: "TEXTO", seccion: "footer" },
  footer_correo: { tipo: "TEXTO", seccion: "footer" },
  footer_horario: { tipo: "TEXTO", seccion: "footer" },
  footer_telefono: { tipo: "TEXTO", seccion: "footer" },

  footer_copyright: { tipo: "TEXTO", seccion: "footer" },
  footer_mostrar_facebook: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_instagram: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_youtube: { tipo: "BOOLEANO", seccion: "footer" },
  footer_mostrar_whatsapp: { tipo: "BOOLEANO", seccion: "footer" },
};

const valoresPorDefecto = [
  [
    "nombreSistema",
    "SITEC Biblioteca Digital",
    "TEXTO",
    "general",
    "Nombre principal del sistema",
  ],
  [
    "institucion",
    "Facultad de Tecnología - UMSA",
    "TEXTO",
    "general",
    "Institución responsable",
  ],
  [
    "responsable",
    "Administrador SITEC",
    "TEXTO",
    "general",
    "Responsable administrativo",
  ],
[
  "correoSoporte",
  "soporte.sitec@umsa.bo",
  "TEXTO",
  "general",
  "Correo de soporte",
],
  [
    "descripcion",
    "Sistema administrativo para la gestión, revisión y publicación de recursos digitales académicos.",
    "TEXTO",
    "general",
    "Descripción institucional",
  ],

  [
    "aprobacionRecursos",
    "1",
    "BOOLEANO",
    "biblioteca",
    "Aprobación obligatoria de recursos",
  ],
  [
    "permitirSubidaDocentes",
    "1",
    "BOOLEANO",
    "biblioteca",
    "Permitir carga por docentes",
  ],
  [
    "permitirSubidaEstudiantes",
    "1",
    "BOOLEANO",
    "biblioteca",
    "Permitir sugerencias de estudiantes",
  ],
  [
    "mostrarRecursosPendientes",
    "1",
    "BOOLEANO",
    "biblioteca",
    "Mostrar pendientes en panel",
  ],

  [
    "autenticacionDoble",
    "0",
    "BOOLEANO",
    "seguridad",
    "Autenticación en dos pasos",
  ],
  [
    "bloqueoSesion",
    "30 minutos",
    "TEXTO",
    "seguridad",
    "Tiempo de bloqueo de sesión",
  ],
  [
    "modoMantenimiento",
    "0",
    "BOOLEANO",
    "seguridad",
    "Modo mantenimiento",
  ],
  [
    "registroActividad",
    "1",
    "BOOLEANO",
    "seguridad",
    "Registro de actividad",
  ],

  [
    "respaldoAutomatico",
    "0",
    "BOOLEANO",
    "respaldo",
    "Respaldo automático",
  ],
  [
    "frecuenciaRespaldo",
    "Semanal",
    "TEXTO",
    "respaldo",
    "Frecuencia de respaldo",
  ],
 [
  "conservacionRespaldos",
  "90 días",
  "TEXTO",
  "respaldo",
  "Conservación de respaldos",
],

["footer_titulo", "SITEC", "TEXTO", "footer", "Título principal del footer"],
[
  "footer_descripcion",
  "Sistema Integrado de Tecnología y Conocimiento de la Facultad de Tecnología. Accede, comparte y gestiona recursos académicos de manera eficiente.",
  "TEXTO",
  "footer",
  "Descripción del footer",
],
["footer_badge_1", "UMSA", "TEXTO", "footer", "Primera insignia del footer"],
["footer_badge_2", "Fac. Tecnología", "TEXTO", "footer", "Segunda insignia del footer"],

["footer_titulo_recursos", "Recursos", "TEXTO", "footer", "Título columna recursos"],
["footer_mostrar_catalogo", "1", "BOOLEANO", "footer", "Mostrar enlace catálogo"],
["footer_mostrar_favoritos", "1", "BOOLEANO", "footer", "Mostrar enlace favoritos"],
["footer_mostrar_historial", "1", "BOOLEANO", "footer", "Mostrar enlace historial"],
["footer_mostrar_sugerir", "1", "BOOLEANO", "footer", "Mostrar enlace sugerir libro"],

["footer_titulo_cuenta", "Mi Cuenta", "TEXTO", "footer", "Título columna mi cuenta"],
["footer_mostrar_perfil", "1", "BOOLEANO", "footer", "Mostrar enlace perfil"],
["footer_mostrar_solicitudes", "1", "BOOLEANO", "footer", "Mostrar enlace solicitudes"],
["footer_mostrar_configuracion", "1", "BOOLEANO", "footer", "Mostrar enlace configuración"],
["footer_mostrar_cerrar_sesion", "1", "BOOLEANO", "footer", "Mostrar enlace cerrar sesión"],

["footer_titulo_contacto", "Contacto", "TEXTO", "footer", "Título columna contacto"],
[
  "footer_direccion",
  "Av. Villazón esq. Calle 27, La Paz, Bolivia",
  "TEXTO",
  "footer",
  "Dirección institucional",
],
["footer_correo", "sitec@umsa.bo", "TEXTO", "footer", "Correo visible del footer"],
["footer_horario", "Lun – Vie, 08:00 – 18:00", "TEXTO", "footer", "Horario de atención"],
["footer_telefono", "(+591-2) 244-0565", "TEXTO", "footer", "Teléfono institucional"],

[
  "footer_copyright",
  "SITEC – Facultad de Tecnología",
  "TEXTO",
  "footer",
  "Texto de derechos reservados",
],
["footer_mostrar_facebook", "1", "BOOLEANO", "footer", "Mostrar icono Facebook"],
["footer_mostrar_instagram", "1", "BOOLEANO", "footer", "Mostrar icono Instagram"],
["footer_mostrar_youtube", "1", "BOOLEANO", "footer", "Mostrar icono YouTube"],
["footer_mostrar_whatsapp", "1", "BOOLEANO", "footer", "Mostrar icono WhatsApp"],
];

function convertirValor(valor, tipo) {
  if (tipo === "BOOLEANO") {
    return valor === "1" || valor === 1 || valor === true;
  }

  return valor || "";
}

function prepararValor(valor, tipo) {
  if (tipo === "BOOLEANO") {
    return valor ? "1" : "0";
  }

  return valor ?? "";
}

async function asegurarConfiguracionBase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS configuracion_sistema (
      id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
      clave VARCHAR(100) NOT NULL UNIQUE,
      valor TEXT NULL,
      tipo ENUM('TEXTO','BOOLEANO','NUMERO') DEFAULT 'TEXTO',
      seccion VARCHAR(50) NOT NULL,
      descripcion TEXT NULL,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  for (const item of valoresPorDefecto) {
    const [clave, valor, tipo, seccion, descripcion] = item;

    await db.query(
      `
      INSERT INTO configuracion_sistema
        (clave, valor, tipo, seccion, descripcion)
      VALUES
        (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tipo = VALUES(tipo),
        seccion = VALUES(seccion),
        descripcion = VALUES(descripcion)
      `,
      [clave, valor, tipo, seccion, descripcion]
    );
  }
}

const obtenerConfiguracion = async (req, res) => {
  try {
    await asegurarConfiguracionBase();

    const [filas] = await db.query(`
      SELECT 
        clave,
        valor,
        tipo,
        seccion,
        descripcion,
        fecha_actualizacion
      FROM configuracion_sistema
      ORDER BY seccion, clave
    `);

    const configuracion = {};

    filas.forEach((item) => {
      if (clavesPermitidas[item.clave]) {
        configuracion[item.clave] = convertirValor(item.valor, item.tipo);
      }
    });

    return res.json({
      ok: true,
      configuracion,
      registros: filas,
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener configuración del sistema",
      error: error.message,
    });
  }
};
const obtenerFooter = async (req, res) => {
  try {
    await asegurarConfiguracionBase();

    const [filas] = await db.query(
      `
      SELECT clave, valor, tipo
      FROM configuracion_sistema
      WHERE seccion = 'footer'
      ORDER BY clave ASC
      `
    );

    const footer = {};

    filas.forEach((item) => {
      footer[item.clave] = convertirValor(item.valor, item.tipo);
    });

    return res.json({
      ok: true,
      footer,
    });
  } catch (error) {
    console.error("Error al obtener footer:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener configuración del footer",
      error: error.message,
    });
  }
};
const actualizarConfiguracion = async (req, res) => {
  try {
    await asegurarConfiguracionBase();

    const configuracion = req.body || {};
    const claves = Object.keys(configuracion);

    if (claves.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se recibieron datos para actualizar",
      });
    }

    for (const clave of claves) {
      if (!clavesPermitidas[clave]) {
        continue;
      }

      const info = clavesPermitidas[clave];
      const valor = prepararValor(configuracion[clave], info.tipo);

      await db.query(
        `
        INSERT INTO configuracion_sistema
          (clave, valor, tipo, seccion)
        VALUES
          (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          valor = VALUES(valor),
          tipo = VALUES(tipo),
          seccion = VALUES(seccion),
          fecha_actualizacion = NOW()
        `,
        [clave, valor, info.tipo, info.seccion]
      );
    }

    return res.json({
      ok: true,
      mensaje: "Configuración actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar configuración",
      error: error.message,
    });
  }
};

const restaurarConfiguracion = async (req, res) => {
  try {
    await asegurarConfiguracionBase();

    for (const item of valoresPorDefecto) {
      const [clave, valor, tipo, seccion, descripcion] = item;

      await db.query(
        `
        INSERT INTO configuracion_sistema
          (clave, valor, tipo, seccion, descripcion)
        VALUES
          (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          valor = VALUES(valor),
          tipo = VALUES(tipo),
          seccion = VALUES(seccion),
          descripcion = VALUES(descripcion),
          fecha_actualizacion = NOW()
        `,
        [clave, valor, tipo, seccion, descripcion]
      );
    }

    return res.json({
      ok: true,
      mensaje: "Configuración restaurada correctamente",
    });
  } catch (error) {
    console.error("Error al restaurar configuración:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al restaurar configuración",
      error: error.message,
    });
  }
};

const generarRespaldo = async (req, res) => {
  try {
    const carpetaBackups = path.join(__dirname, "../../backups");

    if (!fs.existsSync(carpetaBackups)) {
      fs.mkdirSync(carpetaBackups, { recursive: true });
    }

    const fecha = new Date()
      .toISOString()
      .replace("T", "_")
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    const nombreArchivo = `bdsitec_backup_${fecha}.sql`;
    const rutaArchivo = path.join(carpetaBackups, nombreArchivo);

    const posiblesRutasMysqldump = [
      "C:\\xampp\\mysql\\bin\\mysqldump.exe",
      "mysqldump",
    ];

    const mysqldumpPath = fs.existsSync(posiblesRutasMysqldump[0])
      ? posiblesRutasMysqldump[0]
      : posiblesRutasMysqldump[1];

    const argumentos = [
      "-h",
      "localhost",
      "-u",
      "root",
      "--databases",
      "bdsitec",
      "--routines",
      "--triggers",
      "--events",
      "--single-transaction",
      "--default-character-set=utf8mb4",
    ];

    const salida = fs.createWriteStream(rutaArchivo);

    const proceso = spawn(mysqldumpPath, argumentos);

    proceso.stdout.pipe(salida);

    let errorDump = "";

    proceso.stderr.on("data", (data) => {
      errorDump += data.toString();
    });

    proceso.on("error", (error) => {
      console.error("Error al ejecutar mysqldump:", error);

      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
      }

      return res.status(500).json({
        ok: false,
        mensaje: "No se pudo ejecutar mysqldump. Verifica la ruta de XAMPP.",
        error: error.message,
      });
    });

    proceso.on("close", async (codigo) => {
      salida.end();

      if (codigo !== 0) {
        console.error("Error mysqldump:", errorDump);

        if (fs.existsSync(rutaArchivo)) {
          fs.unlinkSync(rutaArchivo);
        }

        return res.status(500).json({
          ok: false,
          mensaje: "No se pudo generar el respaldo de la base de datos",
          error: errorDump || `mysqldump finalizó con código ${codigo}`,
        });
      }

      await db.query(
        `
        INSERT INTO configuracion_sistema
          (clave, valor, tipo, seccion, descripcion)
        VALUES
          ('ultimoRespaldo', ?, 'TEXTO', 'respaldo', 'Fecha del último respaldo generado')
        ON DUPLICATE KEY UPDATE
          valor = VALUES(valor),
          fecha_actualizacion = NOW()
        `,
        [new Date().toISOString()]
      );

      return res.download(rutaArchivo, nombreArchivo, (error) => {
        if (error) {
          console.error("Error al descargar respaldo:", error);
        }
      });
    });
  } catch (error) {
    console.error("Error al generar respaldo:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al generar respaldo",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  obtenerFooter,
  actualizarConfiguracion,
  restaurarConfiguracion,
  generarRespaldo,
};